import Link from 'next/link'

export default function AuthError() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign-in failed</h1>
        <p className="text-gray-500 mb-6">
          Something went wrong during Google sign-in. Please try again.
        </p>
        <Link
          href="/"
          className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to login
        </Link>
      </div>
    </main>
  )
}
