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
  const [models, setModels] = useState<AiModel[]>(initialModels)
  const [roleModels, setRoleModels] = useState<AiRoleModel[]>(initialRoleModels)
  const [ruleConfig, setRuleConfig] = useState<AiRuleConfig>(initialRuleConfig)
  const [logs] = useState<AiPipelineLog[]>(initialLogs)

  // Model & Routing Management states
  const [isAddModelOpen, setIsAddModelOpen] = useState(false)
  const [newModel, setNewModel] = useState({
    providerId: initialProviders[0]?.id || '',
    modelName: '',
    displayName: '',
    contextLength: 128000,
  })
  const [editingModelId, setEditingModelId] = useState<string | null>(null)
  const [editModelFields, setEditModelFields] = useState<{ modelName: string; displayName: string }>({
    modelName: '',
    displayName: '',
  })
  const [addingFallbackRoleId, setAddingFallbackRoleId] = useState<string | null>(null)
  const [selectedFallbackModelId, setSelectedFallbackModelId] = useState<string>('')

  // Feedback & Loading State
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [selectedJob, setSelectedJob] = useState<AiJob | null>(null)
  const [filterJobStatus, setFilterJobStatus] = useState<string>('all')

  const showMsg = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 5000)
  }

  // ── Model & Fallback Handlers ──────────────────────────────────────────────
  const handleUpdateRoleModel = async (id: string, updates: Partial<AiRoleModel>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/role-models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('মডেল রাউটিং সফলভাবে সংরক্ষিত হয়েছে!')
        setRoleModels((prev) =>
          prev.map((rm) => {
            if (rm.id !== id) return rm
            const updatedModel = updates.modelId ? models.find((m) => m.id === updates.modelId) : null
            return {
              ...rm,
              ...updates,
              ...(updatedModel
                ? {
                    modelName: updatedModel.modelName,
                    modelDisplayName: updatedModel.displayName,
                  }
                : {}),
            }
          })
        )
      } else {
        showMsg(data.error || 'আপডেট ব্যর্থ হয়েছে', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoleModel = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত এই মডেল অ্যাসাইনমেন্টটি মুছে ফেলতে চান?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/role-models/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showMsg('মডেল অ্যাসাইনমেন্ট মুছে ফেলা হয়েছে')
        setRoleModels((prev) => prev.filter((rm) => rm.id !== id))
      } else {
        const data = await res.json()
        showMsg(data.error || 'মুছে ফেলতে ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddRoleModel = async (roleId: string, modelId: string) => {
    if (!modelId) {
      showMsg('অনুগ্রহ করে একটি মডেল নির্বাচন করুন', 'error')
      return
    }
    setLoading(true)
    try {
      const roleAssigned = roleModels.filter((rm) => rm.roleId === roleId)
      const nextPriority = roleAssigned.length > 0 ? Math.max(...roleAssigned.map((r) => r.priority)) + 1 : 1
      const selectedM = models.find((m) => m.id === modelId)
      const provKey = keys.find((k) => k.providerId === selectedM?.providerId)

      const res = await fetch('/api/admin/ai/role-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId,
          modelId,
          apiKeyLabelId: provKey?.id,
          priority: nextPriority,
          maxRetries: 2,
          timeoutMs: 35000,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('নতুন ফলব্যাক মডেল সফলভাবে যুক্ত হয়েছে!')
        setAddingFallbackRoleId(null)
        setSelectedFallbackModelId('')
        const refreshRes = await fetch('/api/admin/ai/role-models')
        if (refreshRes.ok) {
          const rData = await refreshRes.json()
          if (rData.roleModels) setRoleModels(rData.roleModels)
        }
      } else {
        showMsg(data.error || 'যোগ করতে ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateModel = async (id: string, updates: Partial<AiModel>) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (res.ok) {
        showMsg('AI মডেল ক্যাটালগ সফলভাবে আপডেট হয়েছে!')
        setModels((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
        setEditingModelId(null)
        if (updates.modelName || updates.displayName) {
          setRoleModels((prev) =>
            prev.map((rm) =>
              rm.modelId === id
                ? {
                    ...rm,
                    modelName: updates.modelName ?? rm.modelName,
                    modelDisplayName: updates.displayName ?? rm.modelDisplayName,
                  }
                : rm
            )
          )
        }
      } else {
        showMsg(data.error || 'আপডেট ব্যর্থ হয়েছে', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newModel.providerId || !newModel.modelName.trim() || !newModel.displayName.trim()) {
      showMsg('সবগুলো প্রয়োজনীয় ফিল্ড পূরণ করুন', 'error')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel),
      })
      const data = await res.json()
      if (res.ok && data.model) {
        showMsg('নতুন AI মডেল ক্যাটালগে যুক্ত হয়েছে!')
        setModels((prev) => [...prev, data.model])
        setIsAddModelOpen(false)
        setNewModel({
          providerId: providers[0]?.id || '',
          modelName: '',
          displayName: '',
          contextLength: 128000,
        })
      } else {
        showMsg(data.error || 'মডেল যুক্ত করতে ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteModel = async (id: string) => {
    if (!confirm('আপনি কি নিশ্চিত এই মডেলটি ক্যাটালগ থেকে মুছে ফেলতে চান?')) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/models/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showMsg('মডেল ক্যাটালগ থেকে সরানো হয়েছে')
        setModels((prev) => prev.filter((m) => m.id !== id))
        setRoleModels((prev) => prev.filter((rm) => rm.modelId !== id))
      } else {
        const data = await res.json()
        showMsg(data.error || 'মুছতে ব্যর্থ', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
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

  // 3b. Requeue a failed / retrying / dead-lettered job
  const handleRequeueJob = async (jobId: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/ai/jobs/${jobId}/requeue`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        showMsg(data.message || 'জবটি পুনরায় চালুর জন্য সারিতে রাখা হয়েছে')
        // Refresh the job list from the server
        const jobsRes = await fetch('/api/admin/ai/jobs?limit=20')
        if (jobsRes.ok) {
          const jData = await jobsRes.json()
          if (jData.jobs) setJobs(jData.jobs)
        }
        if (selectedJob?.id === jobId) setSelectedJob(null)
      } else {
        showMsg(data.error || 'রিকিউ ব্যর্থ হয়েছে', 'error')
      }
    } catch {
      showMsg('নেটওয়ার্ক ত্রুটি', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 3c. Run the recovery / retry / dead-letter cycle manually
  const handleRecoverJobs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai/jobs/recover', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        const r = data.recovery || {}
        showMsg(
          `রিকভারি সম্পন্ন: আটকে থাকা ${toBengaliNumber(r.recoveredStale || 0)}টি, রিকিউ ${toBengaliNumber(r.requeuedFailed || 0)}টি, ডেড-লেটার ${toBengaliNumber(r.deadLettered || 0)}টি`
        )
        // Refresh the job list from the server
        const jobsRes = await fetch('/api/admin/ai/jobs?limit=20')
        if (jobsRes.ok) {
          const jData = await jobsRes.json()
          if (jData.jobs) setJobs(jData.jobs)
        }
      } else {
        showMsg(data.error || 'রিকভারি ব্যর্থ হয়েছে', 'error')
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
      <div className="bg-[#121D34] text-white p-6 rounded-2xl border border-slate-700/60 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-bold tracking-tight !text-white" style={{ color: '#ffffff' }}>
              AI নিউজ অটোমেশন ইঞ্জিন
            </h1>
            <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full border border-emerald-500/40 font-mono font-semibold">
              Phase 10 Active
            </span>
          </div>
          <p className="text-slate-200 text-sm max-w-2xl leading-relaxed">
            ৬-স্তরের স্বায়ত্তশাসিত পাইপলাইন: সংগ্রাহক → লেখক → তথ্য যাচাইকারী → ছবি যাচাইকারী → SEO বিশেষজ্ঞ → ডুপ্লিকেট চেকার → রুল ইঞ্জিন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleTriggerIngest}
          disabled={loading}
          className="bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg transition-all transform active:scale-95 shrink-0 cursor-pointer"
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
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* ── Navigation Tabs ────────────────────────────────────────────────── */}
      <div className="flex border border-slate-200 overflow-x-auto gap-2 p-2 rounded-xl bg-white shadow-xs">
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
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium ${
                  activeTab === tab.id ? 'bg-red-700/60 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
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
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'সকল' },
                { key: 'published', label: 'প্রকাশিত' },
                { key: 'held', label: 'বিচারাধীন (Held)' },
                { key: 'queued', label: 'সারিতে (Queued)' },
                { key: 'retrying', label: 'পুনরায় চেষ্টা (Retry)' },
                { key: 'rejected', label: 'বাতিলকৃত' },
                { key: 'failed', label: 'ব্যর্থ' },
                { key: 'dead_letter', label: 'ডেড-লেটার (DLQ)' },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilterJobStatus(f.key)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    filterJobStatus === f.key
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-slate-600 font-medium">
                মোট: <span className="font-mono text-slate-900 font-bold">{toBengaliNumber(filteredJobs.length)}</span> টি জব
              </div>
              <button
                type="button"
                onClick={handleRecoverJobs}
                disabled={loading}
                title="আটকে থাকা জব রিকভার, ব্যর্থ জব পুনরায় চালু এবং ডেড-লেটার প্রসেস করুন"
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
              >
                ♻️ স্টক জব রিকভার
              </button>
            </div>
          </div>

          {/* Jobs List */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-600 text-sm shadow-xs space-y-2">
              <div className="text-3xl">📭</div>
              <p className="font-medium text-slate-800">কোনো পাইপলাইন জব পাওয়া যায়নি।</p>
              <p className="text-xs text-slate-500">&ldquo;এখনই ইনজেশন চালান&rdquo; বাটনে ক্লিক করে সংবাদ প্রসেস করুন।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white border border-slate-200 rounded-xl p-4.5 hover:border-slate-300 hover:shadow-xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs font-mono uppercase px-2.5 py-0.5 rounded font-bold ${
                          job.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : job.status === 'held'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : job.status === 'queued'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : job.status === 'retrying'
                            ? 'bg-violet-50 text-violet-700 border border-violet-200'
                            : job.status === 'dead_letter'
                            ? 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                            : job.status === 'rejected'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-slate-500 truncate max-w-xs font-mono">{job.sourceUrl}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 truncate">
                      {job.writerResult?.headline || job.rawTitle || 'শিরোনামহীন সংবাদ'}
                    </h3>

                    {/* Scores preview */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-1">
                      {job.factCheckerResult && (
                        <span>
                          তথ্য যাচাই:{' '}
                          <strong
                            className={job.factCheckerResult.score >= 90 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}
                          >
                            {toBengaliNumber(job.factCheckerResult.score)}%
                          </strong>
                        </span>
                      )}
                      {job.seoReviewerResult && (
                        <span>
                          SEO:{' '}
                          <strong
                            className={job.seoReviewerResult.score >= 80 ? 'text-blue-700 font-bold' : 'text-amber-700 font-bold'}
                          >
                            {toBengaliNumber(job.seoReviewerResult.score)}%
                          </strong>
                        </span>
                      )}
                      {job.holdReason && (
                        <span className="text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px] font-medium">
                          কারণ: {job.holdReason}
                        </span>
                      )}
                      {job.rejectReason && (
                        <span className="text-red-900 bg-red-50 border border-red-200 px-2 py-0.5 rounded text-[11px] font-medium">
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
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      বিস্তারিত দেখুন
                    </button>

                    {job.status === 'held' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveJob(job.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          অনুমোদন ও প্রকাশ
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectJob(job.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          বাতিল
                        </button>
                      </>
                    )}

                    {(job.status === 'failed' ||
                      job.status === 'retrying' ||
                      job.status === 'dead_letter') && (
                      <button
                        type="button"
                        onClick={() => handleRequeueJob(job.id)}
                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer"
                      >
                        পুনরায় চেষ্টা
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Job Details Modal */}
          {selectedJob && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-lg font-bold text-slate-900">জব বিস্তারিত স্কোরকার্ড</h2>
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="text-slate-400 hover:text-slate-700 text-lg font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <label className="text-xs text-slate-500 font-medium block">মূল শিরোনাম</label>
                    <p className="text-slate-900 font-semibold">{selectedJob.writerResult?.headline || selectedJob.rawTitle}</p>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-medium block">সোর্স লিংক</label>
                    <a
                      href={selectedJob.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-xs break-all"
                    >
                      {selectedJob.sourceUrl}
                    </a>
                  </div>

                  {selectedJob.writerResult && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="text-xs font-semibold text-slate-700">সংবাদ সারাংশ</div>
                      <p className="text-slate-800 text-xs leading-relaxed">{selectedJob.writerResult.summary}</p>
                    </div>
                  )}

                  {/* 6 Role Scores Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500">তথ্য যাচাই</div>
                      <div className="text-lg font-bold text-emerald-600">
                        {toBengaliNumber(selectedJob.factCheckerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-600">{selectedJob.factCheckerResult?.decision || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500">SEO স্কোর</div>
                      <div className="text-lg font-bold text-blue-600">
                        {toBengaliNumber(selectedJob.seoReviewerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-600">{selectedJob.seoReviewerResult?.decision || 'N/A'}</div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500">ছবি যাচাই</div>
                      <div className="text-lg font-bold text-amber-600">
                        {toBengaliNumber(selectedJob.imageReviewerResult?.score ?? 0)}%
                      </div>
                      <div className="text-[11px] text-slate-600">{selectedJob.imageReviewerResult?.decision || 'N/A'}</div>
                    </div>
                  </div>

                  {selectedJob.ruleEngineResult && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                      <div className="text-xs font-semibold text-slate-700">রুল ইঞ্জিন সিদ্ধান্ত:</div>
                      <div className="font-mono text-sm font-bold text-slate-900">{selectedJob.ruleEngineResult.decision}</div>
                      <ul className="text-xs text-slate-600 list-disc list-inside space-y-0.5">
                        {selectedJob.ruleEngineResult.reasons?.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  {selectedJob.status === 'held' && (
                    <button
                      type="button"
                      onClick={() => handleApproveJob(selectedJob.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-4 py-2 rounded-lg font-semibold cursor-pointer"
                    >
                      অনুমোদন ও প্রকাশ
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedJob(null)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-4 py-2 rounded-lg font-medium cursor-pointer"
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
            <div key={role.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{role.displayName}</h3>
                  <span className="text-xs font-mono text-slate-500">{role.roleName}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={role.isActive}
                    onChange={(e) => handleUpdateRole(role.id, { isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{role.description}</p>

              {/* Min Score slider (for roles that have scoring) */}
              {role.minimumScore > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">পাসিং স্কোর থ্রেশহোল্ড:</span>
                    <span className="font-mono font-bold text-slate-900">{toBengaliNumber(role.minimumScore)}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={role.minimumScore}
                    onChange={(e) => handleUpdateRole(role.id, { minimumScore: Number(e.target.value) })}
                    className="w-full accent-red-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 3: MODEL ROUTING & FALLBACK ─────────────────────────────────── */}
      {activeTab === 'models' && (
        <div className="space-y-8">
          {/* Info Banner & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>🔀</span> AI মডেল রাউটিং ও ফলব্যাক ব্যবস্থাপনা
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                প্রতিটি রোলের জন্য প্রাইমারি ও ব্যাকআপ মডেল নির্ধারণ করুন। প্রাইমারি মডেল ব্যর্থ হলে বা রেট লিমিট থাকলে স্বয়ংক্রিয়ভাবে ব্যাকআপ মডেলে ফলব্যাক করা হবে।
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModelOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
            >
              <span>➕</span> নতুন AI মডেল যুক্ত করুন
            </button>
          </div>

          {/* Add Model Modal */}
          {isAddModelOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-900">নতুন AI মডেল কনফিগার করুন</h4>
                  <button
                    type="button"
                    onClick={() => setIsAddModelOpen(false)}
                    className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateModel} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">প্রোভাইডার নির্বাচন করুন</label>
                    <select
                      value={newModel.providerId}
                      onChange={(e) => setNewModel({ ...newModel, providerId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-medium focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                    >
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName} ({p.providerName})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      API মডেল আইডেন্টিফায়ার (যথাযথ মডেল কোড)
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: gemini-3.6-flash, qwen/qwen3.6-27b"
                      value={newModel.modelName}
                      onChange={(e) => setNewModel({ ...newModel, modelName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">ডিসপ্লে নাম</label>
                    <input
                      type="text"
                      placeholder="যেমন: Gemini 3.6 Flash"
                      value={newModel.displayName}
                      onChange={(e) => setNewModel({ ...newModel, displayName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">কনটেক্সট লেন্থ (টোকেন)</label>
                    <input
                      type="number"
                      placeholder="128000"
                      value={newModel.contextLength}
                      onChange={(e) => setNewModel({ ...newModel, contextLength: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono focus:ring-2 focus:ring-red-500/20 focus:border-red-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setIsAddModelOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer"
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors cursor-pointer"
                    >
                      {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* 1. Per-Role Model Routing Section */}
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">
              ১. রোল ভিত্তিক মডেল ও ফলব্যাক সেটিংস
            </h4>

            {roles.map((role) => {
              const assigned = roleModels
                .filter((rm) => rm.roleId === role.id)
                .sort((a, b) => a.priority - b.priority)

              return (
                <div
                  key={role.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center text-red-600 text-sm font-bold">
                        {role.roleName === 'writer'
                          ? '✍️'
                          : role.roleName === 'fact_checker'
                          ? '🔍'
                          : role.roleName === 'image_reviewer'
                          ? '🖼️'
                          : role.roleName === 'seo_reviewer'
                          ? '🚀'
                          : role.roleName === 'duplicate_checker'
                          ? '👥'
                          : '⚡'}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">{role.displayName}</h5>
                        <p className="text-xs text-slate-500">{role.description}</p>
                      </div>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-mono font-medium">
                      {toBengaliNumber(assigned.length)}টি মডেল সক্রিয়
                    </span>
                  </div>

                  {/* Assigned Models Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-700">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-mono border-b border-slate-200">
                        <tr>
                          <th className="p-3">অগ্রাধিকার (Priority)</th>
                          <th className="p-3">মডেল নির্বাচন (Model)</th>
                          <th className="p-3">টাইমআউট (Timeout)</th>
                          <th className="p-3">স্ট্যাটাস</th>
                          <th className="p-3 text-right">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {assigned.map((rm) => (
                          <tr key={rm.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <select
                                value={rm.priority}
                                onChange={(e) =>
                                  handleUpdateRoleModel(rm.id, { priority: Number(e.target.value) })
                                }
                                className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono font-semibold"
                              >
                                <option value={1}>Primary (১ম)</option>
                                <option value={2}>Fallback (২য়)</option>
                                <option value={3}>Fallback (৩য়)</option>
                                <option value={4}>Fallback (৪র্থ)</option>
                              </select>
                            </td>
                            <td className="p-3">
                              <select
                                value={rm.modelId}
                                onChange={(e) =>
                                  handleUpdateRoleModel(rm.id, { modelId: e.target.value })
                                }
                                className="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-slate-900 font-medium focus:ring-2 focus:ring-red-500/20 focus:outline-hidden max-w-xs"
                              >
                                {models.map((m) => {
                                  const p = providers.find((pr) => pr.id === m.providerId)
                                  return (
                                    <option key={m.id} value={m.id}>
                                      {m.displayName} ({p?.displayName || 'N/A'}) — {m.modelName}
                                    </option>
                                  )
                                })}
                              </select>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="5"
                                  max="120"
                                  defaultValue={Math.round(rm.timeoutMs / 1000)}
                                  onBlur={(e) => {
                                    const val = Number(e.target.value)
                                    if (val && val * 1000 !== rm.timeoutMs) {
                                      handleUpdateRoleModel(rm.id, { timeoutMs: val * 1000 })
                                    }
                                  }}
                                  className="w-16 bg-slate-50 border border-slate-300 rounded px-2 py-1 text-slate-900 font-mono text-center font-medium"
                                />
                                <span className="text-slate-500">সেকেন্ড</span>
                              </div>
                            </td>
                            <td className="p-3">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rm.isActive}
                                  onChange={(e) =>
                                    handleUpdateRoleModel(rm.id, { isActive: e.target.checked })
                                  }
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                              </label>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteRoleModel(rm.id)}
                                title="এই মডেল অ্যাসাইনমেন্ট মুছুন"
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Fallback Model Bar */}
                  {addingFallbackRoleId === role.id ? (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                      <span className="text-xs text-slate-700 font-medium shrink-0">নতুন মডেল নির্বাচন:</span>
                      <select
                        value={selectedFallbackModelId}
                        onChange={(e) => setSelectedFallbackModelId(e.target.value)}
                        className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 flex-1"
                      >
                        <option value="">মডেল নির্বাচন করুন...</option>
                        {models.map((m) => {
                          const p = providers.find((pr) => pr.id === m.providerId)
                          return (
                            <option key={m.id} value={m.id}>
                              {m.displayName} ({p?.displayName || 'N/A'}) — {m.modelName}
                            </option>
                          )
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddRoleModel(role.id, selectedFallbackModelId)}
                        disabled={!selectedFallbackModelId || loading}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        যুক্ত করুন
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingFallbackRoleId(null)
                          setSelectedFallbackModelId('')
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs rounded-lg cursor-pointer"
                      >
                        বাতিল
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingFallbackRoleId(role.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium py-1 px-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <span>➕</span> এই রোলে নতুন ব্যাকআপ / ফলব্যাক মডেল যোগ করুন
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* 2. AI Models Catalog Section */}
          <div className="space-y-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-mono">
                  ২. AI মডেল ক্যাটালগ ও প্রোভাইডার কনফিগারেশন ({toBengaliNumber(models.length)}টি)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  যে কোনো মডেলের নাম বা API কোড সরাসরি পরিবর্তন করতে পারবেন।
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 uppercase font-mono border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">প্রোভাইডার</th>
                    <th className="p-3.5">ডিসপ্লে নাম</th>
                    <th className="p-3.5">API মডেল কোড (আইডেন্টিফায়ার)</th>
                    <th className="p-3.5">স্ট্যাটাস</th>
                    <th className="p-3.5 text-right">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {models.map((m) => {
                    const p = providers.find((pr) => pr.id === m.providerId)
                    const isEditing = editingModelId === m.id

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded font-medium text-xs">
                            {p?.displayName || m.providerId}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editModelFields.displayName}
                              onChange={(e) =>
                                setEditModelFields({ ...editModelFields, displayName: e.target.value })
                              }
                              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-slate-900 font-medium"
                            />
                          ) : (
                            <span className="font-bold text-slate-900">{m.displayName}</span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editModelFields.modelName}
                              onChange={(e) =>
                                setEditModelFields({ ...editModelFields, modelName: e.target.value })
                              }
                              className="bg-white border border-slate-300 rounded px-2.5 py-1 text-emerald-700 font-mono"
                            />
                          ) : (
                            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {m.modelName}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={m.isActive}
                              onChange={(e) =>
                                handleUpdateModel(m.id, { isActive: e.target.checked })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </td>
                        <td className="p-3.5 text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateModel(m.id, {
                                    displayName: editModelFields.displayName,
                                    modelName: editModelFields.modelName,
                                  })
                                }
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded transition-colors cursor-pointer"
                              >
                                সংরক্ষণ
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingModelId(null)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors cursor-pointer"
                              >
                                বাতিল
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingModelId(m.id)
                                  setEditModelFields({
                                    displayName: m.displayName,
                                    modelName: m.modelName,
                                  })
                                }}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded transition-colors cursor-pointer"
                              >
                                ✏️ এডিট
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteModel(m.id)}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors cursor-pointer"
                                title="মডেল মুছুন"
                              >
                                🗑️
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: PROVIDERS & SECRETS ─────────────────────────────────────── */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* Key security notice */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900">
            🔒 <strong>নিরাপত্তা নিশ্চয়তা:</strong> API কী কখনোই ডেটাবেজে সংরক্ষিত হয় না। ডেটাবেজে কেবল লেবেল (যেমন: GROQ_API_KEY) থাকে। মূল সিক্রেট ক্লাউডফ্লেয়ার সিক্রেটস বা .env.local থেকে রিড করা হয়।
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providers.map((prov) => {
              const provKeys = keys.filter((k) => k.providerId === prov.id)
              return (
                <div key={prov.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{prov.displayName}</h3>
                      <span className="text-xs font-mono text-slate-500">{prov.providerName}</span>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        prov.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {prov.isActive ? 'সক্রিয়' : 'বন্ধ'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 font-mono break-all">{prov.baseUrl}</div>

                  {/* Keys attached */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="text-xs text-slate-600 font-medium">কনফিগার করা API কি:</div>
                    {provKeys.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">কোনো কী লেবেল নেই</div>
                    ) : (
                      provKeys.map((k) => (
                        <div
                          key={k.id}
                          className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 text-xs"
                        >
                          <div>
                            <span className="font-mono text-slate-900 font-semibold">{k.label}</span>
                            <span className="text-slate-500 text-[11px] block">{k.displayLabel}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              k.isSetInEnv
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
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
        <form onSubmit={handleSaveRuleConfig} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 max-w-2xl shadow-xs">
          <div>
            <h3 className="text-lg font-bold text-slate-900">রুল ইঞ্জিন স্বায়ত্তশাসন সেটিংস</h3>
            <p className="text-xs text-slate-600">
              সকল রোল পাস করার পর রুল ইঞ্জিন সিদ্ধান্ত নেয় সংবাদটি সরাসরি প্রকাশিত হবে নাকি এডিটরের পর্যালোচনার জন্য বিচারাধীন থাকবে।
            </p>
          </div>

          <div className="space-y-4">
            {/* Auto Publish Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-semibold text-slate-900">স্বয়ংক্রিয় প্রকাশ (Auto-Publish)</div>
                <div className="text-xs text-slate-500">শর্ত পূরণ হলে মানবীয় অনুমোদন ছাড়াই সরাসরি প্রকাশ পাবে</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleConfig.autoPublish}
                  onChange={(e) => setRuleConfig({ ...ruleConfig, autoPublish: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Fact Checker Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">তথ্য যাচাই সর্বনিম্ন পাস স্কোর:</span>
                <span className="font-mono font-bold text-slate-900">{toBengaliNumber(ruleConfig.factCheckerMin)}%</span>
              </div>
              <input
                type="range"
                min="60"
                max="100"
                value={ruleConfig.factCheckerMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, factCheckerMin: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            {/* SEO Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">SEO সর্বনিম্ন পাস স্কোর:</span>
                <span className="font-mono font-bold text-slate-900">{toBengaliNumber(ruleConfig.seoMin)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={ruleConfig.seoMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, seoMin: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            {/* Image Threshold */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-700 font-medium">ছবি সর্বনিম্ন প্রাসঙ্গিকতা স্কোর:</span>
                <span className="font-mono font-bold text-slate-900">{toBengaliNumber(ruleConfig.imageMin)}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={ruleConfig.imageMin}
                onChange={(e) => setRuleConfig({ ...ruleConfig, imageMin: Number(e.target.value) })}
                className="w-full accent-red-600 cursor-pointer"
              />
            </div>

            {/* Image Optional Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-semibold text-slate-900">ছবি ঐচ্ছিক (Image Optional)</div>
                <div className="text-xs text-slate-500">ছবি না থাকলেও সংবাদ প্রকাশ করা যাবে</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={ruleConfig.imageOptional}
                  onChange={(e) => setRuleConfig({ ...ruleConfig, imageOptional: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-md cursor-pointer"
          >
            {loading ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ করুন'}
          </button>
        </form>
      )}

      {/* ── TAB 6: LOGS ────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {logs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">কোনো এক্সিকিউশন লগ পাওয়া যায়নি।</div>
          ) : (
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs text-slate-600 uppercase font-mono border-b border-slate-200">
                <tr>
                  <th className="p-3.5">রোল</th>
                  <th className="p-3.5">মডেল</th>
                  <th className="p-3.5">স্ট্যাটাস</th>
                  <th className="p-3.5">স্কোর</th>
                  <th className="p-3.5">ল্যাটেন্সি</th>
                  <th className="p-3.5">টোকেন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-bold text-slate-900">{log.role}</td>
                    <td className="p-3.5 font-mono text-xs text-slate-600">{log.model || 'N/A'}</td>
                    <td className="p-3.5">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded font-semibold ${
                          log.status === 'success'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'failed'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-xs font-semibold">
                      {log.score !== undefined ? `${toBengaliNumber(log.score)}%` : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-600">
                      {log.latencyMs ? `${toBengaliNumber(log.latencyMs)}ms` : '—'}
                    </td>
                    <td className="p-3.5 font-mono text-xs text-slate-600">
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
