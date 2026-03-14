'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import CategoryFilter from './components/CategoryFilter';
import TaskCard from './components/TaskCard';

const TaskMap = dynamic(() => import('./components/TaskMap'), { ssr: false });

export default function HomePage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<any[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'map' | 'list'>('map');

  useEffect(() => {
    fetchTasks();
  }, [category]);

  async function fetchTasks() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      const res = await fetch(`/api/tasks/nearby?${params.toString()}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      {/* Hero section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3" style={{ color: 'var(--forest)' }}>
              See a problem?<br />
              <span style={{ color: 'var(--sage)' }}>Let's fix it together.</span>
            </h1>
            <p className="text-gray-600 text-lg max-w-xl mx-auto">
              Real-world tasks. Real people. Real impact.
              Find something near you and show up.
            </p>
          </div>

          {/* Category Filter */}
          <div className="flex items-center justify-between mb-4">
            <CategoryFilter selected={category} onChange={setCategory} />
            <div className="hidden sm:flex gap-1 ml-4">
              <button
                onClick={() => setView('map')}
                className={`p-2 rounded-lg transition-colors ${view === 'map' ? 'bg-green-800 text-white' : 'bg-white text-gray-500'}`}
              >
                🗺️
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-green-800 text-white' : 'bg-white text-gray-500'}`}
              >
                📋
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
        {view === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map */}
            <div className="lg:col-span-2 map-container" style={{ height: '65vh' }}>
              <TaskMap
                tasks={tasks}
                onTaskClick={(slug) => router.push(`/task/${slug}`)}
              />
            </div>

            {/* Task list sidebar */}
            <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold text-gray-700">
                  {loading ? 'Loading...' : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} nearby`}
                </h2>
              </div>
              {tasks.length === 0 && !loading && (
                <div className="text-center py-12 bg-white rounded-xl">
                  <p className="text-4xl mb-3">🌿</p>
                  <p className="text-gray-500 mb-2">No tasks yet in this area</p>
                  <p className="text-gray-400 text-sm">Be the first to post one!</p>
                </div>
              )}
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        ) : (
          /* List view */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading && (
              <div className="col-span-full text-center py-12 text-gray-400">Loading tasks...</div>
            )}
            {tasks.length === 0 && !loading && (
              <div className="col-span-full text-center py-12">
                <p className="text-4xl mb-3">🌿</p>
                <p className="text-gray-500">No tasks yet. Be the first!</p>
              </div>
            )}
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--forest)' }}>
            Spot something that needs fixing?
          </h2>
          <p className="text-gray-600 mb-4">
            Post a task in 30 seconds. No committees. No bureaucracy. Just action.
          </p>
          <a href="/post" className="btn-primary inline-block">
            + Post a Task
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 text-center text-sm text-gray-500">
        <div className="max-w-7xl mx-auto px-4">
          <p className="mb-2">
            <span className="text-lg">🌿</span> OurTask — Physical action for shared spaces
          </p>
          <p className="text-xs text-gray-400">
            Not political. Not a petition. Just people showing up and making things better.
          </p>
        </div>
      </footer>
    </div>
  );
}
