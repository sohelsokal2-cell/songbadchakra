interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
}

export default function EmptyState({
  title = 'কোনো সংবাদ পাওয়া যায়নি',
  description = 'এই বিভাগে এখন কোনো সংবাদ নেই। পরে আবার চেষ্টা করুন।',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="mb-4 text-gray-300">
        {icon ?? (
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15"
            />
          </svg>
        )}
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-secondary)] mb-2">{title}</h2>
      <p className="text-[var(--color-muted)] text-sm max-w-xs">{description}</p>
    </div>
  )
}
