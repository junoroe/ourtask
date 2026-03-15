'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const TaskMap = dynamic(() => import('../../components/TaskMap'), { ssr: false });
import BeforeAfter from '../../components/BeforeAfter';

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹', green: '🌱', fix: '🔧', feed: '🍱', build: '🏗️', serve: '👐',
};

const CATEGORY_LABELS: Record<string, string> = {
  clean: 'Clean Up', green: 'Green & Grow', fix: 'Fix & Repair',
  feed: 'Feed & Nourish', build: 'Build', serve: 'Serve & Support',
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [task, setTask] = useState<any>(null);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [volunteering, setVolunteering] = useState(false);
  const [isVolunteered, setIsVolunteered] = useState(false);
  const [message, setMessage] = useState('');
  const [afterPhoto, setAfterPhoto] = useState<File | null>(null);
  const [afterPreview, setAfterPreview] = useState('');
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    fetchTask();
  }, []);

  async function fetchTask() {
    try {
      const res = await fetch(`/api/tasks/${params.slug}`);
      if (!res.ok) {
        router.push('/');
        return;
      }
      const data = await res.json();
      setTask(data.task);
      setVolunteers(data.volunteers || []);

      // Check if current user is already volunteered
      const stored = localStorage.getItem('user');
      if (stored) {
        const u = JSON.parse(stored);
        setIsVolunteered(data.volunteers?.some((v: any) => v.user_id === u.id));
      }
    } catch (error) {
      console.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  }

  async function handleVolunteer() {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    setVolunteering(true);
    try {
      const res = await fetch(`/api/tasks/${params.slug}/volunteer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (res.ok) {
        setIsVolunteered(true);
        fetchTask(); // Refresh
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Failed to volunteer');
    } finally {
      setVolunteering(false);
    }
  }

  async function handleLeave() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await fetch(`/api/tasks/${params.slug}/volunteer`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setIsVolunteered(false);
      fetchTask();
    } catch (error) {
      alert('Failed to leave task');
    }
  }

  async function handleComplete() {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Mark this task as completed?')) return;
    setCompleting(true);

    try {
      // Upload after photo if provided
      let photoAfterUrl = null;
      if (afterPhoto) {
        const formData = new FormData();
        formData.append('file', afterPhoto);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          photoAfterUrl = uploadData.url;
        }
      }

      const res = await fetch(`/api/tasks/${params.slug}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo_after_url: photoAfterUrl }),
      });
      const data = await res.json();
      if (res.ok) {
        fetchTask();
      } else {
        alert(data.error);
      }
    } catch (error) {
      alert('Failed to complete task');
    } finally {
      setCompleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-gray-400 text-lg">Loading task...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--cream)' }}>
        <div className="text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500">Task not found</p>
          <Link href="/" className="text-orange-600 hover:underline mt-2 inline-block">
            ← Back to map
          </Link>
        </div>
      </div>
    );
  }

  const spotsLeft = task.volunteers_needed - task.volunteers_count;
  const isOwner = user && user.id === task.creator_id;

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <Link href="/" className="text-sm text-gray-500 hover:text-orange-600 mb-4 inline-block">
          ← Back to map
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden fade-in">
          {/* Photo */}
          {task.photo_url && (
            <div className="relative">
              <img src={task.photo_url} alt={task.title} className="w-full h-64 sm:h-80 object-cover" />
              {task.status === 'completed' && (
                <div className="absolute top-4 right-4 bg-emerald-600 text-white px-3 py-1 rounded-full font-semibold text-sm">
                  ✅ Completed!
                </div>
              )}
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Category + Status */}
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium badge-${task.category}`}>
                {CATEGORY_ICONS[task.category]} {CATEGORY_LABELS[task.category]}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                task.status === 'open' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {task.status === 'open' ? '🟢 Open' :
                 task.status === 'completed' ? '✅ Done' :
                 task.status === 'in_progress' ? '🔄 In Progress' :
                 task.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">{task.title}</h1>

            {/* Meta info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
              {task.address && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Location</p>
                  <p className="text-sm font-medium text-gray-700">📍 {task.address}</p>
                </div>
              )}
              {task.event_date && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">When</p>
                  <p className="text-sm font-medium text-gray-700">
                    📅 {new Date(task.event_date).toLocaleDateString('en-US', {
                      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Volunteers</p>
                <p className="text-sm font-medium text-gray-700">
                  👥 {task.volunteers_count}/{task.volunteers_needed}
                  {spotsLeft > 0 && ` (${spotsLeft} spot${spotsLeft > 1 ? 's' : ''} left)`}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">What needs to happen</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>

            {/* Mini map */}
            <div className="h-48 rounded-xl overflow-hidden mb-6">
              <TaskMap
                tasks={[task]}
                center={[parseFloat(task.latitude), parseFloat(task.longitude)]}
                zoom={14}
              />
            </div>

            {/* Action buttons */}
            {task.status !== 'completed' && task.status !== 'cancelled' && (
              <div className="border-t border-gray-100 pt-6">
                {isOwner ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">Ready to mark this done?</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors">
                      {afterPreview ? (
                        <div className="relative">
                          <img src={afterPreview} alt="After" className="max-h-40 mx-auto rounded-lg" />
                          <button
                            type="button"
                            onClick={() => { setAfterPhoto(null); setAfterPreview(''); }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold"
                          >✕</button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block">
                          <span className="text-2xl block mb-1">📸</span>
                          <span className="text-sm text-gray-500">Add an "after" photo (optional)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setAfterPhoto(file);
                                setAfterPreview(URL.createObjectURL(file));
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                    <button onClick={handleComplete} disabled={completing} className="btn-primary w-full sm:w-auto disabled:opacity-50">
                      {completing ? 'Completing...' : '✅ Mark as Completed'}
                    </button>
                  </div>
                ) : isVolunteered ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-orange-600 font-semibold">
                      <span>✅</span> You're signed up!
                    </div>
                    <button onClick={handleLeave} className="text-sm text-gray-400 hover:text-red-500">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Add a message (optional) — e.g., 'I can bring trash bags!'"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                      rows={2}
                      maxLength={500}
                    />
                    <button
                      onClick={handleVolunteer}
                      disabled={volunteering}
                      className="btn-primary w-full sm:w-auto disabled:opacity-50"
                    >
                      {volunteering ? 'Signing up...' : "🙋 I'm In!"}
                    </button>
                    {!user && (
                      <p className="text-xs text-gray-400">
                        You'll need to <Link href="/login" className="text-orange-600 hover:underline">sign in</Link> to volunteer
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Before/After comparison slider */}
            {task.photo_url && task.photo_after_url && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Before & After</h2>
                <BeforeAfter
                  before={task.photo_url}
                  after={task.photo_after_url}
                />
              </div>
            )}

            {/* Volunteers list */}
            {volunteers.length > 0 && (
              <div className="border-t border-gray-100 pt-6 mt-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Volunteers ({volunteers.length})
                </h2>
                <div className="space-y-2">
                  {volunteers.map((v: any) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent)', color: 'var(--dark)' }}>
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{v.name}</p>
                        {v.message && <p className="text-xs text-gray-500">{v.message}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posted by */}
            <div className="border-t border-gray-100 pt-4 mt-6 text-sm text-gray-400">
              Posted by <span className="font-medium text-gray-600">{task.creator_name}</span> on{' '}
              {new Date(task.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
