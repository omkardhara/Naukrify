import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export const metadata = { title: 'Admin' }

const ADMIN_EMAIL = 'omkar.dhara@gmail.com'

interface AdminStats {
  total_users: number
  paid_users: number
  trial_users: number
  total_generations: number
  generations_today: number
  total_applications: number
  apps_today: number
  apps_this_week: number
  status_breakdown: Record<string, number> | null
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg px-5 py-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard')

  const { data, error } = await supabase.rpc('get_admin_stats')
  const stats = data as AdminStats | null

  const STATUS_ORDER = ['drafted', 'applied', 'replied', 'interview', 'offered', 'rejected']
  const statusBreakdown = stats?.status_breakdown ?? {}

  return (
    <>
      <Navbar email={user.email ?? ''} />
      <main className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin</h1>
          <p className="text-sm text-gray-500">Product metrics. Visible only to you.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            Could not load stats: {error.message}. Run migration 007 in the Supabase SQL editor.
          </div>
        )}

        {stats && (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Users</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Total users" value={stats.total_users} />
                <StatCard label="Paid" value={stats.paid_users} sub="paid_until in the future" />
                <StatCard label="Tried (free)" value={stats.trial_users} sub="generated at least once" />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Generations</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Today" value={stats.generations_today} />
                <StatCard label="All time" value={stats.total_generations} />
              </div>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Applications tracked</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard label="Today" value={stats.apps_today} />
                <StatCard label="This week" value={stats.apps_this_week} />
                <StatCard label="All time" value={stats.total_applications} />
              </div>
            </section>

            {Object.keys(statusBreakdown).length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pipeline breakdown</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {STATUS_ORDER.map((s) => (
                    <div key={s} className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-center">
                      <p className="text-2xl font-bold text-gray-900">{statusBreakdown[s] ?? 0}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{s}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Revenue estimate</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  label="Paid users"
                  value={`₹${(stats.paid_users * 499).toLocaleString('en-IN')}`}
                  sub={`${stats.paid_users} × ₹499`}
                />
              </div>
            </section>
          </div>
        )}
      </main>
    </>
  )
}
