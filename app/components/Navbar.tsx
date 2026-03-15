'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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

  const navLink = (href: string, label: string, match?: string) => {
    const active = match ? pathname?.startsWith(match) : pathname === href;
    return (
      <Link
        href={href}
        className={`text-sm font-medium transition-colors ${
          active ? 'text-orange-400' : 'text-gray-300 hover:text-white'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-[1000]" style={{ background: '#1A1A1A' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo — large */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <img src="/logo.png" alt="OurTask" className="h-14 rounded-lg" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLink('/completed', '✨ Impact Wall')}
            {navLink('/orgs', '🤝 Orgs', '/orgs')}
            {navLink('/leaderboard', '🏆 Leaderboard')}
            {navLink('/cities', '🏘️ Cities', '/cities')}
            
            {user ? (
              <>
                <Link href="/post" className="btn-primary text-sm !py-2 !px-4">
                  + Post a Task
                </Link>
                <Link
                  href="/dashboard"
                  className={`text-sm font-medium transition-colors ${
                    pathname === '/dashboard' ? 'text-orange-400' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-400 hover:text-gray-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary text-sm !py-2 !px-4">
                  Join OurTask
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-gray-300"
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
          <div className="md:hidden pb-4 fade-in border-t border-gray-700">
            <div className="flex flex-col gap-3 pt-3">
              <Link href="/completed" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                ✨ Impact Wall
              </Link>
              <Link href="/orgs" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                🤝 Orgs
              </Link>
              <Link href="/leaderboard" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                🏆 Leaderboard
              </Link>
              <Link href="/cities" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                🏘️ Cities
              </Link>
              {user ? (
                <>
                  <Link href="/post" className="btn-primary text-sm text-center" onClick={() => setMobileMenu(false)}>
                    + Post a Task
                  </Link>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
                    Dashboard
                  </Link>
                  <button onClick={handleLogout} className="text-sm text-gray-400 text-left py-2">
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-gray-300 py-2" onClick={() => setMobileMenu(false)}>
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
