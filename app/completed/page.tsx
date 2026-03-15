'use client';

import { useState, useEffect } from 'react';
import TaskCard from '../components/TaskCard';

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
};

export default function CompletedPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks?status=completed').then(r => r.json()),
      fetch('/api/stats').then(r => r.json()),
    ]).then(([taskData, statsData]) => {
      setTasks(taskData.tasks || []);
      setStats(statsData.stats || {});
      setCategories(statsData.categories || []);
    }).catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--forest)' }}>
            ✨ Impact Wall
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Every completed task tells a story of people showing up and making things better.
          </p>
        </div>

        {/* Stats dashboard */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--forest)' }}>
                {stats.total_tasks || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Tasks Posted</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--sage)' }}>
                {stats.completed_tasks || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Completed</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold" style={{ color: 'var(--earth)' }}>
                {stats.total_volunteers || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Volunteers</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {stats.total_users || 0}
              </p>
              <p className="text-xs text-gray-500 uppercase tracking-wide mt-1">Members</p>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {categories.length > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Impact by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categories.map((cat) => (
                <div key={cat.category} className="text-center p-3 rounded-xl bg-gray-50">
                  <span className="text-2xl">{CATEGORY_ICONS[cat.category] || '📌'}</span>
                  <p className="text-sm font-semibold text-gray-700 mt-1 capitalize">{cat.category}</p>
                  <p className="text-xs text-gray-500">
                    {cat.total} tasks · {cat.completed} done
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed tasks grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading completed tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🌱</p>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No completed tasks yet</h2>
            <p className="text-gray-500 mb-4">Be the first to complete a task and show up here!</p>
            <a href="/" className="btn-primary inline-block">Find a task →</a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
