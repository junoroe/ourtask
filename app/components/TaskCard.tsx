'use client';

import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹',
  green: '🌱',
  fix: '🔧',
  feed: '🍱',
  build: '🏗️',
  serve: '👐',
};

interface Task {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: string;
  address: string;
  event_date: string;
  volunteers_needed: number;
  volunteers_count: number;
  creator_name: string;
  photo_url: string;
  photo_after_url: string;
  created_at: string;
  distance_km?: number;
}

export default function TaskCard({ task }: { task: Task }) {
  const spotsLeft = task.volunteers_needed - task.volunteers_count;
  const isFull = spotsLeft <= 0;

  return (
    <Link href={`/task/${task.slug}`}>
      <div className="task-card bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 cursor-pointer">
        {/* Photo */}
        {task.photo_url ? (
          <div className="relative h-40 bg-gray-100">
            <img
              src={task.photo_url}
              alt={task.title}
              className="w-full h-full object-cover"
            />
            {task.photo_after_url && (
              <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                ✅ Completed
              </div>
            )}
          </div>
        ) : (
          <div className={`h-24 flex items-center justify-center text-4xl bg-gradient-to-br ${
            task.category === 'clean' ? 'from-blue-50 to-blue-100' :
            task.category === 'green' ? 'from-green-50 to-green-100' :
            task.category === 'fix' ? 'from-amber-50 to-amber-100' :
            task.category === 'feed' ? 'from-rose-50 to-rose-100' :
            task.category === 'build' ? 'from-purple-50 to-purple-100' :
            'from-pink-50 to-pink-100'
          }`}>
            {CATEGORY_ICONS[task.category] || '📌'}
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full badge-${task.category} font-medium`}>
              {CATEGORY_ICONS[task.category]} {task.category}
            </span>
            {task.status === 'completed' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                Done ✅
              </span>
            )}
          </div>

          <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{task.title}</h3>

          {task.address && (
            <p className="text-xs text-gray-500 mb-2 truncate">📍 {task.address}</p>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-3">
              {task.event_date && (
                <span>📅 {new Date(task.event_date).toLocaleDateString()}</span>
              )}
              <span className={isFull ? 'text-orange-600 font-semibold' : ''}>
                👥 {task.volunteers_count}/{task.volunteers_needed}
              </span>
            </div>
            {task.distance_km !== undefined && (
              <span className="text-gray-400">
                {task.distance_km < 1
                  ? `${Math.round(task.distance_km * 1000)}m`
                  : `${task.distance_km.toFixed(1)}km`}
              </span>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-2">Posted by {task.creator_name}</p>
        </div>
      </div>
    </Link>
  );
}
