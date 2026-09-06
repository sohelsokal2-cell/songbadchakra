-- ==============================================================================
-- Fix Daily Star Bangla RSS feed URL
-- The previous seed used `https://bangla.thedailystar.net/feed` which returns
-- HTTP 404. The current live endpoint is `https://bangla.thedailystar.net/rss.xml`
-- (verified 200 OK, content-type: application/rss+xml).
-- Idempotent — safe to run on existing deployments.
-- ==============================================================================

update public.sources
set feed_url = 'https://bangla.thedailystar.net/rss.xml'
where id like 'src-daily-star%'
   or id = 'src-daily-star'
   or feed_url = 'https://bangla.thedailystar.net/feed';