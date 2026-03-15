'use client';

import { useState, useEffect } from 'react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(d => setLeaders(d.leaderboard || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--forest)' }}>
            🏆 Leaderboard
          </h1>
          <p className="text-gray-600 text-lg">
            People showing up and making Kitsap better.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🏆</p>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No activity yet</h2>
            <p className="text-gray-500">Volunteer for a task to get on the board!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">#</th>
                  <th className="text-left px-5 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Name</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Volunteered</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">Created</th>
                  <th className="text-center px-5 py-3 text-xs text-gray-400 uppercase tracking-wide font-semibold">🏅</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((user, i) => (
                  <tr key={user.id} className={`border-b border-gray-50 ${i < 3 ? 'bg-green-50/30' : ''}`}>
                    <td className="px-5 py-4 text-lg font-bold">
                      {i < 3 ? medals[i] : <span className="text-gray-400 text-sm">{i + 1}</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-800">{user.name}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold" style={{ color: 'var(--forest)' }}>{user.volunteer_count}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-gray-600">{user.tasks_created}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-sm text-gray-500">{user.badge_count || 0}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
