'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

interface SearchBarProps {
  placeholder?: string
  defaultValue?: string
  autoFocus?: boolean
  onClose?: () => void
  className?: string
}

export default function SearchBar({
  placeholder = 'সংবাদ খুঁজুন...',
  defaultValue = '',
  autoFocus = false,
  onClose,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue)
  const router = useRouter()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    onClose?.()
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="সংবাদ অনুসন্ধান"
      className={`flex items-center gap-2 w-full ${className}`}
    >
      <div className="flex-1 relative">
        <label htmlFor="search-input" className="sr-only">সংবাদ খুঁজুন</label>
        <input
          id="search-input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[var(--color-border)] bg-white text-[var(--color-secondary)] placeholder:text-[var(--color-muted-light)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent text-sm font-[var(--font-bengali)]"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="অনুসন্ধান পরিষ্কার করুন"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-secondary)]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <button
        id="search-submit-btn"
        type="submit"
        aria-label="অনুসন্ধান করুন"
        className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors shrink-0"
      >
        খুঁজুন
      </button>
    </form>
  )
}
