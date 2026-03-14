'use client';

import { useState, useEffect } from 'react';
import TaskCard from '../components/TaskCard';

export default function CompletedPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompleted();
  }, []);

  async function fetchCompleted() {
    try {
      const res = await fetch('/api/tasks?status=completed');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load completed tasks');
    } finally {
      setLoading(false);
    }
  }

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

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-8 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>{tasks.length}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Tasks Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--sage)' }}>
              {tasks.reduce((sum, t) => sum + (t.volunteers_count || 0), 0)}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Volunteers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold" style={{ color: 'var(--earth)' }}>
              {new Set(tasks.map(t => t.category)).size}
            </p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Categories</p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading completed tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🌱</p>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No completed tasks yet</h2>
            <p className="text-gray-500 mb-4">Be the first to complete a task and show up here!</p>
            <a href="/" className="btn-primary inline-block">
              Find a task →
            </a>
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
