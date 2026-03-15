'use client';

const CATEGORIES = [
  { key: 'all', icon: '🗺️', label: 'All' },
  { key: 'clean', icon: '🧹', label: 'Clean' },
  { key: 'green', icon: '🌱', label: 'Green' },
  { key: 'fix', icon: '🔧', label: 'Fix' },
  { key: 'feed', icon: '🍱', label: 'Feed' },
  { key: 'build', icon: '🏗️', label: 'Build' },
  { key: 'serve', icon: '👐', label: 'Serve' },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onChange(cat.key === 'all' ? '' : cat.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            (cat.key === 'all' && !selected) || cat.key === selected
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
