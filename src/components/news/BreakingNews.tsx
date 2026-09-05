import { getBreakingNews } from '@/data/mockNews'

export default function BreakingNews() {
  const breaking = getBreakingNews()

  if (breaking.length === 0) return null

  const tickerText = breaking.map((n) => `🔴 ${n.title}`).join('   •   ')

  return (
    <div
      role="marquee"
      aria-label="ব্রেকিং নিউজ"
      className="bg-[var(--color-primary)] text-white py-2 overflow-hidden"
    >
      <div className="max-w-[var(--max-width-site)] mx-auto px-4 flex items-center gap-3">
        {/* Label */}
        <span className="shrink-0 bg-white text-[var(--color-primary)] font-bold text-xs px-3 py-1 rounded-sm uppercase tracking-wide leading-tight">
          ব্রেকিং
        </span>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="ticker-scroll text-sm font-medium whitespace-nowrap">
            {tickerText}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{tickerText}
          </div>
        </div>
      </div>
    </div>
  )
}
