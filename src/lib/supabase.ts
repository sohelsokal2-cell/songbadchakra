/**
 * Supabase client — Phase 4 integration placeholder.
 *
 * DO NOT expose the service-role key to client-side code.
 * This file is server-only. Import only from Server Components or Route Handlers.
 *
 * To activate in Phase 4:
 * 1. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local
 * 2. Run: npm install @supabase/supabase-js
 * 3. Uncomment the code below
 */

// import { createClient } from '@supabase/supabase-js'
//
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
//
// // Server-only client with full access (never expose to browser)
// export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
//   auth: { persistSession: false },
// })
//
// // Public anon client (safe for server components — read-only published data)
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export {} // keep as module
