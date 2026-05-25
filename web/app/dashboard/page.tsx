import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import DashboardTabs from '@/components/DashboardTabs'
import GeminiDisclaimer from '@/components/GeminiDisclaimer'
import TrialBanner from '@/components/TrialBanner'
import TokenDisplay from '@/components/TokenDisplay'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [profileResult, variantsResult, sessionResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('master_cv, name, phone, is_paid, paid_until, total_generations, daily_generations')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('cv_variants')
      .select('id, name, tilt_notes')
      .eq('user_id', user.id)
      .order('created_at'),
    supabase.auth.getSession(),
  ])

  const profile = profileResult.data
  const isPaid            = profile?.is_paid            ?? false
  const paidUntil         = profile?.paid_until         ?? null
  const totalGenerations  = profile?.total_generations  ?? 0
  const dailyGenerations  = profile?.daily_generations  ?? 0
  const userName          = profile?.name ?? (user.user_metadata?.full_name as string) ?? ''

  return (
    <>
      <Navbar email={user.email ?? ''} />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Your CV and role tilts. The extension reads these when tailoring
            applications.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <TrialBanner
            isPaid={isPaid}
            paidUntil={paidUntil}
            totalGenerations={totalGenerations}
            dailyGenerations={dailyGenerations}
            userEmail={user.email ?? ''}
            userName={userName}
          />
          <GeminiDisclaimer />
        </div>

        <DashboardTabs
          userId={user.id}
          initialCv={profile?.master_cv ?? ''}
          initialName={userName}
          initialPhone={profile?.phone ?? ''}
          initialVariants={variantsResult.data ?? []}
        />

        <TokenDisplay
          accessToken={sessionResult.data?.session?.access_token ?? ''}
        />
      </main>
    </>
  )
}
