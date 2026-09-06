import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_DOMAIN } from '@/lib/utils'

export const metadata: Metadata = {
  title: `ব্যবহারের শর্তাবলী ও কপিরাইট নীতি | ${SITE_NAME}`,
  description: `${SITE_NAME} ব্যবহারের সাধারণ শর্তাবলী, কপিরাইট সুরক্ষা, উৎস স্বীকৃতি এবং আইনি দায়মুক্তি নীতিমালা।`,
  alternates: {
    canonical: `https://${SITE_DOMAIN}/terms`,
  },
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-bengali">
      {/* ── Breadcrumb ── */}
      <nav aria-label="ব্রেডক্রাম্ব" className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-red-600 transition-colors">হোম</Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">ব্যবহারের শর্তাবলী ও কপিরাইট নীতি</span>
      </nav>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            ব্যবহারের শর্তাবলী ও কপিরাইট নীতি
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            সর্বশেষ পরিমার্জন: ৬ সেপ্টেম্বর, ২০২৬ | {SITE_NAME} অনলাইন পোর্টাল
          </p>
        </div>

        <div className="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-6">
          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ১. সাধারণ শর্তাবলী
            </h2>
            <p>
              {SITE_NAME} ({SITE_DOMAIN}) ওয়েবসাইটে আপনাকে স্বাগতম। এই পোর্টাল ব্যবহার, ব্রাউজ অথবা সংবাদ পাঠ করার মাধ্যমে আপনি আমাদের শর্তাবলীর সাথে সম্মতি জ্ঞাপন করছেন। যদি আপনি এই শর্তাবলীর সাথে একমত না হন, তবে অনুগ্রহপূর্বক পোর্টালটি ব্যবহার থেকে বিরত থাকুন।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ২. বুদ্ধিবৃত্তিক সম্পত্তি ও কপিরাইট
            </h2>
            <p>
              {SITE_NAME}-এ প্রকাশিত নিজস্ব প্রতিবেদন, বিশ্লেষণ, আলোকচিত্র, ভিডিও এবং লোগো সংবাদচক্রের মেধা সম্পত্তি হিসেবে সংরক্ষিত। 
              পূর্বানুমতি ব্যতীত বাণিজ্যিক উদ্দেশ্যে এই ওয়েবসাইটের কোনো উপাদান পুনঃপ্রকাশ, অনুলিপি বা পরিবর্তন করা আইনত দণ্ডনীয়।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ৩. তৃতীয় পক্ষীয় উৎস ও স্বয়ংক্রিয় সংকলন স্বীকৃতি
            </h2>
            <p>
              {SITE_NAME} বিশ্বস্ত জাতীয় ও আন্তর্জাতিক সংবাদ সংস্থা (যেমন BBC News বাংলা, প্রথম আলো ইত্যাদি)-এর অনুমোদিত পাবলিক আরএসএস ফিড থেকে তথ্য সংকলন করে থাকে। 
              প্রতিটি সংকলিত সংবাদের ক্ষেত্রে:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>মূল সংবাদ সংস্থার নাম ও লোগো স্পষ্টভাবে ক্রেডিট হিসেবে প্রদর্শিত হয়।</li>
              <li>পাঠকদের জন্য মূল সংবাদের সরাসরি লাইভ হাইপারলিঙ্ক সংযুক্ত থাকে।</li>
              <li>আমরা কপিরাইটযুক্ত সম্পূর্ণ নিবন্ধ অনুলিপি করি না; কেবল সারসংক্ষেপ এবং লিঙ্ক প্রদান করি।</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ৪. মতামত ও কলাম বিভাগের দায়মুক্তি
            </h2>
            <p>
              মতামত ও সম্পাদকীয় বিভাগে প্রকাশিত লেখার বক্তব্য লেখকের নিজস্ব। এর সাথে {SITE_NAME} কর্তৃপক্ষ বা সম্পাদকীয় পর্ষদের নীতিগত মতামতের মিল থাকা বাধ্যতামূলক নয়। কোনো লেখকের লেখার জন্য সংবাদচক্র কর্তৃপক্ষ দায়ী থাকবে না।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ৫. ব্যবহারকারীর যোগাযোগ ও তথ্য সংরক্ষণ নীতি
            </h2>
            <p>
              যোগাযোগ ফর্মের মাধ্যমে সংগৃহীত ব্যক্তিগত তথ্য (নাম, ইমেইল, ফোন নম্বর) কেবল গ্রাহক প্রতিক্রিয়া ও যোগাযোগের উদ্দেশ্যে সংরক্ষিত থাকে। 
              আমরা কোনো অবস্থাতেই এই তথ্য তৃতীয় পক্ষের কাছে বিক্রি বা বিপণন উদ্দেশ্যে হস্তান্তর করি না। নির্দিষ্ট সময় পর বার্তাগুলো স্বয়ংক্রিয়ভাবে মুছে ফেলা হয়।
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 border-b border-slate-100 pb-2">
              ৬. অভিযোগ ও যোগাযোগ
            </h2>
            <p>
              কপিরাইট লঙ্ঘন, অসত্য তথ্য বা অন্য কোনো আপত্তিজনক কনটেন্ট সম্পর্কিত অভিযোগের জন্য সরাসরি আমাদের সাথে যোগাযোগ করুন:
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs sm:text-sm font-sans space-y-1">
              <div><strong>সম্পাদকীয় যোগাযোগ:</strong> info@{SITE_DOMAIN}</div>
              <div><strong>ঠিকানা:</strong> ঢাকা, বাংলাদেশ</div>
              <div>
                <strong>অনলাইন যোগাযোগ ফর্ম:</strong>{' '}
                <Link href="/contact" className="text-red-600 hover:underline">
                  {SITE_DOMAIN}/contact
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
