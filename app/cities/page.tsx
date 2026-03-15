'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CitiesPage() {
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.json())
      .then(d => setCities(d.cities || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--forest)' }}>
            🏘️ City Dashboards
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Community impact, city by city across Kitsap County.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading cities...</div>
        ) : cities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🏘️</p>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No city data yet</h2>
            <p className="text-gray-500">Tasks will be grouped by city as they're posted.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cities.map((city) => (
              <Link key={city.city} href={`/cities/${encodeURIComponent(city.city)}`}>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">📍 {city.city}</h3>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-xl font-bold" style={{ color: 'var(--forest)' }}>{city.total_tasks}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold" style={{ color: 'var(--sage)' }}>{city.completed_tasks}</p>
                      <p className="text-xs text-gray-500">Done</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold" style={{ color: 'var(--earth)' }}>{city.total_volunteers || 0}</p>
                      <p className="text-xs text-gray-500">Volunteers</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
