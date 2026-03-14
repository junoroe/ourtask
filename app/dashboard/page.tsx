'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TaskCard from '../components/TaskCard';

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [myVolunteering, setMyVolunteering] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tasks' | 'volunteering'>('tasks');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!stored || !token) {
      router.push('/login');
      return;
    }
    setUser(JSON.parse(stored));
    fetchData(token);
  }, []);

  async function fetchData(token: string) {
    try {
      // Fetch user's tasks
      const tasksRes = await fetch('/api/tasks?my=true', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const tasksData = await tasksRes.json();
      setMyTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--forest)' }}>
              Welcome back, {user.name} 👋
            </h1>
            <p className="text-gray-500">Here's your community impact</p>
          </div>
          <Link href="/post" className="btn-primary text-sm">
            + Post a Task
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 My Tasks ({myTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('volunteering')}
            className={`pb-3 text-sm font-medium transition-colors ${
              activeTab === 'volunteering'
                ? 'text-green-700 border-b-2 border-green-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🙋 Volunteering
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : activeTab === 'tasks' ? (
          <div>
            {myTasks.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl">
                <p className="text-4xl mb-3">📋</p>
                <p className="text-gray-500 mb-2">No tasks posted yet</p>
                <Link href="/post" className="text-green-700 font-medium hover:underline">
                  Post your first task →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl">
            <p className="text-4xl mb-3">🙋</p>
            <p className="text-gray-500 mb-2">Tasks you've volunteered for will appear here</p>
            <Link href="/" className="text-green-700 font-medium hover:underline">
              Find tasks near you →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
