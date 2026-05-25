import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import SettingsForm from '@/components/SettingsForm'

export const metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const [profileResult, sessionResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, phone, is_paid, paid_until, total_generations')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.auth.getSession(),
  ])

  const profile = profileResult.data

  return (
    <>
      <Navbar email={user.email ?? ''} />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-500 mb-8">Manage your account and extension sync.</p>

        <SettingsForm
          userId={user.id}
          email={user.email ?? ''}
          initialName={profile?.name ?? ''}
          initialPhone={profile?.phone ?? ''}
          isPaid={profile?.is_paid ?? false}
          paidUntil={profile?.paid_until ?? null}
          totalGenerations={profile?.total_generations ?? 0}
          accessToken={sessionResult.data?.session?.access_token ?? ''}
        />
      </main>
    </>
  )
}
