'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskCard from '../../components/TaskCard';

const ORG_CATEGORIES: Record<string, { icon: string; label: string }> = {
  nonprofit: { icon: '💚', label: 'Nonprofit' },
  government: { icon: '🏛️', label: 'Government' },
  community: { icon: '🤝', label: 'Community Group' },
  religious: { icon: '🕊️', label: 'Religious Organization' },
  other: { icon: '🏢', label: 'Organization' },
};

export default function OrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [org, setOrg] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orgs/${params.slug}`)
      .then(res => {
        if (!res.ok) { router.push('/orgs'); return null; }
        return res.json();
      })
      .then(data => {
        if (data) {
          setOrg(data.organization);
          setTasks(data.tasks || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!org) return null;

  const catInfo = ORG_CATEGORIES[org.category] || ORG_CATEGORIES.other;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const totalVolunteers = tasks.reduce((sum: number, t: any) => sum + (t.volunteers_count || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/orgs" className="text-sm text-gray-500 hover:text-green-700 mb-4 inline-block">
          ← All Organizations
        </Link>

        {/* Org header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 mb-6 fade-in">
          <div className="flex items-start gap-4 sm:gap-6">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-green-50 flex items-center justify-center text-3xl flex-shrink-0">
                {catInfo.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{org.name}</h1>
                {org.is_verified && (
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
                    ✅ Verified Partner
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{catInfo.label}</p>
              {org.description && (
                <p className="text-gray-600 mt-3 leading-relaxed">{org.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-500">
                {org.website && (
                  <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">
                    🌐 Website
                  </a>
                )}
                {org.address && <span>📍 {org.address}</span>}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: 'var(--forest)' }}>{tasks.length}</p>
              <p className="text-xs text-gray-500">Tasks</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: 'var(--sage)' }}>{completedTasks.length}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold" style={{ color: 'var(--earth)' }}>{totalVolunteers}</p>
              <p className="text-xs text-gray-500">Volunteers</p>
            </div>
          </div>
        </div>

        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">🟢 Active Tasks</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">✅ Completed</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-500">No tasks from this organization yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
