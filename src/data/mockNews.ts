/**
 * Mock Bengali news data for Phase 1 UI development.
 * All content is entirely fictional and created for demonstration purposes.
 * In Phase 4, this will be replaced with Supabase queries.
 */

import { type NewsArticle } from '@/types/news'

const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600000).toISOString()

export const mockNews: NewsArticle[] = [
  // ─── BREAKING NEWS ──────────────────────────────────────────────────────────
  {
    id: '1',
    title: 'ঢাকায় জরুরি মন্ত্রিসভা বৈঠকে নতুন বাজেট পরিকল্পনা অনুমোদন',
    slug: 'dhaka-emergency-cabinet-budget-approval',
    summary:
      'সরকার আগামী অর্থবছরের জন্য একটি বিশেষ সংশোধিত বাজেট পরিকল্পনা অনুমোদন করেছে, যেখানে শিক্ষা ও স্বাস্থ্য খাতে বরাদ্দ উল্লেখযোগ্যভাবে বৃদ্ধি পাওয়ার কথা জানানো হয়েছে।',
    content: `সরকার আজ এক জরুরি মন্ত্রিসভা বৈঠকে আগামী অর্থবছরের জন্য সংশোধিত বাজেট পরিকল্পনা অনুমোদন দিয়েছে। এই বাজেটে শিক্ষা খাতে ১৫ শতাংশ এবং স্বাস্থ্য খাতে ২০ শতাংশ বরাদ্দ বৃদ্ধির প্রস্তাব রাখা হয়েছে।

অর্থমন্ত্রী জানান, দেশের সামগ্রিক অর্থনৈতিক পরিস্থিতি বিবেচনায় এই সিদ্ধান্ত নেওয়া হয়েছে। তিনি আরও বলেন, সামাজিক সুরক্ষা কর্মসূচিতেও অতিরিক্ত বরাদ্দ রাখা হবে।

বিশেষজ্ঞরা এই সিদ্ধান্তকে ইতিবাচকভাবে দেখছেন। তারা বলছেন, এই বরাদ্দ বৃদ্ধি দেশের মানব উন্নয়ন সূচকে ইতিবাচক প্রভাব ফেলবে।

মন্ত্রিসভার সিদ্ধান্ত অনুযায়ী, আগামী জুলাই মাস থেকে নতুন বাজেট কার্যকর হবে। এর আগে সংসদে অনুমোদনের জন্য পাঠানো হবে।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/budget/800/450',
    publishedAt: hoursAgo(1),
    isBreaking: true,
    status: 'published',
  },
  {
    id: '2',
    title: 'বিশ্ব জলবায়ু সম্মেলনে বাংলাদেশের প্রস্তাব গৃহীত হয়েছে',
    slug: 'bangladesh-climate-conference-proposal-accepted',
    summary:
      'জাতিসংঘের বিশ্ব জলবায়ু সম্মেলনে বাংলাদেশের উপকূলীয় সুরক্ষা তহবিল প্রস্তাব আন্তর্জাতিক সম্প্রদায়ের অনুমোদন পেয়েছে।',
    content: `জাতিসংঘের বিশ্ব জলবায়ু সম্মেলনে বাংলাদেশ একটি ঐতিহাসিক সাফল্য অর্জন করেছে। দেশের পক্ষ থেকে উত্থাপিত উপকূলীয় সুরক্ষা তহবিল প্রস্তাব আন্তর্জাতিক সম্প্রদায়ের সর্বসম্মত অনুমোদন পেয়েছে।

এই তহবিলের আওতায় বাংলাদেশ বার্ষিক ৫০০ মিলিয়ন ডলার সহায়তা পাবে, যা উপকূলীয় বাঁধ নির্মাণ, ম্যানগ্রোভ বনায়ন এবং জলবায়ু-সহিষ্ণু কৃষি উন্নয়নে ব্যয় করা হবে।

পরিবেশমন্ত্রী বলেন, এটি বাংলাদেশের জন্য একটি বড় অর্জন। জলবায়ু পরিবর্তনের ক্ষতিকর প্রভাব থেকে দেশকে রক্ষা করতে এই তহবিল গুরুত্বপূর্ণ ভূমিকা রাখবে।`,
    category: 'international',
    categoryLabel: 'আন্তর্জাতিক',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/climate/800/450',
    publishedAt: hoursAgo(2),
    isBreaking: true,
    status: 'published',
  },
  {
    id: '3',
    title: 'জাতীয় ক্রিকেট দল টেস্টে নতুন রেকর্ড গড়েছে',
    slug: 'national-cricket-team-test-new-record',
    summary:
      'বাংলাদেশ জাতীয় ক্রিকেট দল আজকের টেস্ট ম্যাচে ৪৫৬ রান করে নতুন জাতীয় রেকর্ড স্থাপন করেছে।',
    content: `বাংলাদেশ জাতীয় ক্রিকেট দল আজ ঐতিহাসিক একটি রেকর্ড গড়েছে। চলমান টেস্ট সিরিজের তৃতীয় দিনে দলটি একদিনে ৪৫৬ রান করে জাতীয় টেস্ট ইতিহাসে সর্বোচ্চ রানের রেকর্ড স্থাপন করেছে।

অধিনায়ক তার ব্যক্তিগত সেঞ্চুরি করেন এবং দলের সর্বোচ্চ স্কোরার হিসেবে ১৪৫ রানে অপরাজিত থাকেন। এর পাশাপাশি আরও দুজন ব্যাটসম্যান অর্ধশতক করেছেন।

ক্রিকেট বিশ্লেষকরা বলছেন, এই পারফরম্যান্স বাংলাদেশ ক্রিকেটের নতুন অধ্যায়ের সূচনা করেছে।`,
    category: 'sports',
    categoryLabel: 'খেলাধুলা',
    sourceName: 'সংবাদচক্র স্পোর্টস',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/cricket/800/450',
    publishedAt: hoursAgo(3),
    isBreaking: true,
    status: 'published',
  },

  // ─── BANGLADESH ─────────────────────────────────────────────────────────────
  {
    id: '4',
    title: 'ঢাকা মেট্রোরেলের নতুন সম্প্রসারণ পরিকল্পনা ঘোষণা',
    slug: 'dhaka-metro-rail-expansion-plan',
    summary:
      'সরকার ঢাকা মেট্রোরেলকে বিমানবন্দর পর্যন্ত সম্প্রসারিত করার পরিকল্পনা ঘোষণা করেছে।',
    content: `সরকার আজ ঢাকা মেট্রোরেলের নতুন সম্প্রসারণ পরিকল্পনা ঘোষণা করেছে। এই পরিকল্পনা অনুযায়ী মেট্রোরেল হযরত শাহজালাল আন্তর্জাতিক বিমানবন্দর পর্যন্ত বিস্তৃত হবে।

নতুন রুটের দৈর্ঘ্য হবে ১২ কিলোমিটার এবং এতে ৮টি নতুন স্টেশন থাকবে। প্রকল্পটি ২০২৭ সালের মধ্যে সম্পন্ন করার লক্ষ্য রয়েছে।

সংশ্লিষ্ট কর্তৃপক্ষ জানিয়েছে, এই সম্প্রসারণের ফলে প্রতিদিন অতিরিক্ত তিন লাখ যাত্রী সেবা পাবেন।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/metro/800/450',
    publishedAt: hoursAgo(4),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '5',
    title: 'পদ্মা সেতু দিয়ে রেকর্ড পরিমাণ যানবাহন চলাচল',
    slug: 'padma-bridge-record-vehicles',
    summary:
      'গত সপ্তাহে পদ্মা সেতু দিয়ে একদিনে সর্বোচ্চ ৪৫ হাজার যানবাহন পার হয়েছে, যা একটি নতুন রেকর্ড।',
    content: `পদ্মা সেতু চালুর পর থেকে গত সপ্তাহে সর্বোচ্চ সংখ্যক যানবাহন চলাচলের রেকর্ড হয়েছে। শুক্রবার একদিনে ৪৫ হাজারের বেশি যানবাহন সেতু পার হয়েছে।

সেতু কর্তৃপক্ষ জানিয়েছে, ঈদ উপলক্ষে দক্ষিণাঞ্চলে যাত্রীদের চলাচল বৃদ্ধি পাওয়ায় এই রেকর্ড হয়েছে। টোল আদায়ও নতুন উচ্চতায় পৌঁছেছে।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/padma/800/450',
    publishedAt: hoursAgo(5),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '6',
    title: 'চট্টগ্রাম বন্দরে নতুন কনটেইনার টার্মিনাল উদ্বোধন',
    slug: 'chittagong-port-new-container-terminal',
    summary:
      'চট্টগ্রাম বন্দরে সর্বাধুনিক প্রযুক্তির নতুন কনটেইনার টার্মিনাল উদ্বোধন হয়েছে।',
    content: `চট্টগ্রাম বন্দর কর্তৃপক্ষ আজ একটি সর্বাধুনিক কনটেইনার টার্মিনাল উদ্বোধন করেছে। এই টার্মিনালে অটোমেটেড ক্রেন ও অত্যাধুনিক ট্র্যাকিং সিস্টেম ব্যবহার করা হয়েছে।

নতুন টার্মিনালের ফলে বন্দরের কনটেইনার হ্যান্ডলিং ক্ষমতা দ্বিগুণ হবে এবং পণ্য খালাসের সময় উল্লেখযোগ্যভাবে কমে আসবে।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/port/800/450',
    publishedAt: hoursAgo(6),
    isBreaking: false,
    status: 'published',
  },

  // ─── INTERNATIONAL ───────────────────────────────────────────────────────────
  {
    id: '7',
    title: 'জাতিসংঘ সাধারণ পরিষদে বাংলাদেশের বক্তব্য আলোচনার ঝড় তুলেছে',
    slug: 'un-general-assembly-bangladesh-speech',
    summary:
      'জাতিসংঘ সাধারণ পরিষদে বাংলাদেশের প্রতিনিধি উন্নয়নশীল দেশগুলোর ঋণ মওকুফের দাবি তুলেছেন।',
    content: `জাতিসংঘ সাধারণ পরিষদের সাম্প্রতিক অধিবেশনে বাংলাদেশের স্থায়ী প্রতিনিধি উন্নয়নশীল দেশগুলোর বৈদেশিক ঋণ মওকুফের জোরালো দাবি তুলেছেন। তার বক্তব্য আন্তর্জাতিক মিডিয়ায় ব্যাপক আলোচনার জন্ম দিয়েছে।

তিনি বলেন, জলবায়ু পরিবর্তনের শিকার দেশগুলোকে ঋণের বোঝা থেকে মুক্তি দেওয়া ন্যায়বিচারের দাবি। উন্নত দেশগুলোর উচিত এই বিষয়ে দায়িত্বশীল পদক্ষেপ নেওয়া।`,
    category: 'international',
    categoryLabel: 'আন্তর্জাতিক',
    sourceName: 'সংবাদচক্র আন্তর্জাতিক',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/un/800/450',
    publishedAt: hoursAgo(7),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '8',
    title: 'মধ্যপ্রাচ্যে শান্তি আলোচনায় নতুন অগ্রগতি',
    slug: 'middle-east-peace-talks-progress',
    summary:
      'মধ্যপ্রাচ্যে চলমান শান্তি আলোচনায় দুই পক্ষ একটি অস্থায়ী যুদ্ধবিরতি চুক্তিতে সম্মত হয়েছে।',
    content: `আন্তর্জাতিক মধ্যস্থতাকারীদের প্রচেষ্টায় মধ্যপ্রাচ্যে চলমান সংঘাতে একটি অস্থায়ী যুদ্ধবিরতি চুক্তি স্বাক্ষরিত হয়েছে। এই চুক্তি ৩০ দিনের জন্য কার্যকর থাকবে।

বিশেষজ্ঞরা এটিকে একটি ইতিবাচক পদক্ষেপ হিসেবে দেখছেন, যদিও স্থায়ী শান্তির পথ এখনও দীর্ঘ।`,
    category: 'international',
    categoryLabel: 'আন্তর্জাতিক',
    sourceName: 'সংবাদচক্র আন্তর্জাতিক',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/peace/800/450',
    publishedAt: hoursAgo(8),
    isBreaking: false,
    status: 'published',
  },

  // ─── POLITICS ────────────────────────────────────────────────────────────────
  {
    id: '9',
    title: 'স্থানীয় সরকার নির্বাচনে নতুন তফসিল ঘোষণা',
    slug: 'local-government-election-new-schedule',
    summary:
      'নির্বাচন কমিশন আগামী তিন মাসের মধ্যে ইউনিয়ন পরিষদ নির্বাচন অনুষ্ঠানের তফসিল ঘোষণা করেছে।',
    content: `বাংলাদেশ নির্বাচন কমিশন আজ ইউনিয়ন পরিষদ নির্বাচনের তফসিল ঘোষণা করেছে। তফসিল অনুযায়ী, সারা দেশে তিন ধাপে এই নির্বাচন অনুষ্ঠিত হবে।

প্রথম ধাপে ৮টি বিভাগের মধ্যে ৩টি বিভাগে নির্বাচন হবে। মনোনয়নপত্র দাখিলের শেষ তারিখ আগামী মাসের ১৫ তারিখ নির্ধারণ করা হয়েছে।`,
    category: 'politics',
    categoryLabel: 'রাজনীতি',
    sourceName: 'সংবাদচক্র রাজনীতি',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/election/800/450',
    publishedAt: hoursAgo(9),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '10',
    title: 'সংসদে নতুন ডিজিটাল নিরাপত্তা বিল পাস',
    slug: 'parliament-digital-security-bill-passed',
    summary:
      'জাতীয় সংসদে ডিজিটাল নিরাপত্তা সংক্রান্ত নতুন আইন পাস হয়েছে, যা নাগরিকদের অনলাইন সুরক্ষা নিশ্চিত করবে।',
    content: `জাতীয় সংসদে আজ ডিজিটাল নিরাপত্তা সংক্রান্ত একটি নতুন বিল পাস হয়েছে। এই আইনের আওতায় সাইবার অপরাধ দমনে কঠোর ব্যবস্থা নেওয়া সম্ভব হবে।

আইনটিতে অনলাইনে হয়রানি, তথ্য চুরি এবং ডিজিটাল প্রতারণার বিরুদ্ধে কঠোর শাস্তির বিধান রাখা হয়েছে। নাগরিক সমাজের প্রতিনিধিরা এই আইনকে স্বাগত জানিয়েছেন।`,
    category: 'politics',
    categoryLabel: 'রাজনীতি',
    sourceName: 'সংবাদচক্র রাজনীতি',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/parliament/800/450',
    publishedAt: hoursAgo(10),
    isBreaking: false,
    status: 'published',
  },

  // ─── SPORTS ──────────────────────────────────────────────────────────────────
  {
    id: '11',
    title: 'বাংলাদেশ ফুটবল দল এশিয়ান কাপ বাছাইয়ে জয়ী',
    slug: 'bangladesh-football-asian-cup-qualifier-win',
    summary:
      'বাংলাদেশ জাতীয় ফুটবল দল এশিয়ান কাপ বাছাইপর্বে ২-১ গোলে জয় পেয়ে পরের রাউন্ডে উঠেছে।',
    content: `বাংলাদেশ জাতীয় ফুটবল দল আজ এশিয়ান কাপ বাছাইপর্বে দুর্দান্ত পারফরম্যান্সে ২-১ গোলে জয় পেয়েছে। এই জয়ের ফলে দলটি পরবর্তী রাউন্ডে জায়গা নিশ্চিত করেছে।

প্রথমার্ধে দলটি পিছিয়ে পড়লেও দ্বিতীয়ার্ধে দুর্দান্ত ফুটবলে খেলে ম্যাচ জিতে নেয়। দলের অধিনায়ক ম্যাচের সেরা খেলোয়াড় নির্বাচিত হয়েছেন।`,
    category: 'sports',
    categoryLabel: 'খেলাধুলা',
    sourceName: 'সংবাদচক্র স্পোর্টস',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/football/800/450',
    publishedAt: hoursAgo(11),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '12',
    title: 'বিপিএলে রাজশাহী রাইডার্সের হ্যাটট্রিক জয়',
    slug: 'bpl-rajshahi-riders-hat-trick-win',
    summary:
      'বাংলাদেশ প্রিমিয়ার লিগে রাজশাহী রাইডার্স টানা তৃতীয় ম্যাচ জিতে পয়েন্ট টেবিলের শীর্ষে উঠেছে।',
    content: `বাংলাদেশ প্রিমিয়ার লিগে রাজশাহী রাইডার্স দারুণ ফর্মে রয়েছে। আজ কুমিল্লা ভিক্টোরিয়ান্সকে ৩৫ রানে হারিয়ে দলটি টানা তৃতীয় জয় পেয়েছে।

রাজশাহীর ব্যাটসম্যান তৃতীয় ওভারে ৬ ছক্কা মেরে একটি বিশেষ রেকর্ড গড়েছেন। বোলিংয়েও দলের পেসার দারুণ পারফর্ম করেছেন।`,
    category: 'sports',
    categoryLabel: 'খেলাধুলা',
    sourceName: 'সংবাদচক্র স্পোর্টস',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/bpl/800/450',
    publishedAt: hoursAgo(12),
    isBreaking: false,
    status: 'published',
  },

  // ─── TECHNOLOGY ──────────────────────────────────────────────────────────────
  {
    id: '13',
    title: 'বাংলাদেশে প্রথমবার ৬জি প্রযুক্তি পরীক্ষামূলক চালু',
    slug: 'bangladesh-6g-technology-pilot-launch',
    summary:
      'দেশে প্রথমবারের মতো ৬জি মোবাইল প্রযুক্তির পরীক্ষামূলক সংস্করণ ঢাকায় চালু করা হয়েছে।',
    content: `বাংলাদেশে প্রথমবারের মতো ৬জি মোবাইল প্রযুক্তির পরীক্ষামূলক সংস্করণ চালু হয়েছে। ঢাকার একটি নির্দিষ্ট এলাকায় এই প্রযুক্তির ট্রায়াল শুরু হয়েছে।

৬জি প্রযুক্তিতে ডেটা ট্রান্সফার স্পিড ৫জির চেয়ে ১০০ গুণ বেশি হবে। দেশীয় প্রকৌশলীদের অংশগ্রহণে এই প্রযুক্তির উন্নয়ন করা হচ্ছে।`,
    category: 'technology',
    categoryLabel: 'প্রযুক্তি',
    sourceName: 'সংবাদচক্র টেক',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/6g/800/450',
    publishedAt: hoursAgo(13),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '14',
    title: 'স্থানীয় স্টার্টআপ আন্তর্জাতিক বিনিয়োগ পেয়েছে',
    slug: 'local-startup-international-investment',
    summary:
      'ঢাকার একটি এআই স্টার্টআপ সিলিকন ভ্যালির বিনিয়োগকারীদের কাছ থেকে ২০ মিলিয়ন ডলার বিনিয়োগ পেয়েছে।',
    content: `বাংলাদেশের একটি কৃত্রিম বুদ্ধিমত্তা স্টার্টআপ আন্তর্জাতিক বিনিয়োগ পেয়ে চাঞ্চল্য সৃষ্টি করেছে। সিলিকন ভ্যালির একটি ভেঞ্চার ক্যাপিটাল ফার্ম দলটিতে ২০ মিলিয়ন ডলার বিনিয়োগ করেছে।

স্টার্টআপটি কৃষি খাতে এআই প্রযুক্তি ব্যবহার করে ফসলের রোগ নির্ণয় ও ফলন বৃদ্ধির সমাধান তৈরি করেছে। এই প্রযুক্তি ইতোমধ্যে ৫০ হাজার কৃষক ব্যবহার করছেন।`,
    category: 'technology',
    categoryLabel: 'প্রযুক্তি',
    sourceName: 'সংবাদচক্র টেক',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/startup/800/450',
    publishedAt: hoursAgo(14),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '15',
    title: 'দেশে ই-কমার্স বাজার দ্বিগুণ হয়েছে এক বছরে',
    slug: 'ecommerce-market-doubled-one-year',
    summary:
      'বাংলাদেশে ই-কমার্স বাজারের আকার এক বছরে দ্বিগুণ হয়ে ৮ হাজার কোটি টাকা ছাড়িয়েছে।',
    content: `বাংলাদেশের ই-কমার্স বাজার গত এক বছরে দ্রুত গতিতে বৃদ্ধি পেয়েছে। ই-কমার্স অ্যাসোসিয়েশনের তথ্য অনুযায়ী, বাজারের আকার দ্বিগুণ হয়ে ৮ হাজার কোটি টাকা ছাড়িয়েছে।

মোবাইল কমার্সের উত্থান এবং ডিজিটাল পেমেন্টের সহজলভ্যতা এই বৃদ্ধিতে প্রধান ভূমিকা রেখেছে।`,
    category: 'technology',
    categoryLabel: 'প্রযুক্তি',
    sourceName: 'সংবাদচক্র টেক',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/ecommerce/800/450',
    publishedAt: hoursAgo(15),
    isBreaking: false,
    status: 'published',
  },

  // ─── BUSINESS ────────────────────────────────────────────────────────────────
  {
    id: '16',
    title: 'গার্মেন্টস রপ্তানিতে নতুন রেকর্ড, আয় ৫০ বিলিয়ন ডলার ছাড়াল',
    slug: 'garments-export-record-50-billion',
    summary:
      'বাংলাদেশের তৈরি পোশাক শিল্পে রপ্তানি আয় প্রথমবারের মতো ৫০ বিলিয়ন ডলার ছাড়িয়ে গেছে।',
    content: `বাংলাদেশের তৈরি পোশাক শিল্প একটি ঐতিহাসিক মাইলফলক অতিক্রম করেছে। চলতি অর্থবছরে রপ্তানি আয় প্রথমবারের মতো ৫০ বিলিয়ন ডলার ছাড়িয়ে গেছে।

বিজিএমইএ সভাপতি জানান, ইউরোপ ও আমেরিকার বাজারে বাংলাদেশি পোশাকের চাহিদা বেড়েছে। শ্রমিকদের দক্ষতা উন্নয়ন এবং আধুনিক প্রযুক্তির ব্যবহার এই সাফল্যের পেছনে।`,
    category: 'business',
    categoryLabel: 'ব্যবসা',
    sourceName: 'সংবাদচক্র ব্যবসা',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(16),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '17',
    title: 'ঢাকা স্টক এক্সচেঞ্জে সূচক ঊর্ধ্বমুখী',
    slug: 'dse-index-rising',
    summary:
      'ঢাকা স্টক এক্সচেঞ্জে আজ ডিএসইএক্স সূচক ১৫০ পয়েন্ট বেড়ে ৬ হাজার পয়েন্ট ছাড়িয়েছে।',
    content: `আজ ঢাকা স্টক এক্সচেঞ্জে শেয়ারবাজারে উৎসাহজনক লেনদেন হয়েছে। ডিএসইএক্স সূচক ১৫০ পয়েন্ট বেড়ে ৬ হাজার পয়েন্ট ছাড়িয়েছে।

ব্যাংকিং ও টেলিযোগাযোগ খাতের শেয়ারে ব্যাপক ক্রয় চাপের ফলে এই ঊর্ধ্বগতি দেখা গেছে। বিশ্লেষকরা বলছেন, বিদেশি বিনিয়োগকারীদের আগ্রহ বৃদ্ধি পাওয়ায় বাজারে ইতিবাচক ধারা অব্যাহত থাকতে পারে।`,
    category: 'business',
    categoryLabel: 'ব্যবসা',
    sourceName: 'সংবাদচক্র ব্যবসা',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(17),
    isBreaking: false,
    status: 'published',
  },

  // ─── ENTERTAINMENT ───────────────────────────────────────────────────────────
  {
    id: '18',
    title: 'বাংলাদেশি চলচ্চিত্র আন্তর্জাতিক পুরস্কার জিতল',
    slug: 'bangladeshi-film-wins-international-award',
    summary:
      'একটি বাংলাদেশি স্বাধীন চলচ্চিত্র কান চলচ্চিত্র উৎসবে বিশেষ জুরি পুরস্কার অর্জন করেছে।',
    content: `একটি বাংলাদেশি স্বাধীন চলচ্চিত্র আন্তর্জাতিক মঞ্চে দেশের নাম উজ্জ্বল করেছে। কান চলচ্চিত্র উৎসবে ছবিটি বিশেষ জুরি পুরস্কার অর্জন করেছে।

পরিচালক জানান, এই চলচ্চিত্রটি বাংলাদেশের গ্রামীণ জীবন ও সংস্কৃতিকে আন্তর্জাতিক দর্শকদের সামনে তুলে ধরেছে। পুরস্কারটি বাংলাদেশের চলচ্চিত্র শিল্পের জন্য একটি বড় স্বীকৃতি।`,
    category: 'entertainment',
    categoryLabel: 'বিনোদন',
    sourceName: 'সংবাদচক্র বিনোদন',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(18),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '19',
    title: 'জনপ্রিয় গায়কের নতুন অ্যালবাম মুক্তি পেল',
    slug: 'popular-singer-new-album-released',
    summary:
      'বাংলাদেশের জনপ্রিয় কণ্ঠশিল্পীর নতুন অ্যালবাম "আলোর পথ" আজ ডিজিটাল প্ল্যাটফর্মে মুক্তি পেয়েছে।',
    content: `বাংলাদেশের অন্যতম জনপ্রিয় কণ্ঠশিল্পীর নতুন অ্যালবাম "আলোর পথ" আজ সকালে বিভিন্ন ডিজিটাল প্ল্যাটফর্মে প্রকাশিত হয়েছে। অ্যালবামটিতে ১২টি গান রয়েছে।

মুক্তির প্রথম ঘণ্টায়ই অ্যালবামটি ইউটিউবে ট্রেন্ডিং লিস্টের শীর্ষে উঠে এসেছে। ভক্তরা সামাজিক যোগাযোগমাধ্যমে ব্যাপক প্রতিক্রিয়া জানাচ্ছেন।`,
    category: 'entertainment',
    categoryLabel: 'বিনোদন',
    sourceName: 'সংবাদচক্র বিনোদন',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/music/800/450',
    publishedAt: hoursAgo(19),
    isBreaking: false,
    status: 'published',
  },

  // ─── SCIENCE ─────────────────────────────────────────────────────────────────
  {
    id: '20',
    title: 'বাংলাদেশি বিজ্ঞানীদের নতুন ধানের জাত উদ্ভাবন',
    slug: 'bangladeshi-scientists-new-rice-variety',
    summary:
      'বাংলাদেশ ধান গবেষণা ইনস্টিটিউটের বিজ্ঞানীরা লবণ ও বন্যা সহিষ্ণু নতুন ধানের জাত উদ্ভাবন করেছেন।',
    content: `বাংলাদেশ ধান গবেষণা ইনস্টিটিউট (ব্রি) একটি যুগান্তকারী সাফল্য অর্জন করেছে। প্রতিষ্ঠানটির বিজ্ঞানীরা লবণ ও বন্যা সহিষ্ণু একটি নতুন ধানের জাত উদ্ভাবন করেছেন।

নতুন এই জাতটি সাধারণ ধানের চেয়ে ৩০ শতাংশ বেশি ফলন দেবে এবং সমুদ্র উপকূলীয় লবণাক্ত মাটিতেও চাষ করা যাবে। জলবায়ু পরিবর্তনের মুখে এটি বাংলাদেশের খাদ্য নিরাপত্তায় গুরুত্বপূর্ণ ভূমিকা রাখবে।`,
    category: 'science',
    categoryLabel: 'বিজ্ঞান',
    sourceName: 'সংবাদচক্র বিজ্ঞান',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/rice/800/450',
    publishedAt: hoursAgo(20),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '21',
    title: 'মহাকাশে নতুন গ্যালাক্সি আবিষ্কার করলেন বাংলাদেশি বিজ্ঞানী',
    slug: 'bangladeshi-scientist-discovers-new-galaxy',
    summary:
      'বাংলাদেশ থেকে যাওয়া একজন জ্যোতির্বিজ্ঞানী নাসার গবেষণাগারে একটি নতুন গ্যালাক্সি আবিষ্কার করেছেন।',
    content: `বাংলাদেশ থেকে যাওয়া এক তরুণ জ্যোতির্বিজ্ঞানী আন্তর্জাতিক মহলে সাড়া ফেলেছেন। নাসার একটি গবেষণাগারে কর্মরত এই বিজ্ঞানী একটি নতুন গ্যালাক্সি আবিষ্কার করেছেন।

গ্যালাক্সিটি পৃথিবী থেকে ১৩ বিলিয়ন আলোকবর্ষ দূরে অবস্থিত এবং এটি মহাবিশ্বের প্রাচীনতম গ্যালাক্সিগুলোর একটি হতে পারে বলে ধারণা করা হচ্ছে।`,
    category: 'science',
    categoryLabel: 'বিজ্ঞান',
    sourceName: 'সংবাদচক্র বিজ্ঞান',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/galaxy/800/450',
    publishedAt: hoursAgo(22),
    isBreaking: false,
    status: 'published',
  },

  // ─── LIFESTYLE ───────────────────────────────────────────────────────────────
  {
    id: '22',
    title: 'রমজান মাসে স্বাস্থ্যকর ইফতারের রেসিপি',
    slug: 'ramadan-healthy-iftar-recipes',
    summary:
      'পুষ্টিবিদরা এবার রমজান মাসে সুস্বাদু কিন্তু স্বাস্থ্যকর ইফতারের রেসিপি শেয়ার করেছেন।',
    content: `রমজান মাসে সঠিক পুষ্টি বজায় রাখা অত্যন্ত জরুরি। বিশেষজ্ঞ পুষ্টিবিদরা এবার কিছু সুস্বাদু কিন্তু স্বাস্থ্যকর ইফতার রেসিপি শেয়ার করেছেন।

খেজুর, ফল এবং হালকা প্রোটিনসমৃদ্ধ খাবার দিয়ে ইফতার শুরু করার পরামর্শ দিয়েছেন তারা। ভাজাপোড়া খাবার কম খাওয়া এবং প্রচুর পানি পান করার উপর জোর দেওয়া হয়েছে।`,
    category: 'lifestyle',
    categoryLabel: 'লাইফস্টাইল',
    sourceName: 'সংবাদচক্র লাইফস্টাইল',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/iftar/800/450',
    publishedAt: hoursAgo(24),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '23',
    title: 'শহরে সাইক্লিং সংস্কৃতি জনপ্রিয় হচ্ছে',
    slug: 'cycling-culture-growing-in-city',
    summary:
      'ঢাকায় সাইক্লিংকে টেকসই যানবাহন হিসেবে গ্রহণ করছেন তরুণরা, গড়ে উঠছে সাইক্লিং কমিউনিটি।',
    content: `ঢাকায় সাইক্লিং সংস্কৃতি ক্রমেই জনপ্রিয় হয়ে উঠছে। বিশেষ করে তরুণ প্রজন্মের মধ্যে সাইক্লিংকে একটি পরিবেশবান্ধব ও স্বাস্থ্যকর যানবাহন হিসেবে গ্রহণের প্রবণতা বাড়ছে।

শহরের বিভিন্ন এলাকায় সাইক্লিং ক্লাব গড়ে উঠেছে। প্রতি সপ্তাহান্তে শত শত সাইক্লিস্ট একসাথে রাইড করেন।`,
    category: 'lifestyle',
    categoryLabel: 'লাইফস্টাইল',
    sourceName: 'সংবাদচক্র লাইফস্টাইল',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/cycling/800/450',
    publishedAt: hoursAgo(26),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '24',
    title: 'মানসিক স্বাস্থ্য সচেতনতায় নতুন উদ্যোগ',
    slug: 'mental-health-awareness-new-initiative',
    summary:
      'সরকার এবং বেসরকারি সংস্থাগুলো মিলে মানসিক স্বাস্থ্য সচেতনতা বাড়াতে দেশব্যাপী প্রচারণা শুরু করেছে।',
    content: `মানসিক স্বাস্থ্য নিয়ে সচেতনতা তৈরিতে সরকার ও বেসরকারি সংস্থাগুলো একযোগে কাজ করছে। দেশব্যাপী একটি বিশেষ প্রচারণা শুরু হয়েছে।

এই প্রচারণার আওতায় স্কুল-কলেজে মানসিক স্বাস্থ্য শিক্ষা কার্যক্রম চালানো হবে। হেল্পলাইন নম্বরের মাধ্যমে বিনামূল্যে পরামর্শ সেবাও দেওয়া হবে।`,
    category: 'lifestyle',
    categoryLabel: 'লাইফস্টাইল',
    sourceName: 'সংবাদচক্র লাইফস্টাইল',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/mental/800/450',
    publishedAt: hoursAgo(28),
    isBreaking: false,
    status: 'published',
  },
  // ─── EXTRA articles for Latest & Popular ─────────────────────────────────────
  {
    id: '25',
    title: 'বন্যায় ক্ষতিগ্রস্তদের জন্য সরকারি সহায়তা প্যাকেজ ঘোষণা',
    slug: 'flood-relief-government-aid-package',
    summary: 'সাম্প্রতিক বন্যায় ক্ষতিগ্রস্ত জেলাগুলোর জন্য সরকার বিশেষ ত্রাণ ও পুনর্বাসন প্যাকেজ ঘোষণা করেছে।',
    content: `সাম্প্রতিক বন্যায় দেশের বেশ কয়েকটি জেলা ব্যাপকভাবে ক্ষতিগ্রস্ত হয়েছে। এই পরিস্থিতিতে সরকার বিশেষ ত্রাণ ও পুনর্বাসন প্যাকেজ ঘোষণা করেছে।

প্যাকেজের আওতায় ক্ষতিগ্রস্ত পরিবারগুলো নগদ সহায়তা, খাদ্য সামগ্রী এবং গৃহনির্মাণ সামগ্রী পাবেন। কৃষি খাতে ক্ষতিগ্রস্তদের জন্য বিশেষ ঋণ সুবিধাও রাখা হয়েছে।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/flood/800/450',
    publishedAt: hoursAgo(30),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '26',
    title: 'চীনের সাথে নতুন বাণিজ্য চুক্তি স্বাক্ষর',
    slug: 'new-trade-agreement-china',
    summary: 'বাংলাদেশ ও চীনের মধ্যে একটি নতুন দ্বিপাক্ষিক বাণিজ্য চুক্তি স্বাক্ষরিত হয়েছে।',
    content: `বাংলাদেশ ও চীনের মধ্যে একটি গুরুত্বপূর্ণ দ্বিপাক্ষিক বাণিজ্য চুক্তি স্বাক্ষরিত হয়েছে। এই চুক্তির আওতায় বাংলাদেশি পণ্য চীনে শুল্কমুক্ত প্রবেশাধিকার পাবে।

চুক্তি অনুযায়ী, বাংলাদেশের ৯৭ শতাংশ পণ্য চীনে শূন্য শুল্কে রপ্তানি করা যাবে। এটি বাংলাদেশের রপ্তানি আয় উল্লেখযোগ্যভাবে বৃদ্ধি করবে বলে আশা করা হচ্ছে।`,
    category: 'business',
    categoryLabel: 'ব্যবসা',
    sourceName: 'সংবাদচক্র ব্যবসা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/china/800/450',
    publishedAt: hoursAgo(32),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '27',
    title: 'নতুন শিক্ষানীতিতে কারিগরি শিক্ষায় জোর',
    slug: 'new-education-policy-technical-emphasis',
    summary: 'সরকারের নতুন শিক্ষানীতিতে মাধ্যমিক স্তর থেকেই কারিগরি ও বৃত্তিমূলক শিক্ষা বাধ্যতামূলক করা হচ্ছে।',
    content: `সরকার একটি নতুন জাতীয় শিক্ষানীতি প্রণয়ন করেছে, যেখানে কারিগরি ও বৃত্তিমূলক শিক্ষাকে বিশেষ গুরুত্ব দেওয়া হয়েছে। মাধ্যমিক স্তর থেকেই শিক্ষার্থীদের হাতে-কলমে প্রশিক্ষণ দেওয়া হবে।

শিক্ষামন্ত্রী বলেন, এই নীতির লক্ষ্য হলো দেশে দক্ষ কর্মশক্তি তৈরি করা এবং বেকারত্ব হ্রাস করা।`,
    category: 'bangladesh',
    categoryLabel: 'বাংলাদেশ',
    sourceName: 'সংবাদচক্র বার্তা',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/education/800/450',
    publishedAt: hoursAgo(36),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '28',
    title: 'মঙ্গলগ্রহে পানির নতুন প্রমাণ পেলেন বিজ্ঞানীরা',
    slug: 'mars-new-water-evidence-scientists',
    summary: 'নাসার মার্স রোভার মঙ্গলগ্রহের মাটির নিচে বড় আকারের হিমায়িত পানির ভাণ্ডারের প্রমাণ পেয়েছে।',
    content: `নাসার পার্সিভেরান্স রোভার মঙ্গলগ্রহে একটি গুরুত্বপূর্ণ আবিষ্কার করেছে। রোভারটি গ্রহের পৃষ্ঠের নিচে হিমায়িত পানির একটি বিশাল ভাণ্ডারের প্রমাণ পেয়েছে।

এই আবিষ্কার ভবিষ্যতে মঙ্গলগ্রহে মানব অভিযানের পথ সুগম করতে পারে। বিজ্ঞানীরা বলছেন, এই পানি মানুষের বসবাস ও জ্বালানি উৎপাদনে কাজে আসতে পারে।`,
    category: 'science',
    categoryLabel: 'বিজ্ঞান',
    sourceName: 'সংবাদচক্র বিজ্ঞান',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/mars/800/450',
    publishedAt: hoursAgo(40),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '29',
    title: 'ওটিটি প্ল্যাটফর্মে বাংলা কন্টেন্টের চাহিদা বেড়েছে',
    slug: 'ott-platform-bengali-content-demand',
    summary: 'আন্তর্জাতিক ওটিটি প্ল্যাটফর্মগুলো বাংলা ভাষায় আরও বেশি কন্টেন্ট তৈরির পরিকল্পনা করছে।',
    content: `নেটফ্লিক্স, অ্যামাজন প্রাইমসহ বড় ওটিটি প্ল্যাটফর্মগুলো বাংলা ভাষায় মৌলিক কন্টেন্ট তৈরিতে বিনিয়োগ বাড়াচ্ছে। বাংলাদেশ ও পশ্চিমবঙ্গের মিলিত দর্শক বেসকে টার্গেট করে এই পরিকল্পনা করা হচ্ছে।

বাংলাদেশের প্রযোজনা প্রতিষ্ঠানগুলো এই সুযোগকে কাজে লাগাতে আন্তর্জাতিক প্ল্যাটফর্মের সাথে চুক্তি করছে।`,
    category: 'entertainment',
    categoryLabel: 'বিনোদন',
    sourceName: 'সংবাদচক্র বিনোদন',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/ott/800/450',
    publishedAt: hoursAgo(44),
    isBreaking: false,
    status: 'published',
  },
  {
    id: '30',
    title: 'আইপিএলে বাংলাদেশি ক্রিকেটারের দুর্দান্ত পারফরম্যান্স',
    slug: 'ipl-bangladeshi-cricketer-performance',
    summary: 'আইপিএলে বাংলাদেশের একজন ক্রিকেটার মাত্র ৩০ বলে ৭৫ রান করে দর্শকদের মুগ্ধ করেছেন।',
    content: `ইন্ডিয়ান প্রিমিয়ার লিগে বাংলাদেশের একজন ক্রিকেটার আলোচনার কেন্দ্রে এসেছেন। মাত্র ৩০ বলে ৭৫ রানের বিধ্বংসী ইনিংস খেলে তিনি দর্শকদের মুগ্ধ করেছেন।

আন্তর্জাতিক ক্রিকেট বিশ্লেষকরা এই পারফরম্যান্সকে অসাধারণ বলে অভিহিত করেছেন। তার দল এই ম্যাচে চমৎকার জয় পেয়েছে।`,
    category: 'sports',
    categoryLabel: 'খেলাধুলা',
    sourceName: 'সংবাদচক্র স্পোর্টস',
    sourceUrl: '#',
    imageUrl: 'https://picsum.photos/seed/ipl/800/450',
    publishedAt: hoursAgo(48),
    isBreaking: false,
    status: 'published',
  },
]

// ─── Helper query functions (will be replaced by Supabase queries in Phase 4) ──

export function getAllNews(): NewsArticle[] {
  return mockNews.filter((n) => n.status === 'published')
}

export function getBreakingNews(): NewsArticle[] {
  return mockNews.filter((n) => n.isBreaking && n.status === 'published')
}

export function getNewsByCategory(category: string): NewsArticle[] {
  return mockNews.filter((n) => n.category === category && n.status === 'published')
}

export function getNewsById(id: string): NewsArticle | undefined {
  return mockNews.find((n) => n.id === id)
}

export function getNewsBySlug(slug: string): NewsArticle | undefined {
  return mockNews.find((n) => n.slug === slug && n.status === 'published')
}

export function getLatestNews(limit = 10): NewsArticle[] {
  return getAllNews()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
}

export function getPopularNews(limit = 5): NewsArticle[] {
  // In Phase 4, this will query by view count; for now shuffle slightly
  return getAllNews().slice(5, 5 + limit)
}

export function getFeaturedNews(): NewsArticle {
  return mockNews[0]
}

export function searchNews(query: string): NewsArticle[] {
  const q = query.toLowerCase()
  return getAllNews().filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.summary.toLowerCase().includes(q) ||
      n.categoryLabel.toLowerCase().includes(q)
  )
}

export function getRelatedNews(article: NewsArticle, limit = 4): NewsArticle[] {
  return getAllNews()
    .filter((n) => n.category === article.category && n.id !== article.id)
    .slice(0, limit)
}

export const opinionArticles: NewsArticle[] = [
  {
    id: 'op-1',
    title: 'আমাদের শিক্ষা ব্যবস্থা ও ভবিষ্যৎ প্রজন্মের দক্ষতা উন্নয়ন',
    slug: 'opinion-education-system-future-skills',
    summary:
      'একবিংশ শতাব্দীর চ্যালেঞ্জ মোকাবেলায় মুখস্থবিদ্যার চেয়ে সৃজনশীলতা ও সমালোচনামূলক চিন্তার গুরুত্ব এখন অনেক বেশি। কারিকুলাম সংস্কার ও শিক্ষক প্রশিক্ষণে অগ্রাধিকার দরকার।',
    content: `শিক্ষা কেবল ডিগ্রি অর্জনের মাধ্যম নয়, বরং একজন মানুষের মানসিক দৃষ্টিভঙ্গি পরিবর্তনের প্রধান চালিকাশক্তি। আধুনিক বিশ্বে প্রযুক্তিগত বিপ্লব আমাদের কর্মসংস্থানের সনাতন ধারণাগুলোকে প্রতিনিয়ত বদলে দিচ্ছে। সেখানে আমাদের প্রথাগত মুখস্থনির্ভর পরীক্ষা ব্যবস্থা শিক্ষার্থীদের ভবিষ্যৎ কর্মজীবনের জন্য পর্যাপ্ত দক্ষতা দিতে পারছে না।

বর্তমানে বিশ্বজুড়ে যে দক্ষতাগুলোর চাহিদা সবচেয়ে বেশি, তা হলো সমস্যা সমাধানের সক্ষমতা, প্রযুক্তি সাক্ষরতা, যোগাযোগ দক্ষতা ও দলগত কাজ। আমাদের কারিকুলামে এই দক্ষতাগুলো অন্তর্ভুক্তি কেবল কাগজে-কলমে থাকলে চলবে না, শ্রেণীকক্ষে এর বাস্তবায়ন নিশ্চিত করতে হবে।

শিক্ষকদের পর্যাপ্ত প্রশিক্ষণ ও মর্যাদা বৃদ্ধি ছাড়া কোনো শিক্ষা সংস্কারই সফল হতে পারে না। প্রাথমিক ও মাধ্যমিক স্তরে শিক্ষকদের ডিজিটাল শিক্ষণ পদ্ধতি এবং আধুনিক মূল্যায়ন কৌশলে দক্ষ করে তোলা এখন সময়ের সবচেয়ে বড় দাবি।

একই সাথে উচ্চশিক্ষা প্রতিষ্ঠানগুলোতে শিল্পের চাহিদা অনুযায়ী কোর্স ও গবেষণার পরিধি বিস্তৃত করতে হবে। বিশ্ববিদ্যালয় ও শিল্প প্রতিষ্ঠানের যৌথ অংশীদারিত্ব বৃদ্ধি পেলে তবেই আমাদের তরুণরা বিশ্ববাজারে নেতৃত্ব দিতে পারবে।`,
    category: 'opinion',
    categoryLabel: 'মতামত',
    sourceName: 'সংবাদচক্র কলাম',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(4),
    isBreaking: false,
    status: 'published',
    isOpinion: true,
    readingTime: 4,
    author: {
      name: 'ড. জামিলুর রহমান',
      title: 'শিক্ষাবিদ ও গবেষক',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'op-2',
    title: 'কৃত্রিম বুদ্ধিমত্তা ও বাংলা ভাষার ডিজিটাল অগ্রগতি',
    slug: 'opinion-ai-and-bengali-language-progress',
    summary:
      'বাংলা টেক্সট ও ভয়েস ডেটাসেট তৈরি না করলে বিশ্বমঞ্চে আমাদের ভাষা প্রযুক্তির দৌড়ে পিছিয়ে পড়তে পারে। স্থানীয় উদ্যোগে বৃহৎ ভাষার মডেল তৈরি জরুরি।',
    content: `বর্তমান যুগে কৃত্রিম বুদ্ধিমত্তা ও লার্জ ল্যাঙ্গুয়েজ মডেল (LLM) তৈরির বৈশ্বিক প্রতিযোগিতায় স্থানীয় ভাষার স্বকীয়তা বজায় রাখা এক বিরাট চ্যালেঞ্জ। বিশ্বের প্রায় ৩০ কোটি মানুষের মাতৃভাষা বাংলা হলেও, আন্তর্জাতিক ডিজিটাল পরিসরে উচ্চমানের বাংলা ডেটাসেটের প্রাপ্যতা এখনও তুলনামূলকভাবে সীমিত।

ইংরেজি বা অন্যান্য প্রধান ভাষার তুলনায় বাংলায় ন্যাচারাল ল্যাঙ্গুয়েজ প্রসেসিং (NLP) গবেষণায় বিনিয়োগ অনেক কম। ফলে আন্তর্জাতিক এআই সিস্টেমগুলোতে বাংলা ভাষার ব্যাকরণগত সূক্ষ্মতা ও সাংস্কৃতিক অনুষঙ্গ অনেক সময় সঠিকভাবে ফুটে ওঠে না।

আমাদের বিশ্ববিদ্যালয়, প্রযুক্তি প্রতিষ্ঠান এবং সরকারের যৌথ উদ্যোগে একটি জাতীয় বাংলা ল্যাঙ্গুয়েজ কর্পাস এবং প্রমিত ভয়েস ডেটাসেট গড়ে তোলা জরুরি। এটি করা গেলে স্থানীয় প্রযুক্তি উদ্ভাবকেরা বাংলায় বিশ্বমানের এআই অ্যাপ্লিকেশন তৈরি করতে সক্ষম হবেন।

প্রযুক্তির বিকাশের সাথে সাথে মাতৃভাষার গৌরব অক্ষুণ্ণ রাখতে হলে ডিজিটাল বিশ্বে বাংলার বলিষ্ঠ উপস্থিতি নিশ্চিত করার কোনো বিকল্প নেই।`,
    category: 'opinion',
    categoryLabel: 'মতামত',
    sourceName: 'সংবাদচক্র কলাম',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(8),
    isBreaking: false,
    status: 'published',
    isOpinion: true,
    readingTime: 3,
    author: {
      name: 'ফারহানা ইসলাম',
      title: 'প্রযুক্তি বিশ্লেষক ও এআই গবেষক',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  },
  {
    id: 'op-3',
    title: 'শহরের পরিবেশ রক্ষা ও নাগরিক সচেতনতা',
    slug: 'opinion-city-environment-civic-awareness',
    summary:
      'কেবল সরকারি উদ্যোগ নয়, নাগরিক দায়িত্বশীলতাই পারে ঢাকাকে একটি স্বাস্থ্যকর বাসযোগ্য নগরী করে তুলতে। বর্জ্য ব্যবস্থাপনা ও সবুজায়নে যৌথ অংশগ্রহণ কাম্য।',
    content: `বায়ুদূষণ, শব্দদূষণ এবং অপরিকল্পিত বর্জ্য নিষ্কাশনে আমাদের রাজধানীসহ বড় শহরগুলো প্রতিনিয়ত স্বাস্থ্যঝুঁকির সম্মুখীন হচ্ছে। আন্তর্জাতিক বায়ুমান সূচকে প্রায়শই আমাদের শহরের নাম উদ্বেগজনক অবস্থানে দেখতে পাওয়া কোনো গর্বের বিষয় নয়।

পরিবেশ সুরক্ষায় সরকারি আইন এবং সিটি কর্পোরেশনের নানাবিধ কর্মসূচি রয়েছে সত্য, কিন্তু নাগরিক হিসেবে আমরা কতটা দায়িত্ব পালন করছি—সে প্রশ্নটি তোলাও জরুরি। যেখানে-সেখানে প্লাস্টিক বর্জ্য ফেলা, খাল ও জলাশয় ভরাট করা কিংবা নিয়ম না মেনে ভবন নির্মাণের ফলে শহর ধীরে ধীরে বসবাস অনুপযোগী হয়ে পড়ছে।

আমাদের প্রত্যেকে নিজের আঙিনা ও ছাদবাগান থেকে শুরু করে এলাকাভিত্তিক সবুজায়ন আন্দোলনে অংশ নিতে পারি। একই সাথে পুনর্ব্যবহারযোগ্য পণ্যের ব্যবহার বৃদ্ধি ও এককালীন প্লাস্টিকের বর্জন বাধ্যতামূলক করতে হবে।

একটি সুস্থ, সুন্দর ও সবুজ নগরী গড়ে তোলা শুধু প্রশাসনের দায়িত্ব নয়, এটি প্রতিটি নাগরিকের বেঁচে থাকার অধিকার ও প্রতিশ্রিতির অংশ।`,
    category: 'opinion',
    categoryLabel: 'মতামত',
    sourceName: 'সংবাদচক্র কলাম',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(12),
    isBreaking: false,
    status: 'published',
    isOpinion: true,
    readingTime: 3,
    author: {
      name: 'তানভীর আহমেদ',
      title: 'পরিবেশ আন্দোলনকর্মী',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  },
]

export const videoArticles: NewsArticle[] = [
  {
    id: 'vid-1',
    title: 'পদ্মা রেল সংযোগ: নতুন রুটে ট্রেনের প্রথম পরীক্ষামূলক যাত্রা',
    slug: 'video-padma-rail-test-run',
    summary:
      'পদ্মা সেতু হয়ে ঢাকা থেকে ভাঙ্গা পর্যন্ত নতুন রেললাইনে যাত্রীবাহী ট্রেনের সফল গতি পরীক্ষা ও যাত্রীদের প্রথম অভিজ্ঞতার বিশেষ সচিত্র প্রতিবেদন।',
    content: `পদ্মা সেতু হয়ে রেল যোগাযোগের ঐতিহাসিক সূচনায় নতুন দিগন্ত উন্মোচিত হয়েছে। ঢাকা থেকে মাওয়া হয়ে ভাঙ্গা পর্যন্ত রেললাইনে আজ সফলভাবে বাণিজ্যিক গতির পরীক্ষামূলক ট্রেন চালানো হয়েছে।

সকাল ৯টায় রাজধানীর কমলাপুর রেলওয়ে স্টেশন থেকে পরীক্ষামূলক বিশেষ ট্রেনটি ছেড়ে যায়। ট্রেনটি মাত্র দুই ঘণ্টার মধ্যে পদ্মার বুক চিরে ভাঙ্গা জংশনে পৌঁছে যাত্রীদের মধ্যে অভূতপূর্ব উদ্দীপনার সৃষ্টি করে।

রেলওয়ে প্রকল্পের শীর্ষ কর্মকর্তারা জানান, এই রুটে সর্বাধুনিক সিগন্যালিং সিস্টেম ও ট্র্যাক প্রযুক্তি ব্যবহার করা হয়েছে। এটি দক্ষিণ-পশ্চিমাঞ্চলের ২১টি জেলার সাথে রাজধানীর যোগাযোগ সময় অর্ধেকে নামিয়ে আনবে।

আগামী সপ্তাহ থেকেই সাধারণ যাত্রীদের জন্য নিয়মিত ট্রেনের টিকিট উন্মুক্ত করার প্রস্তুতি চলছে বলে জানিয়েছে কর্তৃপক্ষ।`,
    category: 'video',
    categoryLabel: 'ভিডিও',
    sourceName: 'সংবাদচক্র মাল্টিমিডিয়া',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(3),
    isBreaking: false,
    status: 'published',
    isVideo: true,
    videoDuration: '০৩:৪৫',
    readingTime: 2,
  },
  {
    id: 'vid-2',
    title: 'মিরপুর শেরেবাংলা স্টেডিয়ামে টাইগারদের জমজমাট অনুশীলন সেশন',
    slug: 'video-tigers-practice-session-mirpur',
    summary:
      'আসন্ন ত্রিদেশীয় ও টেস্ট সিরিজের প্রস্তুতিতে জাতীয় ক্রিকেট দলের সদস্যদের তীব্র ঘাম ঝরানোর এক্সক্লুসিভ ফুটেজ ও প্রধান কোচের বিশেষ সাক্ষাৎকার।',
    content: `মিরপুর শেরেবাংলা জাতীয় ক্রিকেট স্টেডিয়ামে সকাল থেকেই কঠোর অনুশীলনে ব্যস্ত সময় পার করছেন জাতীয় দলের ক্রিকেটাররা। আসন্ন আন্তর্জাতিক সিরিজকে সামনে রেখে ফিল্ডিং ও স্পিন বোলিংয়ের ওপর বাড়তি জোর দেওয়া হচ্ছে।

আজকের অনুশীলনে প্রধান কোচ ক্রিকেটারদের কৌশলগত পরিবর্তনের ওপর নিবিড়ভাবে কাজ করেন। বিশেষ করে পাওয়ারপ্লেতে রান রেট বৃদ্ধি এবং ডেথ ওভারে নিয়ন্ত্রিত বোলিংয়ের বিশেষ ড্রিল পরিচালনা করা হয়।

অধিনায়ক সংবাদ সম্মেলনে জানান, দলের মনোবল এখন অত্যন্ত চাঙ্গা। তরুণ ও অভিজ্ঞ খেলোয়াড়দের চমৎকার সমন্বয়ে আসন্ন হোম সিরিজে ইতিবাচক ফলাফল উপহার দিতে চান তারা।`,
    category: 'video',
    categoryLabel: 'ভিডিও',
    sourceName: 'সংবাদচক্র মাল্টিমিডিয়া',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(5),
    isBreaking: false,
    status: 'published',
    isVideo: true,
    videoDuration: '০২:১৮',
    readingTime: 2,
  },
  {
    id: 'vid-3',
    title: 'আবহাওয়া পূর্বাভাস: আগামী তিন দিনের বিশেষ আবহাওয়া চিত্র',
    slug: 'video-weather-forecast-three-days',
    summary:
      'দেশের বিভিন্ন অঞ্চলে মৌসুমী বায়ুর সক্রিয়তায় মাঝারি থেকে ভারী বৃষ্টির সম্ভাবনা ও তাপমাত্রা হ্রাসের বিস্তারিত স্যাটেলাইট বুলেটিন।',
    content: `আবহাওয়া অধিদপ্তর থেকে প্রাপ্ত সর্বশেষ স্যাটেলাইট চিত্রে দেখা যাচ্ছে, উত্তর বঙ্গোপসাগর ও তৎসংলগ্ন এলাকায় একটি সঞ্চারণশীল মেঘমালার সৃষ্টি হয়েছে। এর প্রভাবে দেশের উপকূলীয় অঞ্চলসহ মধ্যাঞ্চলে আগামী ৭২ ঘণ্টায় বজ্রসহ বৃষ্টিপাত হতে পারে।

ঢাকা, চট্টগ্রাম, খুলনা ও বরিশাল বিভাগের অনেক জায়গায় অস্থায়ীভাবে দমকা হাওয়াসহ হালকা থেকে মাঝারি ধরনের বৃষ্টি বা বজ্রবৃষ্টি হতে পারে। কোথাও কোথাও ভারী বর্ষণেরও আশঙ্কা রয়েছে।

বৃষ্টির কারণে সামগ্রিক তাপমাত্রা দুই থেকে তিন ডিগ্রি সেলসিয়াস হ্রাস পেতে পারে বলে পূর্বাভাসে জানানো হয়েছে। সমুদ্রবন্দরসমূহকে সতর্ক সংকেত মেনে চলতে বলা হয়েছে।`,
    category: 'video',
    categoryLabel: 'ভিডিও',
    sourceName: 'সংবাদচক্র মাল্টিমিডিয়া',
    sourceUrl: '#',
    imageUrl: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=800&auto=format&fit=crop&q=80',
    publishedAt: hoursAgo(7),
    isBreaking: false,
    status: 'published',
    isVideo: true,
    videoDuration: '০১:৫০',
    readingTime: 2,
  },
]

// Register opinion and video articles into the central news collection
mockNews.push(...opinionArticles, ...videoArticles)

export function getOpinionNews(): NewsArticle[] {
  return opinionArticles
}

export function getVideoNews(): NewsArticle[] {
  return videoArticles
}

export function getNewsByDivision(divisionId: string): NewsArticle[] {
  const all = getAllNews()
  if (divisionId === 'all') return all.slice(0, 6)

  // Map simulated divisions to mock articles
  const divMap: Record<string, number[]> = {
    dhaka: [0, 3, 7, 9],
    chittagong: [5, 11, 14],
    rajshahi: [10, 15],
    khulna: [1, 20],
    barisal: [21, 25],
    sylhet: [4, 18],
    rangpur: [2, 12],
    mymensingh: [8, 16],
  }
  const indices = divMap[divisionId] || [0, 1, 2]
  return indices.map((idx) => all[idx % all.length]).filter(Boolean)
}
