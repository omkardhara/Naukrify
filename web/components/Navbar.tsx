export default function Navbar({ email }: { email: string }) {
  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-base font-bold text-indigo-600">Naukrify</span>
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="hidden sm:inline truncate max-w-[200px]">{email}</span>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="text-gray-400 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}
