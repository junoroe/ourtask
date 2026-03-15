'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const CATEGORIES = [
  { key: 'clean', icon: '🧹', label: 'Clean' },
  { key: 'green', icon: '🌱', label: 'Green' },
  { key: 'fix', icon: '🔧', label: 'Fix' },
  { key: 'feed', icon: '🍱', label: 'Feed' },
  { key: 'build', icon: '🏗️', label: 'Build' },
  { key: 'serve', icon: '👐', label: 'Serve' },
];

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  async function handleLogout() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (e) {}
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  }

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold" style={{ color: 'var(--forest)' }}>
              OurTask
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/completed"
              className={`text-sm font-medium transition-colors ${
                pathname === '/completed' ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
              }`}
            >
              ✨ Impact Wall
            </Link>
            <Link
              href="/orgs"
              className={`text-sm font-medium transition-colors ${
                pathname?.startsWith('/orgs') ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
              }`}
            >
              🤝 Orgs
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/post"
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  + Post a Task
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/dashboard' ? 'text-green-700' : 'text-gray-600 hover:text-green-700'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-green-700 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm !py-2 !px-4"
                >
                  Join OurTask
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenu(!mobileMenu)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="md:hidden pb-4 fade-in">
            <div className="flex flex-col gap-3">
              <Link href="/completed" className="text-sm font-medium text-gray-600 py-2" onClick={() => setMobileMenu(false)}>
                ✨ Impact Wall
              </Link>
              {user ? (
                <>
                  <Link href="/post" className="btn-primary text-sm text-center" onClick={() => setMobileMenu(false)}>
                    + Post a Task
                  </Link>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 py-2" onClick={() => setMobileMenu(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-gray-500 text-left py-2">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-600 py-2" onClick={() => setMobileMenu(false)}>
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn-primary text-sm text-center" onClick={() => setMobileMenu(false)}>
                    Join OurTask
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
