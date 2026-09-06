# সংবাদচক্র: বর্তমান অবস্থা ও পরবর্তী কাজের রোডম্যাপ

শেষ আপডেট: ৬ সেপ্টেম্বর ২০২৬

## এই ডকুমেন্টের উদ্দেশ্য

এই রোডম্যাপটি বর্তমান build যেখানে এসে পৌঁছেছে, সেখান থেকে production launch এবং পরবর্তী automation পর্যন্ত বাকি কাজ phase অনুযায়ী সাজায়। প্রতিটি phase-এর acceptance criteria পূরণ না করে পরের phase-এ যাওয়া উচিত নয়।

## বর্তমান অবস্থা (আপডেট: সেপ্টেম্বর ২০২৬)

### সম্পন্ন (Completed)

- Next.js 16, TypeScript, App Router, Tailwind CSS এবং ESLint project setup
- বাংলা news portal homepage ও responsive public pages
- Category, article details, search, popular, opinion, video এবং dynamic sitemap routes
- Admin login, dashboard, article CRUD, breaking-news management এবং contact inbox
- HMAC-signed admin session এবং protected admin API routes
- Local development persistence & fallback: `.data/portal-data.json`
- Published article-এর জন্য public repository read path
- Supabase REST-compatible article এবং contact repository
- **Phase 4 & 5 (Supabase Schema & Connectivity)**:
  - Canonical `articles`, `contact_messages`, `sources`, `ai_logs` migrations apply
  - RLS policies (anon read published, service_role full control)
  - Partial unique index `idx_articles_source_url_unique` on `articles(source_url)`
  - Safe, idempotent migrations (`IF NOT EXISTS`) without destructive `DROP TABLE`
  - Database Safety Guard migration (`20260906_database_safety_guards.sql`)
  - Repository-level anti-mass-deletion guards
- **Phase 6 & 7 (Testing & Seed Data)**:
  - Vitest test suite (`admin-auth.test.ts`, `news-repository.test.ts`, `rss-ingestion.test.ts`, `contact-form.test.ts`)
  - Live Supabase E2E smoke test script (`scripts/smoke-test-supabase.mjs`)
  - Curated, high-resolution thematic Unsplash photos for sample articles
  - `SafeImage` client component with automatic fallback for broken/missing images
- **Phase 8 (Cloudflare Readiness & Caching)**:
  - `@opennextjs/cloudflare` adapter and `wrangler.jsonc` setup
  - Strict security headers (`HSTS`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`)
  - Edge Cache rules configured in `next.config.ts` (1-year immutable for static assets, 60s/300s SWR for public news, strict `no-store` / `Surrogate-Control: no-store` for admin & auth)
- **Phase 9 (RSS & AI News Automation)**:
  - Automated RSS ingestion pipeline (`src/lib/rss-ingestion.ts`) with HTML sanitization
  - Google Gemini AI summarization and categorization
  - Admin `SourcesManager` (full source CRUD, toggle, interval) and `AiDraftsManager` (preview, approve, reject)
  - Dedicated `/api/cron/rss` scheduled route secured with `CRON_SECRET`
  - GitHub Actions hourly cron workflow (`.github/workflows/rss-cron.yml`)

### পরবর্তী ধাপ (Next Step - Phase 10)

- Cloudflare remote deployment (`npm run cf:deploy`) যখন ইউজার deploy করতে চাইবেন।
- Custom domain connection ও final live DNS setup।
- Google Search Console ও Google News Publisher Center submission।

---

## Phase 4: Supabase Schema Reconciliation

### লক্ষ্য

বর্তমান code এবং Supabase database-কে একটি canonical schema-তে আনা। বর্তমান application contract অনুযায়ী `articles` table canonical রাখা হবে। পুরোনো `news` table একই সঙ্গে production source হিসেবে ব্যবহার করা যাবে না।

### করণীয়

1. Supabase Dashboard থেকে বর্তমান tables এবং data backup/export করো। বিশেষ করে `news`, `categories`, `sources`, `ai_logs`-এ গুরুত্বপূর্ণ data আছে কি না পরীক্ষা করো।
2. `supabase/migrations/20260905_create_articles.sql` SQL Editor-এ চালাও।
3. `supabase/migrations/20260905_create_contact_messages.sql` SQL Editor-এ চালাও।
4. Table Editor-এ নিচের tables নিশ্চিত করো:
   - `articles`
   - `contact_messages`
   - পুরোনো `categories`
   - পুরোনো `news`
   - পুরোনো `sources`
   - পুরোনো `ai_logs`
5. `articles` এবং `contact_messages`-এ RLS enabled আছে কি না পরীক্ষা করো।
6. Policies পরীক্ষা করো:
   - Anonymous user শুধু published article পড়তে পারবে।
   - Anonymous user contact message insert করতে পারবে।
   - Contact message select/update/delete শুধু service role করতে পারবে।
   - Article insert/update/delete শুধু service role করতে পারবে।
7. পুরোনো `news` table-এ real data থাকলে `articles` schema-তে migration SQL লিখে data copy করো। সরাসরি table drop কোরো না।
8. Data migration যাচাই করার পর পুরোনো `news` table rename করে `news_legacy` রাখো অথবা archive করো। তাৎক্ষণিক destructive drop এড়িয়ে চলো।
9. `src/types/news.ts`-এর পুরোনো “Supabase news table” comment canonical `articles` table অনুযায়ী update করো।

### গুরুত্বপূর্ণ সিদ্ধান্ত

- নতুন development-এ `articles` table ব্যবহার হবে।
- `categories` table আপাতত taxonomy/reference হিসেবে রাখা যেতে পারে, কিন্তু application বর্তমানে article-এর মধ্যে `category` ও `category_label` সংরক্ষণ করে। ভবিষ্যতে foreign-key normalization আলাদা migration হিসেবে করা যাবে।
- `sources` ও `ai_logs` Phase 9-এর automation-এর জন্য রাখা হবে।

### Acceptance Criteria

- Supabase-এ `articles` এবং `contact_messages` table তৈরি হয়েছে।
- Required indexes, unique slug এবং RLS policies সক্রিয়।
- Anonymous REST request draft article পড়তে পারে না।
- Service role article CRUD এবং inbox CRUD করতে পারে।
- কোনো গুরুত্বপূর্ণ legacy data হারায়নি।

---

## Phase 5: Environment ও Supabase Connection

### লক্ষ্য

Local application-কে real Supabase project-এর সঙ্গে নিরাপদভাবে connect করা।

### করণীয়

1. Project root-এ `.env.local` তৈরি করো। এটি Git-এ commit করা যাবে না।
2. নিচের variables configure করো:

```env
ADMIN_EMAIL=editor@example.com
ADMIN_PASSWORD=use-a-long-unique-password
ADMIN_SESSION_SECRET=generate-at-least-32-random-characters
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
SUPABASE_SERVICE_ROLE_KEY=server-only-service-role-key
```

3. `ADMIN_SESSION_SECRET` random value দিয়ে তৈরি করো। উদাহরণ:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

4. `SUPABASE_SERVICE_ROLE_KEY` কখনো `NEXT_PUBLIC_` prefix-এ রাখবে না এবং client component-এ import করবে না।
5. Development server restart করো:

```powershell
npm run dev
```

6. নিচের manual smoke tests করো:
   - `/admin/login`-এ configured credentials দিয়ে login
   - Admin থেকে একটি draft article তৈরি
   - Draft public URL-এ না দেখা
   - Article publish করা
   - Homepage/category/article URL-এ দেখা
   - Breaking status toggle করে homepage ticker-এ দেখা
   - Contact form submit করে admin inbox-এ message দেখা
   - Message read/unread এবং delete কাজ করা
7. Supabase Table Editor-এ একই changes persist হয়েছে কি না পরীক্ষা করো।
8. Dev server restart করে data থেকে যায় কি না যাচাই করো।

### Acceptance Criteria

- Local app Supabase থেকে article পড়ে এবং Supabase-এ mutation করে।
- Restart-এর পর data অক্ষত থাকে।
- Draft public route থেকে গোপন থাকে।
- Contact message একই inbox-এ আসে এবং manage করা যায়।
- Browser bundle বা Git history-তে service-role key নেই।

---

## Phase 6: Initial Content Migration ও Editorial Workflow

### লক্ষ্য

Mock/seed content থেকে real database-backed editorial workflow-এ যাওয়া।

### করণীয়

1. `src/data/mockNews.ts`-এর seed articles একবার Supabase `articles` table-এ import করার script তৈরি করো।
2. Import idempotent করো; একই slug পুনরায় insert করা যাবে না।
3. Import-এর আগে image URLs, dates, categories এবং author data validate করো।
4. Placeholder/fake articles চিহ্নিত করো এবং production-এ publish হবে কি না editorial decision নাও।
5. Category naming একরূপ করো:
   - `latest`
   - `bangladesh`
   - `international`
   - `politics`
   - `sports`
   - `technology`
   - `business`
   - `entertainment`
   - `science`
   - `lifestyle`
   - `opinion`
   - `video`
6. Admin form-এ duplicate slug, draft, publish, edit এবং delete flow manually verify করো।
7. Production Supabase connect হওয়ার পর `mockNews`-কে runtime source হিসেবে ব্যবহার না করার পরিকল্পনা করো; এটি শুধু development seed fixture হিসেবে থাকবে।
8. Image strategy নির্ধারণ করো:
   - Supabase Storage upload, অথবা
   - নির্দিষ্ট trusted remote image hosts
9. Supabase Storage ব্যবহার করলে bucket, upload policy, size limit এবং MIME validation যোগ করো।

### Acceptance Criteria

- Initial article dataset Supabase-এ আছে।
- Duplicate import data তৈরি করে না।
- প্রত্যেক published article-এর valid slug, category, image এবং timestamp আছে।
- Editorial draft-to-publish workflow documented এবং tested।

---

## Phase 7: Security Hardening ও Automated Tests

### লক্ষ্য

Launch-এর আগে authentication, authorization, persistence এবং public API regression ঠেকানো।

### করণীয়

1. একটি test framework যোগ করো:
   - Unit/integration: Vitest
   - Browser end-to-end: Playwright
2. Admin auth tests যোগ করো:
   - Correct login
   - Wrong password
   - Missing production configuration
   - Tampered token
   - Expired token
   - Future-issued token
   - Logout cookie removal
3. Admin API authorization tests যোগ করো:
   - Unauthenticated GET/POST/PUT/PATCH/DELETE rejected
   - Authenticated CRUD succeeds
4. Article validation tests যোগ করো:
   - Duplicate slug returns `409`
   - ID cannot be changed
   - Draft cannot remain breaking
   - Invalid image host rejected
   - Invalid status/category/body rejected
5. Contact tests যোগ করো:
   - Field minimum/maximum limits
   - Invalid email
   - Rate limit
   - Persisted ID equals response ID
   - Read/unread contract
6. In-memory rate limiting-এর বদলে production-grade distributed limiter যোগ করো। Cloudflare deployment হলে Workers KV বা Durable Object ব্যবহার করা যেতে পারে।
7. Admin login endpoint-এ rate limiting যোগ করো।
8. CSRF threat model review করো। SameSite cookie থাকা সত্ত্বেও mutation routes-এ Origin/Host validation যোগ করার কথা বিবেচনা করো।
9. Security headers configure করো:
   - Content-Security-Policy
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy
   - Strict-Transport-Security production-এ
10. Contact message retention policy এবং deletion schedule নির্ধারণ করো।
11. `push.bat` বাদ দিয়ে reviewed Git workflow ব্যবহার করো; blind `git add -A` এবং auto-generated commit message এড়িয়ে চলো।

### Required Commands

```powershell
npm run lint
npm run build
npm test
npx playwright test
```

### Acceptance Criteria

- Critical auth/API tests automated এবং passing।
- Login ও contact rate limiting distributed environment-এ কাজ করে।
- Unauthorized mutation সম্ভব নয়।
- Security headers production response-এ উপস্থিত।
- কোনো secret repository বা client bundle-এ নেই।

---

## Phase 8: Cloudflare Deployment

### লক্ষ্য

Next.js application Cloudflare-এ deploy করে Supabase-backed production portal চালু করা।

### Deployment শুরু করার আগে

- Next.js 16-এর জন্য Cloudflare-এর বর্তমান official adapter/runtime support যাচাই করো। পুরোনো Pages-only tutorial অনুসরণ কোরো না।
- Node filesystem production persistence হিসেবে ব্যবহার করা যাবে না। Production-এ Supabase বাধ্যতামূলক থাকবে।
- `fs/promises` local fallback Cloudflare bundle/runtime-এ সমস্যা করলে local repository-কে আলাদা Node-only module-এ split করতে হবে।

### করণীয়

1. Cloudflare-এর current Next.js deployment guide অনুযায়ী adapter install করো। সাধারণত OpenNext Cloudflare adapter প্রয়োজন হতে পারে, তবে install-এর সময় official current version যাচাই করতে হবে।
2. Wrangler configuration তৈরি করো।
3. Preview ও deploy scripts `package.json`-এ যোগ করো।
4. Cloudflare secrets configure করো:
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Secrets কখনো `wrangler.toml` বা committed file-এ plaintext রাখবে না।
6. Preview deployment-এ সব dynamic routes পরীক্ষা করো।
7. Custom domain connect করো এবং HTTPS enforce করো।
8. Cloudflare cache rules-এ `/admin/*` ও `/api/*` cache disable করো।
9. Public article/category caching strategy নির্ধারণ করো; editorial publish-এর পর stale content যেন না থাকে।
10. Cloudflare logs এবং Supabase logs enable/inspect করো।
11. Production smoke test চালাও।

### Production Smoke Test

- Homepage mobile এবং desktop-এ load হয়
- Category ও article dynamic routes কাজ করে
- Admin login/logout কাজ করে
- Article create/edit/publish/delete কাজ করে
- Draft public নয়
- Breaking ticker update হয়
- Contact submit এবং inbox management কাজ করে
- Sitemap published articles দেখায়
- Unknown slug `404` দেয়
- কোনো route `500` বা Node filesystem error দেয় না

### Acceptance Criteria

- Custom domain HTTPS-এ live।
- Cloudflare runtime-এ সব server routes কাজ করে।
- Supabase ছাড়া production mutation silently local fallback ব্যবহার করে না।
- Admin/API responses edge cache-এ সংরক্ষিত হয় না।
- Rollback procedure জানা এবং tested।

---

## Phase 9: RSS ও AI News Automation

### লক্ষ্য

Cloudflare Worker বা scheduled server process দিয়ে source ingestion, AI processing এবং editorial approval workflow তৈরি করা।

### Recommended Flow

```text
Scheduled Worker
  -> active sources load
  -> RSS fetch
  -> source URL deduplicate
  -> raw item validate
  -> AI summarize/classify
  -> draft article insert
  -> ai_logs insert
  -> editor review
  -> publish/reject
```

### করণীয়

1. `sources` table-এ trusted RSS sources যোগ করো।
2. Source licensing, attribution এবং robots/terms যাচাই করো। অনুমতি ছাড়া full copyrighted article copy কোরো না।
3. Source URL-এর জন্য database-level unique constraint যোগ করো।
4. AI-generated content default `draft` রাখো; automatic publish প্রথম release-এ বন্ধ রাখো।
5. `ai_logs`-এ provider, model, status, token/cost metadata এবং error সংরক্ষণ করো।
6. Prompt injection-resistant ingestion design করো; RSS content-কে untrusted input হিসেবে treat করো।
7. HTML sanitize করো এবং scripts/iframes বাদ দাও।
8. Retry, timeout, exponential backoff এবং dead-letter strategy যোগ করো।
9. একই story একাধিক source থেকে এলে semantic বা URL deduplication করো।
10. Admin dashboard-এ pending AI drafts এবং failed jobs view যোগ করো।
11. Worker secrets Cloudflare secret store-এ রাখো।

### Acceptance Criteria

- Scheduled ingestion duplicate article তৈরি করে না।
- AI failure logs হয় এবং pipeline থেমে যায় না।
- AI output editor approval ছাড়া public হয় না।
- Source attribution সব article-এ থাকে।
- Malicious feed content rendered HTML/script হিসেবে execute হয় না।

---

## Phase 10: SEO, Analytics, Performance ও Launch

### লক্ষ্য

Portal-কে discoverable, measurable, fast এবং operationally supportable করা।

### করণীয়

1. Production domain অনুযায়ী `SITE_DOMAIN` এবং canonical URLs যাচাই করো।
2. `robots.txt` এবং dynamic `sitemap.xml` Search Console-এ submit করো।
3. NewsArticle structured data Google Rich Results Test-এ যাচাই করো।
4. Open Graph এবং social sharing preview পরীক্ষা করো।
5. Privacy-friendly analytics যোগ করো।
6. Core Web Vitals mobile/desktop পরীক্ষা করো।
7. Images resize/compress এবং correct dimensions নিশ্চিত করো।
8. Database query pagination এবং indexes production data volume দিয়ে পরীক্ষা করো।
9. Error monitoring যোগ করো।
10. Supabase backup/PITR plan এবং restore drill নির্ধারণ করো।
11. Admin operational guide তৈরি করো:
    - Login
    - Draft তৈরি
    - Publish/unpublish
    - Breaking toggle
    - Contact PII handling
    - Incident response
12. Legal pages final review করো:
    - Privacy policy
    - Terms/Disclaimer
    - Copyright and source attribution
    - Contact data retention

### Acceptance Criteria

- Search Console sitemap গ্রহণ করেছে।
- Lighthouse/Core Web Vitals target acceptable।
- Error monitoring এবং backup active।
- Editorial এবং incident-response workflow documented।
- Launch checklist sign-off হয়েছে।

---

## Phase 11: Post-Launch Improvements

Launch-এর পরে usage data অনুযায়ী নিচের কাজগুলো priority দেওয়া যাবে:

- Supabase Auth-based multi-user admin এবং role-based access
- Editor, reviewer এবং administrator roles
- Revision history ও audit log
- Scheduled publishing
- Real view count এবং সত্যিকারের popular-news ranking
- Media library ও image upload/cropping
- Category foreign-key normalization
- Full-text Bengali search
- Pagination/infinite loading
- Newsletter এবং push notification
- Advertisement management
- E-paper ingestion
- Comments/moderation, যদি প্রয়োজন হয়
- Disaster recovery এবং multi-region strategy

---

## Recommended Immediate Order

এখন নিচের order-এ কাজ করাই সবচেয়ে নিরাপদ:

1. Supabase backup এবং schema conflict যাচাই
2. `articles` ও `contact_messages` migrations apply
3. `.env.local` configure
4. End-to-end Supabase smoke test
5. Seed articles import
6. Automated auth/API tests
7. Cloudflare adapter এবং preview deployment
8. Production deployment
9. RSS/AI automation
10. SEO, monitoring এবং public launch

## Definition of Done

Project production-ready ধরা হবে যখন:

- Application-এর একমাত্র production source of truth Supabase
- Draft ও private contact data RLS/API authorization দিয়ে সুরক্ষিত
- Automated critical-path tests passing
- Cloudflare production deployment stable
- Secrets শুধু platform secret stores-এ
- Backup, monitoring এবং rollback প্রস্তুত
- Editorial workflow documented
- Sitemap, metadata এবং structured data production domain অনুযায়ী verified
