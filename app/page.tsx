import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <header className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 rounded-full w-10 h-10 flex items-center justify-center text-black font-bold">
              TT
            </div>
            <h1 className="text-2xl font-bold dark:text-white text-black">TaskTogether</h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Link href="/register">Sign up</Link>
            </Button>
          </div>
        </header>

        <main className="py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Organize your tasks with ease
                </h2>
                <p className="text-xl text-gray-600 max-w-md">
                  Streamline your workflow, collaborate with your team, and track progress all in one place.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="bg-yellow-400 hover:bg-yellow-500 text-black">
                  <Link href="/register">Get started for free</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">Sign in to your account</Link>
                </Button>
              </div>
            </div>
            <div className="h-[400px] md:h-[500px] relative rounded-xl overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 z-10"></div>
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg w-[80%] h-[80%] overflow-hidden">
                  <div className="flex items-center gap-2 mb-4 border-b pb-2">
                    <div className="bg-yellow-400 rounded-full w-6 h-6 flex items-center justify-center text-black font-bold text-xs">
                      TT
                    </div>
                    <h3 className="font-semibold">Project Dashboard</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-100 rounded p-2 h-24">
                      <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-2/3 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-gray-100 rounded p-2 h-24">
                      <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                    </div>
                    <div className="bg-gray-100 rounded p-2 h-24">
                      <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-1/2 h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-yellow-100 rounded p-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="w-1/3 h-3 bg-yellow-200 rounded"></div>
                        <div className="w-8 h-8 bg-yellow-300 rounded-full"></div>
                      </div>
                      <div className="w-full h-3 bg-yellow-200 rounded mb-2"></div>
                      <div className="w-2/3 h-3 bg-yellow-200 rounded"></div>
                    </div>
                    <div className="bg-gray-100 rounded p-2">
                      <div className="flex justify-between items-center mb-2">
                        <div className="w-1/4 h-3 bg-gray-200 rounded"></div>
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded mb-2"></div>
                      <div className="w-3/4 h-3 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <div className="py-16 md:py-24">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-600"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 9h.01" />
                  <path d="M15 9h.01" />
                  <path d="M9 15h.01" />
                  <path d="M15 15h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Kanban Boards</h3>
              <p className="text-gray-600">Visualize your workflow with customizable boards and lists.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-600"
                >
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Task Management</h3>
              <p className="text-gray-600">Create, assign, and track tasks with detailed descriptions and due dates.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-md">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-yellow-600"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
              <p className="text-gray-600">Work together seamlessly with real-time updates and notifications.</p>
            </div>
          </div>
        </div>

        <footer className="py-12 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-black font-bold text-xs">
                TT
              </div>
              <span className="font-semibold">TaskTogether</span>
            </div>
            <div className="flex gap-8">
              <Link href="/login" className="text-gray-600 hover:text-gray-900">
                Login
              </Link>
              <Link href="/register" className="text-gray-600 hover:text-gray-900">
                Register
              </Link>
            </div>
          </div>
          <div className="mt-8 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} TaskTogether. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  )
}
