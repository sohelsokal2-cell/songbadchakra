import { NextResponse } from 'next/server'

interface ContactPayload {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ContactPayload>
    const { name, email, phone = '', subject, message } = body

    // Validation
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে আপনার নাম সঠিকভাবে লিখুন (কমপক্ষে ২ অক্ষর)' },
        { status: 400 }
      )
    }

    if (!email || !isValidEmail(email.trim())) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে একটি বৈধ ইমেইল ঠিকানা প্রদান করুন' },
        { status: 400 }
      )
    }

    if (!subject || subject.trim().length < 3) {
      return NextResponse.json(
        { error: 'অনুগ্রহ করে বার্তার বিষয় লিখুন (কমপক্ষে ৩ অক্ষর)' },
        { status: 400 }
      )
    }

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'বার্তাটি অত্যন্ত সংক্ষিপ্ত (কমপক্ষে ১০ অক্ষর লিখুন)' },
        { status: 400 }
      )
    }

    const submissionRecord = {
      id: `contact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    }

    // Check if Supabase credentials are configured in environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/contact_messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: supabaseKey,
            Authorization: `Bearer ${supabaseKey}`,
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(submissionRecord),
        })

        if (!response.ok) {
          console.warn('Supabase contact submission non-200, falling back to local acknowledgment:', response.status)
        }
      } catch (err) {
        console.warn('Supabase contact request failed:', err)
      }
    } else {
      // Local acknowledgment for current development phase
      console.log('Contact form received (Phase 1/2 development):', submissionRecord)
    }

    return NextResponse.json({
      success: true,
      message: 'আপনার বার্তা সফলভাবে গৃহীত হয়েছে! দ্রুততম সময়ে যোগাযোগ করা হবে।',
      id: submissionRecord.id,
      timestamp: submissionRecord.createdAt,
    })
  } catch (error) {
    console.error('Contact API error:', error)
    return NextResponse.json(
      { error: 'সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।' },
      { status: 500 }
    )
  }
}
