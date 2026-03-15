'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TaskCard from '../../components/TaskCard';

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
};

export default function CityDetailPage() {
  const params = useParams();
  const cityName = decodeURIComponent(params.city as string);
  const [stats, setStats] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cities?city=${encodeURIComponent(cityName)}`)
      .then(r => r.json())
      .then(d => {
        setStats(d.stats);
        setTasks(d.tasks || []);
        setCategories(d.categories || []);
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

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <Link href="/cities" className="text-sm text-gray-500 hover:text-orange-600 mb-4 inline-block">
          ← All Cities
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
            📍 {cityName}
          </h1>
          <p className="text-gray-600">Community impact dashboard</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--dark)' }}>{stats.total_tasks || 0}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Tasks</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{stats.completed_tasks || 0}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Completed</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--earth)' }}>{stats.total_volunteers || 0}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Volunteers</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold text-blue-600">{stats.categories_active || 0}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Categories</p>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categories.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">By Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <div key={cat.category} className="text-center px-4 py-3 rounded-xl bg-gray-50">
                  <span className="text-xl">{CATEGORY_ICONS[cat.category] || '📌'}</span>
                  <p className="text-sm font-semibold text-gray-700 capitalize">{cat.category}</p>
                  <p className="text-xs text-gray-500">{cat.completed}/{cat.total} done</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active tasks */}
        {activeTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">🟢 Needs Help ({activeTasks.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedTasks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">✅ Completed ({completedTasks.length})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedTasks.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-4xl mb-3">📍</p>
            <p className="text-gray-500">No tasks in {cityName} yet. <Link href="/post" className="text-orange-600 hover:underline">Post one →</Link></p>
          </div>
        )}
      </div>
    </div>
  );
}
