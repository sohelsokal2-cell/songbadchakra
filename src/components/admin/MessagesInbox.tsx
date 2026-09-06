'use client'

import React, { useState } from 'react'
import { ContactMessage } from '@/types/news'
import { formatDateBengali, toBengaliNumber } from '@/lib/utils'

interface MessagesInboxProps {
  initialMessages: ContactMessage[]
}

export default function MessagesInbox({ initialMessages }: MessagesInboxProps) {
  const [messages, setMessages] = useState<ContactMessage[]>(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    initialMessages[0] || null
  )
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  const unreadCount = messages.filter((m) => !m.read).length

  const filteredMessages = messages.filter((m) => {
    if (filter === 'unread') return !m.read
    if (filter === 'read') return m.read
    return true
  })

  // Mark message as read
  const handleMarkRead = async (id: string, readStatus: boolean) => {
    setLoadingId(id)
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, read: readStatus }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setMessages((prev) =>
          prev.map((m) => (m.id === id ? { ...m, read: readStatus } : m))
        )
        if (selectedMessage?.id === id) {
          setSelectedMessage((prev) => (prev ? { ...prev, read: readStatus } : null))
        }
      }
    } catch {
      alert('স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে')
    } finally {
      setLoadingId(null)
    }
  }

  // Delete message
  const handleDelete = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই বার্তাটি মুছে ফেলতে চান?')) return

    setLoadingId(id)
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const remaining = messages.filter((m) => m.id !== id)
        setMessages(remaining)
        if (selectedMessage?.id === id) {
          setSelectedMessage(remaining[0] || null)
        }
      } else {
        alert(data.error || 'বার্তা ডিলিট ব্যর্থ হয়েছে')
      }
    } catch {
      alert('সার্ভার যোগাযোগ ত্রুটি')
    } finally {
      setLoadingId(null)
    }
  }

  const selectAndMarkRead = (msg: ContactMessage) => {
    setSelectedMessage(msg)
    if (!msg.read) {
      handleMarkRead(msg.id, true)
    }
  }

  return (
    <div className="space-y-6 font-bengali">
      {/* ── Filter Bar ────────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সকল বার্তা ({toBengaliNumber(messages.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'unread'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            অপঠিত ({toBengaliNumber(unreadCount)})
          </button>
          <button
            type="button"
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              filter === 'read'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            পঠিত ({toBengaliNumber(messages.length - unreadCount)})
          </button>
        </div>

        <span className="text-xs text-slate-400">
          সর্বমোট বার্তা: {toBengaliNumber(filteredMessages.length)} টি
        </span>
      </div>

      {/* ── Two-pane Inbox layout ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden min-h-[560px]">
        {/* Messages List (5 cols) */}
        <div className="lg:col-span-5 border-r border-slate-100 divide-y divide-slate-100 overflow-y-auto max-h-[640px]">
          {filteredMessages.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              কোনো বার্তা পাওয়া যায়নি।
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id
              return (
                <div
                  key={msg.id}
                  onClick={() => selectAndMarkRead(msg)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-red-50/70 border-l-4 border-red-600'
                      : !msg.read
                      ? 'bg-amber-50/30 hover:bg-slate-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${!msg.read ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateBengali(msg.createdAt)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-1">
                    {!msg.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                    <h4 className={`text-xs truncate ${!msg.read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>
                      {msg.subject}
                    </h4>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {msg.message}
                  </p>
                </div>
              )
            })
          )}
        </div>

        {/* Selected Message Detail (7 cols) */}
        <div className="lg:col-span-7 p-6 flex flex-col justify-between">
          {selectedMessage ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-slate-800">
                    {selectedMessage.subject}
                  </h3>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMarkRead(selectedMessage.id, !selectedMessage.read)}
                      disabled={loadingId === selectedMessage.id}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {selectedMessage.read ? 'অপঠিত হিসেবে চিহ্নিত' : 'পঠিত চিহ্নিত'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selectedMessage.id)}
                      disabled={loadingId === selectedMessage.id}
                      className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                    >
                      মুছুন
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div>
                    প্রেরক: <strong className="text-slate-800">{selectedMessage.name}</strong>
                  </div>
                  <div>
                    ইমেইল:{' '}
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-red-600 hover:underline"
                    >
                      {selectedMessage.email}
                    </a>
                  </div>
                  <div>
                    তারিখ: <span>{formatDateBengali(selectedMessage.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Message Body */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>

              {/* Reply Link */}
              <div className="pt-4 border-t border-slate-100">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(selectedMessage.subject)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <span>✉️</span>
                  <span>ইমেইলে উত্তর দিন</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              বার্তা বিস্তারিত দেখতে তালিকা থেকে নির্বাচন করুন।
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
