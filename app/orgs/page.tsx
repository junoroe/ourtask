'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const ORG_CATEGORIES: Record<string, { icon: string; label: string }> = {
  nonprofit: { icon: '💚', label: 'Nonprofit' },
  government: { icon: '🏛️', label: 'Government' },
  community: { icon: '🤝', label: 'Community Group' },
  religious: { icon: '🕊️', label: 'Religious Org' },
  other: { icon: '🏢', label: 'Organization' },
};

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orgs')
      .then(res => res.json())
      .then(data => setOrgs(data.organizations || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3" style={{ color: 'var(--forest)' }}>
            🤝 Partner Organizations
          </h1>
          <p className="text-gray-600 text-lg max-w-xl mx-auto">
            Verified organizations coordinating community action across Kitsap County.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading organizations...</div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm">
            <p className="text-5xl mb-4">🤝</p>
            <h2 className="text-xl font-bold text-gray-700 mb-2">No organizations yet</h2>
            <p className="text-gray-500 mb-4">Know a local nonprofit that should be here?</p>
            <Link href="/orgs/register" className="btn-primary inline-block">
              Register an Organization
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((org) => (
              <Link key={org.id} href={`/orgs/${org.slug}`}>
                <div className="task-card bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-2xl">
                        {ORG_CATEGORIES[org.category]?.icon || '🏢'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 truncate">{org.name}</h3>
                        {org.is_verified && (
                          <span className="flex-shrink-0 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            ✅ Verified
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {ORG_CATEGORIES[org.category]?.label || 'Organization'}
                      </p>
                    </div>
                  </div>
                  
                  {org.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{org.description}</p>
                  )}
                  
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>📋 {org.task_count || 0} tasks</span>
                    <span>✅ {org.completed_count || 0} completed</span>
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
