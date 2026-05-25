import CheckoutButton from './CheckoutButton'
import CouponInput from './CouponInput'

interface Props {
  isPaid:           boolean
  paidUntil:        string | null
  totalGenerations: number
  dailyGenerations: number
  userEmail:        string
  userName:         string
}

const TRIAL_TOTAL = 10
const TRIAL_DAILY = 3

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function TrialBanner({
  isPaid,
  paidUntil,
  totalGenerations,
  dailyGenerations,
  userEmail,
  userName,
}: Props) {
  const isActive = isPaid && paidUntil != null && new Date(paidUntil) > new Date()

  if (isActive) {
    return (
      <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5 text-sm text-green-800">
        <span className="text-green-500 font-bold">✓</span>
        Full access. 3 runs/day. Valid until {formatDate(paidUntil!)}.
      </div>
    )
  }

  // Expired paid plan
  if (isPaid && paidUntil != null && new Date(paidUntil) <= new Date()) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-4 space-y-3">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-semibold text-amber-800">Your plan expired on {formatDate(paidUntil)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Renew for another 3 months at ₹499.</p>
          </div>
          <CheckoutButton userEmail={userEmail} userName={userName} />
        </div>
      </div>
    )
  }

  const totalLeft   = Math.max(0, TRIAL_TOTAL - totalGenerations)
  const dailyLeft   = Math.max(0, TRIAL_DAILY - dailyGenerations)
  const exhausted   = totalLeft <= 0
  const dailyMaxed  = dailyLeft <= 0
  const progressPct = Math.min(100, (totalGenerations / TRIAL_TOTAL) * 100)

  return (
    <div
      className={`rounded-lg border px-4 py-4 space-y-3 ${
        exhausted ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          {exhausted ? (
            <p className="text-sm font-semibold text-red-800">Free trial used up</p>
          ) : (
            <p className="text-sm font-semibold text-amber-800">
              Free trial: {totalLeft} generation{totalLeft !== 1 ? 's' : ''} left
            </p>
          )}

          {!exhausted && dailyMaxed && (
            <p className="text-xs text-amber-700 mt-0.5">
              Daily limit reached (3/day). Resets tomorrow.
            </p>
          )}

          {!exhausted && !dailyMaxed && (
            <p className="text-xs text-gray-500 mt-0.5">
              {dailyLeft} today, {totalLeft} total remaining. Max 3/day.
            </p>
          )}

          {exhausted && (
            <p className="text-xs text-gray-500 mt-0.5">
              ₹499 for 3 months. 3 applications/day.
            </p>
          )}
        </div>

        <CheckoutButton userEmail={userEmail} userName={userName} />
      </div>

      <div className="h-1.5 bg-amber-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            exhausted ? 'bg-red-400' : 'bg-amber-400'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <CouponInput />
    </div>
  )
}
