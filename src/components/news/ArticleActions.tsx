'use client'

import { useState, useEffect, useRef, useSyncExternalStore, useCallback } from 'react'

interface ArticleActionsProps {
  title: string
  url: string
  content?: string
  articleId?: string
}

export default function ArticleActions({ title, url, content, articleId }: ArticleActionsProps) {
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal')
  const [isPlaying, setIsPlaying] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Synchronize bookmark state using useSyncExternalStore (React 19 compliant)
  const subscribeBookmarks = useCallback((callback: () => void) => {
    if (typeof window === 'undefined') return () => {}
    window.addEventListener('storage', callback)
    window.addEventListener('bookmarks-changed', callback)
    return () => {
      window.removeEventListener('storage', callback)
      window.removeEventListener('bookmarks-changed', callback)
    }
  }, [])

  const getBookmarkSnapshot = useCallback(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem('songbadchakra_bookmarks')
      if (stored) {
        const bookmarks = JSON.parse(stored) as Array<{ id?: string; url?: string }>
        return bookmarks.some((b) => (articleId && b.id === articleId) || b.url === url)
      }
    } catch {
      return false
    }
    return false
  }, [articleId, url])

  const getBookmarkServerSnapshot = () => false

  const isBookmarked = useSyncExternalStore(
    subscribeBookmarks,
    getBookmarkSnapshot,
    getBookmarkServerSnapshot
  )

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
    }
  }

  const cycleFontSize = () => {
    if (fontSize === 'normal') {
      setFontSize('large')
      document.documentElement.style.setProperty('--article-font-scale', '1.18')
    } else if (fontSize === 'large') {
      setFontSize('xlarge')
      document.documentElement.style.setProperty('--article-font-scale', '1.35')
    } else {
      setFontSize('normal')
      document.documentElement.style.setProperty('--article-font-scale', '1.0')
    }
  }

  const handleToggleBookmark = () => {
    try {
      const stored = localStorage.getItem('songbadchakra_bookmarks')
      const bookmarks = stored ? JSON.parse(stored) : []
      const currentId = articleId || url

      if (isBookmarked) {
        const updated = bookmarks.filter((b: { id?: string; url?: string }) => b.id !== currentId && b.url !== url)
        localStorage.setItem('songbadchakra_bookmarks', JSON.stringify(updated))
      } else {
        bookmarks.push({
          id: currentId,
          title,
          url,
          bookmarkedAt: new Date().toISOString(),
        })
        localStorage.setItem('songbadchakra_bookmarks', JSON.stringify(bookmarks))
      }
      window.dispatchEvent(new Event('bookmarks-changed'))
    } catch {
      // fallback
    }
  }

  const handleToggleAudio = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('আপনার ব্রাউজারে টেক্সট-টু-স্পিচ (অডিও) সুবিধা সমর্থিত নয়।')
      return
    }

    if (isPlaying) {
      window.speechSynthesis.cancel()
      setIsPlaying(false)
      return
    }

    window.speechSynthesis.cancel()

    // Clean text to read
    const textToRead = `${title}। ${content ? content.slice(0, 1000) : ''}`
    const utterance = new SpeechSynthesisUtterance(textToRead)
    utteranceRef.current = utterance

    // Look for Bengali voice if available
    const voices = window.speechSynthesis.getVoices()
    const bnVoice = voices.find((v) => v.lang.toLowerCase().includes('bn') || v.lang.toLowerCase().includes('bengali'))
    if (bnVoice) {
      utterance.voice = bnVoice
    }
    utterance.rate = 0.95
    utterance.pitch = 1.0

    utterance.onend = () => {
      setIsPlaying(false)
    }

    utterance.onerror = () => {
      setIsPlaying(false)
    }

    window.speechSynthesis.speak(utterance)
    setIsPlaying(true)
  }

  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
  const shareTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`
  const shareWhatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + url)}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y border-[var(--color-border)] my-6 text-sm">
      {/* ── Left: Font size + Audio listen ─────────────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Audio Listen */}
        <button
          type="button"
          onClick={handleToggleAudio}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold font-bengali transition-colors cursor-pointer ${
            isPlaying ? 'bg-red-600 text-white' : 'bg-red-50 text-[var(--color-brand-primary)] hover:bg-red-100'
          }`}
          title={isPlaying ? 'অডিও থামান' : 'খবরটি শুনুন'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>{isPlaying ? 'থামান' : 'শুনুন'}</span>
        </button>

        {/* Font size button */}
        <button
          type="button"
          onClick={cycleFontSize}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-[var(--color-text-secondary)] text-xs font-bold font-bengali transition-colors cursor-pointer"
          title="হরফের আকার পরিবর্তন করুন"
        >
          <span>অ</span>
          <span className="text-[10px] text-gray-500">
            {fontSize === 'normal' ? 'স্বাভাবিক' : fontSize === 'large' ? 'বড়' : 'অনেক বড়'}
          </span>
        </button>

        {/* Bookmark */}
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`p-1.5 rounded-full text-xs transition-colors cursor-pointer ${
            isBookmarked ? 'text-amber-600 bg-amber-50' : 'text-gray-500 hover:bg-gray-100'
          }`}
          title={isBookmarked ? 'বুকমার্ক সরানো হয়েছে' : 'বুকমার্ক করুন'}
        >
          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {/* ── Right: Social Share Icons ──────────────────────────────────────── */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-text-muted)] font-bengali mr-1">শেয়ার:</span>

        {/* Facebook */}
        <a
          href={shareFacebook}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#1877F2]/10 hover:bg-[#1877F2] text-[#1877F2] hover:text-white flex items-center justify-center transition-colors"
          title="ফেসবুকে শেয়ার করুন"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        {/* WhatsApp */}
        <a
          href={shareWhatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-[#25D366]/10 hover:bg-[#25D366] text-[#25D366] hover:text-white flex items-center justify-center transition-colors"
          title="হোয়াটসঅ্যাপে শেয়ার করুন"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
          </svg>
        </a>

        {/* Twitter/X */}
        <a
          href={shareTwitter}
          target="_blank"
          rel="noopener noreferrer"
          className="w-8 h-8 rounded-full bg-slate-100 hover:bg-black text-black hover:text-white flex items-center justify-center transition-colors"
          title="এক্সে শেয়ার করুন"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[var(--color-brand-primary)] hover:text-white text-gray-700 flex items-center justify-center transition-colors cursor-pointer"
          title="লিংক কপি করুন"
        >
          {copied ? (
            <span className="text-[10px] font-bold">✓</span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
