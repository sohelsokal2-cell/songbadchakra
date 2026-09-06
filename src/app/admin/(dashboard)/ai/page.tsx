import AdminHeader from '@/components/admin/AdminHeader'
import AiAutomationManager from '@/components/admin/AiAutomationManager'
import {
  getAiJobs,
  getAiRoles,
  getAiProviders,
  getApiKeyLabels,
  getAiModels,
  getAiRoleModels,
  getAiRuleConfig,
  getAiPipelineLogs,
} from '@/lib/ai/ai-repository'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'AI নিউজ অটোমেশন ইঞ্জিন | সংবাদচক্র CMS',
}

export default async function AiAutomationPage() {
  const [
    jobsRes,
    roles,
    providers,
    keys,
    models,
    roleModels,
    ruleConfig,
    logs,
  ] = await Promise.all([
    getAiJobs({ limit: 50 }),
    getAiRoles(),
    getAiProviders(),
    getApiKeyLabels(),
    getAiModels(),
    getAiRoleModels(),
    getAiRuleConfig(),
    getAiPipelineLogs({ limit: 50 }),
  ])

  return (
    <div className="font-bengali pb-12">
      <AdminHeader
        title="AI নিউজ অটোমেশন ইঞ্জিন"
        subtitle="৬-স্তরের স্বায়ত্তশাসিত কৃত্রিম বুদ্ধিমত্তা নিউজ প্রসেসিং ও প্রকাশনা নিয়ন্ত্রণ কেন্দ্র"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <AiAutomationManager
          initialJobs={jobsRes.jobs}
          initialRoles={roles}
          initialProviders={providers}
          initialKeys={keys}
          initialModels={models}
          initialRoleModels={roleModels}
          initialRuleConfig={ruleConfig}
          initialLogs={logs}
        />
      </div>
    </div>
  )
}
