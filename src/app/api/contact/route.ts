import { NextResponse } from 'next/server'
import { createContactMessage } from '@/lib/news-repository'

interface ContactPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

const submissions = new Map<string, number[]>()

function isRateLimited(request: Request): boolean {
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  const cutoff = Date.now() - 10 * 60 * 1000
  const recent = (submissions.get(key) || []).filter((timestamp) => timestamp > cutoff)
  if (recent.length >= 5) return true
  recent.push(Date.now())
  submissions.set(key, recent)
  return false
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    if (isRateLimited(request)) {
      return NextResponse.json(
        { error: 'অনেকবার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।' },
        { status: 429 }
      )
    }
    const body = (await request.json()) as Partial<ContactPayload>
    const { name, email, phone = '', subject, message } = body

    // Validation
    if (!name || name.trim().length < 2 || name.trim().length > 120) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে আপনার নাম সঠিকভাবে লিখুন (কমপক্ষে ২ অক্ষর)' },
        { status: 400 }
      )
    }

    if (!email || email.trim().length > 254 || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রদান করুন' },
        { status: 400 }
      )
    }

    if (!subject || subject.trim().length < 3 || subject.trim().length > 200) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে বার্তার বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length < 10 || message.trim().length > 10000) {
      return NextResponse.json(
        { error: 'বার্তাটি অত্যন্ত সংক্ষিপ্ত (কমপক্ষে ১০ অক্ষর লিখুন)' },
        { status: 400 }
      )
    }

    if (phone.trim().length > 40) {
      return NextResponse.json({ error: 'ফোন নম্বরটি অত্যন্ত দীর্ঘ।' }, { status: 400 })
    }

    const submissionRecord = {
      name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(),
      subject: subject.trim(), message: message.trim(),
    }

    const created = await createContactMessage(submissionRecord)

    return NextResponse.json({
      success: true,
      message: 'আপনার বার্তা সফলভাবে গৃহীত হয়েছে! দ্রুততম সময়ে যোগাযোগ করা হবে।',
      id: created.id,
      timestamp: created.createdAt,
    })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।' },
      { status: 500 }
    )
  }
}
