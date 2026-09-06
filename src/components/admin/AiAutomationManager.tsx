'use client'

import { useState } from 'react'
import type {
  AiProvider,
  AiApiKeyLabel,
  AiModel,
  AiRole,
  AiRoleModel,
  AiRuleConfig,
  AiJob,
  AiPipelineLog,
} from '@/types/ai'
import { toBengaliNumber } from '@/lib/utils'

interface Props {
  initialJobs: AiJob[]
  initialRoles: AiRole[]
  initialProviders: AiProvider[]
  initialKeys: Array<AiApiKeyLabel & { isSetInEnv: boolean }>
  initialModels: AiModel[]
  initialRoleModels: AiRoleModel[]
  initialRuleConfig: AiRuleConfig
  initialLogs: AiPipelineLog[]
}

type TabType = 'jobs' | 'roles' | 'models' | 'providers' | 'rules' | 'logs'

export default function AiAutomationManager({
  initialJobs,
  initialRoles,
  initialProviders,
  initialKeys,
  initialModels,
  initialRoleModels,
  initialRuleConfig,
  initialLogs,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('jobs')
  const [jobs, setJobs] = useState<AiJob[]>(initialJobs)
  const [roles, setRoles] = useState<AiRole[]>(initialRoles)
  const [providers] = useState<AiProvider[]>(initialProviders)
  const [keys] = useState<Array<AiApiKeyLabel & { isSetInEnv: boolean }>>(initialKeys)
  const [models] = useState<AiModel[]>(initialModels)
  const [roleModels] = useState<AiRoleModel[]>(initialRoleModels)
  const [ruleConfig, setRuleConfig] = useState<AiRuleConfig>(initialRuleConfig)
  const [logs] = useState<AiPipelineLog[]>(initialLogs)

  // Feedback & Loading State
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedJob, setSelectedJob] = useState<AiJob | null>(null)
  const [filterJobStatus, setFilterJobStatus] = useState<string>('all')

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  // ── Actions ──────────────────────────────────────────────────────────────

  // 1. Run Ingestion Now
  const handleTriggerIngest = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ingest', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showMsg(`ইনজেশন সফল: ${data.summary?.totalIngested || 0}টি প্রকাশিত, ${data.summary?.totalSkipped || 0}টি এড়িয়ে গেছে।`)
        // Refresh jobs
        const jobsRes = await fetch('/api/admin/ai/jobs?limit=30')
        if (jobsRes.ok) {
          const jData = await jobsRes.json()
          if (jData.jobs) setJobs(jData.jobs)
        }
      } else {
        showMsg(data.error || 'ইনজেশন ব্যর্থ হয়েছে', 'error')
      }
    } catch {
      showMsg('সার্ভারের সাথে সংযোগ ব্যর্থ হয়েছে', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 2. Approve Held Job
  const handleApproveJob = async (jobId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/jobs/${jobId}/approve`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showMsg(data.message || 'সংবাদ প্রকাশিত হয়েছে!')
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'published', holdReason: undefined } : j)))
        if (selectedJob?.id === jobId) setSelectedJob(null)
      } else {
        showMsg(data.error || 'অনুমোদন ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 3. Reject Job
  const handleRejectJob = async (jobId: string) => {
    const reason = prompt('বাতিল করার কারণ লিখুন (ঐচ্ছিক):')
    if (reason === null) return

    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/jobs/${jobId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg(data.message || 'জব বাতিল করা হয়েছে')
        setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'rejected', rejectReason: reason } : j)))
        if (selectedJob?.id === jobId) setSelectedJob(null)
      } else {
        showMsg(data.error || 'বাতিল ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 4. Update Role Min Score or Active
  const handleUpdateRole = async (id: string, updates: Partial<AiRole>) => {
    try {
      const res = await fetch(`/api/admin/ai/roles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        setRoles((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)))
        showMsg('রোল সেটিংস সংরক্ষিত হয়েছে।')
      } else {
        showMsg('রোল আপডেট ব্যর্থ হয়েছে', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    }
  }

  // 5. Save Rule Config
  const handleSaveRuleConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai/rule-config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleConfig),
      })
      const data = await res.json()
      if (res.ok) {
        setRuleConfig(data.config)
        showMsg('রুল ইঞ্জিনের থ্রেশহোল্ড সংরক্ষিত হয়েছে!')
      } else {
        showMsg(data.error || 'সংরক্ষণ ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filtered jobs
  const filteredJobs = jobs.filter((j) => (filterJobStatus === 'all' ? true : j.status === filterJobStatus))

  return (
    <div className="space-y-6 font-bengali">
      {/* ── Top Header Banner ──────────────────────────────────────────────── */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight">AI নিউজ অটোমেশন ইঞ্জিন</h1>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-mono font-medium">
              Phase 10 Active
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-2xl">
            ৬-স্তরের স্বায়ত্তশাসিত পাইপলাইন: সংগ্রাহক → লেখক → তথ্য যাচাইকারী → ছবি যাচাইকারী → SEO বিশেষজ্ঞ → ডুপ্লিকেট চেকার → রুল ইঞ্জিন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerIngest}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all transform active:scale-95"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span>প্রসেসিং হচ্ছে...</span>
            </>
          ) : (
            <>
              <span>⚡</span>
              <span>এখনই ইনজেশন চালান</span>
            </>
          )}
        </button>
      </div>

      {/* ── Notification Feedback ─────────────────────────────────────────── */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border transition-all ${
            message.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : 'bg-red-950/60 border-red-800 text-red-300'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-700/60 overflow-x-auto gap-2 pb-1">
        {[
          { id: 'jobs', label: '📊 পাইপলাইন জবস', count: jobs.length },
          { id: 'roles', label: '🎭 AI ভূমিকা (Roles)', count: roles.length },
          { id: 'models', label: '🧠 মডেল রাউটিং ও ফলব্যাক', count: roleModels.length },
          { id: 'providers', label: '🔑 প্রোভাইডার ও সিক্রেট কি', count: providers.length },
          { id: 'rules', label: '⚙️ রুল ইঞ্জিন সেটিংস' },
          { id: 'logs', label: '📜 অডিট লগস', count: logs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'border-red-500 text-white bg-slate-800/80 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-mono">
                {toBengaliNumber(tab.count)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB 1: PIPELINE JOBS ───────────────────────────────────────────── */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {/* Status Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'সকল' },
                { key: 'published', label: 'প্রকাশিত' },
                { key: 'held', label: 'বিচারাধীন (Held)' },
                { key: 'rejected', label: 'বাতিলকৃত' },
                { key: 'failed', label: 'ব্যর্থ' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterJobStatus(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    filterJobStatus === f.key
                      ? 'bg-red-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-400">
              মোট: <span className="font-mono text-white">{toBengaliNumber(filteredJobs.length)}</span> টি জব
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <div className="bg-slate-900 p-12 text-center rounded-2xl border border-slate-800 text-slate-400 text-sm">
              কোনো পাইপলাইন জব পাওয়া যায়নি। &ldquo;এখনই ইনজেশন চালান&rdquo; বাটনে ক্লিক করে সংবাদ প্রসেস করুন।
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                          job.status === 'published'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : job.status === 'held'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : job.status === 'rejected'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-slate-400 truncate max-w-xs font-mono">{job.sourceUrl}</span>
                    </div>

                    <h3 className="text-base font-semibold text-white truncate">
                      {job.writerResult?.headline || job.rawTitle || 'শিরোনামহীন সংবাদ'}
                    </h3>

                    {/* Scores preview */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
                      {job.factCheckerResult && (
                        <span>
                          তথ্য যাচাই:{' '}
                          <strong
                            className={job.factCheckerResult.score >= 90 ? 'text-emerald-400' : 'text-amber-400'}
                          >
                            {toBengaliNumber(job.factCheckerResult.score)}%
                          </strong>
                        </span>
                      )}
                      {job.seoReviewerResult && (
                        <span>
                          SEO:{' '}
                          <strong
                            className={job.seoReviewerResult.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}
                          >
                            {toBengaliNumber(job.seoReviewerResult.score)}%
                          </strong>
                        </span>
                      )}
                      {job.holdReason && (
                        <span className="text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded">
                          কারণ: {job.holdReason}
                        </span>
                      )}
                      {job.rejectReason && (
                        <span className="text-red-400 bg-red-950/40 px-2 py-0.5 rounded">
                          বাতিল: {job.rejectReason}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedJob(job)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                    >
                      বিস্তারিত দেখুন
                    </button>

                    {job.status === 'held' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveJob(job.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shadow-xs transition-colors"
                        >
                          অনুমোদন ও প্রকাশ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectJob(job.id)}
                          className="bg-red-600/80 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                        >
                          বাতিল
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Job Details Modal */}
          {selectedJob && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-lg font-bold text-white">জব বিস্তারিত স্কোরকার্ড</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-400 block">মূল শিরোনাম</label>
                    <p className="text-white font-medium">{selectedJob.writerResult?.headline || selectedJob.rawTitle}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block">সোর্স লিংক</label>
                    <a
                      href={selectedJob.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:underline text-xs break-all"
                    >
                      {selectedJob.sourceUrl}
                    </a>
                  </div>

                  {selectedJob.writerResult && (
                    <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 space-y-2">
                      <div className="text-xs font-semibold text-slate-300">সংবাদ সারাংশ</div>
                      <p className="text-slate-200 text-xs">{selectedJob.writerResult.summary}</p>
                    </div>
                  )}

                  {/* 6 Role Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">তথ্য যাচাই</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {toBengaliNumber(selectedJob.factCheckerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-400">{selectedJob.factCheckerResult?.decision || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">SEO স্কোর</div>
                      <div className="text-lg font-bold text-blue-400">
                        {toBengaliNumber(selectedJob.seoReviewerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-400">{selectedJob.seoReviewerResult?.decision || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-xs text-slate-400">ছবি যাচাই</div>
                      <div className="text-lg font-bold text-amber-400">
                        {toBengaliNumber(selectedJob.imageReviewerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-400">{selectedJob.imageReviewerResult?.decision || 'N/A'}</div>
                    </div>
                  </div>

                  {selectedJob.ruleEngineResult && (
                    <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 space-y-1">
                      <div className="text-xs font-semibold text-slate-300">রুল ইঞ্জিন সিদ্ধান্ত:</div>
                      <div className="font-mono text-sm font-bold text-white">{selectedJob.ruleEngineResult.decision}</div>
                      <ul className="text-xs text-slate-400 list-disc list-inside space-y-0.5">
                        {selectedJob.ruleEngineResult.reasons?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  {selectedJob.status === 'held' && (
                    <button
                      type="button"
                      onClick={() => handleApproveJob(selectedJob.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-4 py-2 rounded-lg font-medium"
                    >
                      অনুমোদন ও প্রকাশ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ROLES ───────────────────────────────────────────────────── */}
      {activeTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{role.displayName}</h3>
                  <span className="text-xs font-mono text-slate-400">{role.roleName}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.isActive}
                    onChange={(e) => handleUpdateRole(role.id, { isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-400">{role.description}</p>

              {/* Min Score slider (for roles that have scoring) */}
              {role.minimumScore > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">পাসিং স্কোর থ্রেশহোল্ড:</span>
                    <span className="font-mono font-bold text-white">{toBengaliNumber(role.minimumScore)}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={role.minimumScore}
                    onChange={(e) => handleUpdateRole(role.id, { minimumScore: Number(e.target.value) })}
                    className="w-full accent-red-600"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: MODEL ROUTING & FALLBACK ─────────────────────────────────── */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400">
            💡 প্রতিটি রোলের জন্য প্রাইমারি মডেল এবং ব্যাকআপ মডেল অগ্রাধিকার অনুসারে সাজানো থাকে (মোট মডেল: {toBengaliNumber(models.length)}টি)। প্রথম মডেল ব্যর্থ হলে বা রেট-লিমিট খেলে স্বয়ংক্রিয়ভাবে দ্বিতীয় মডেলে ফলব্যাক করা হয়।
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase font-mono">
                <tr>
                  <th className="p-3.5">রোল</th>
                  <th className="p-3.5">মডেল</th>
                  <th className="p-3.5">প্রোভাইডার</th>
                  <th className="p-3.5">অগ্রাধিকার</th>
                  <th className="p-3.5">টাইমআউট</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {roleModels.map((rm) => (
                  <tr key={rm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-white">{rm.roleId.replace('role-', '')}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-200">{rm.modelName || rm.modelId}</td>
                    <td className="p-3.5 text-xs text-slate-400">{rm.providerDisplayName || 'N/A'}</td>
                    <td className="p-3.5">
                      <span className="bg-slate-800 px-2 py-0.5 rounded text-xs font-mono font-semibold text-white">
                        {rm.priority === 1 ? 'Primary (১)' : `Fallback (${rm.priority})`}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs">{toBengaliNumber(rm.timeoutMs / 1000)}s</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          rm.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {rm.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: PROVIDERS & SECRETS ─────────────────────────────────────── */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Key security notice */}
          <div className="bg-blue-950/40 border border-blue-800/60 p-4 rounded-xl text-xs text-blue-300">
            🔒 <strong>নিরাপত্তা নিশ্চয়তা:</strong> API কী কখনোই ডেটাবেজে সংরক্ষিত হয় না। ডেটাবেজে কেবল লেবেল (যেমন: GROQ_API_KEY) থাকে। মূল সিক্রেট ক্লাউডফ্লেয়ার সিক্রেটস বা .env.local থেকে রিড করা হয়।
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((prov) => {
              const provKeys = keys.filter((k) => k.providerId === prov.id)
              return (
                <div key={prov.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white">{prov.displayName}</h3>
                      <span className="text-xs font-mono text-slate-400">{prov.providerName}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${
                        prov.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                      }`}
                    >
                      {prov.isActive ? 'সক্রিয়' : 'বন্ধ'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-400 font-mono break-all">{prov.baseUrl}</div>

                  {/* Keys attached */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="text-xs text-slate-400 font-medium">কনফিগার করা API কি:</div>
                    {provKeys.length === 0 ? (
                      <div className="text-xs text-slate-500 italic">কোনো কী লেবেল নেই</div>
                    ) : (
                      provKeys.map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded-lg border border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-mono text-white font-medium">{k.label}</span>
                            <span className="text-slate-400 text-[11px] block">{k.displayLabel}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.isSetInEnv
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {k.isSetInEnv ? '✓ Env পাওয়া গেছে' : '⚠ Env নেই'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TAB 5: RULE ENGINE CONFIG ──────────────────────────────────────── */}
      {activeTab === 'rules' && (
        <form onSubmit={handleSaveRuleConfig} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="text-lg font-bold text-white">রুল ইঞ্জিন স্বায়ত্তশাসন সেটিংস</h3>
            <p className="text-xs text-slate-400">
              সকল রোল পাস করার পর রুল ইঞ্জিন সিদ্ধান্ত নেয় সংবাদটি সরাসরি প্রকাশিত হবে নাকি এডিটরের পর্যালোচনার জন্য বিচারাধীন থাকবে।
            </p>
          </div>

          <div className="space-y-4">
            {/* Auto Publish Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800">
              <div>
                <div className="text-sm font-semibold text-white">স্বয়ংক্রিয় প্রকাশ (Auto-Publish)</div>
                <div className="text-xs text-slate-400">শর্ত পূরণ হলে মানবীয় অনুমোদন ছাড়াই সরাসরি প্রকাশ পাবে</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleConfig.autoPublish}
                  onChange={(e) => setRuleConfig({ ...ruleConfig, autoPublish: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Fact Checker Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">তথ্য যাচাই সর্বনিম্ন পাস স্কোর:</span>
                <span className="font-mono font-bold text-white">{toBengaliNumber(ruleConfig.factCheckerMin)}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={ruleConfig.factCheckerMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, factCheckerMin: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* SEO Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">SEO সর্বনিম্ন পাস স্কোর:</span>
                <span className="font-mono font-bold text-white">{toBengaliNumber(ruleConfig.seoMin)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={ruleConfig.seoMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, seoMin: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Image Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">ছবি সর্বনিম্ন প্রাসঙ্গিকতা স্কোর:</span>
                <span className="font-mono font-bold text-white">{toBengaliNumber(ruleConfig.imageMin)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={ruleConfig.imageMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, imageMin: Number(e.target.value) })}
                className="w-full accent-red-600"
              />
            </div>

            {/* Image Optional Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-slate-800">
              <div>
                <div className="text-sm font-semibold text-white">ছবি ঐচ্ছিক (Image Optional)</div>
                <div className="text-xs text-slate-400">ছবি না থাকলেও সংবাদ প্রকাশ করা যাবে</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleConfig.imageOptional}
                  onChange={(e) => setRuleConfig({ ...ruleConfig, imageOptional: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors shadow-lg"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      {/* ── TAB 6: LOGS ────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">কোনো এক্সিকিউশন লগ পাওয়া যায়নি।</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs text-slate-400 uppercase font-mono">
                <tr>
                  <th className="p-3.5">রোল</th>
                  <th className="p-3.5">মডেল</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5">স্কোর</th>
                  <th className="p-3.5">ল্যাটেন্সি</th>
                  <th className="p-3.5">টোকেন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-medium text-white">{log.role}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-400">{log.model || 'N/A'}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          log.status === 'success'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'failed'
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs">
                      {log.score !== undefined ? `${toBengaliNumber(log.score)}%` : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-400">
                      {log.latencyMs ? `${toBengaliNumber(log.latencyMs)}ms` : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-400">
                      {log.promptTokens || log.completionTokens
                        ? `${toBengaliNumber((log.promptTokens || 0) + (log.completionTokens || 0))}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
