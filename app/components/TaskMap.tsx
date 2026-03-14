'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet components (SSR-incompatible)
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
);

const CATEGORY_ICONS: Record<string, string> = {
  clean: '🧹',
  green: '🌱',
  fix: '🔧',
  feed: '🍱',
  build: '🏗️',
  serve: '👐',
};

const CATEGORY_COLORS: Record<string, string> = {
  clean: '#0369A1',
  green: '#15803D',
  fix: '#92400E',
  feed: '#BE123C',
  build: '#7C3AED',
  serve: '#BE185D',
};

interface Task {
  id: number;
  title: string;
  slug: string;
  category: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  event_date: string;
  volunteers_needed: number;
  volunteers_count: number;
  creator_name: string;
  photo_url: string;
}

interface TaskMapProps {
  tasks: Task[];
  center?: [number, number];
  zoom?: number;
  onTaskClick?: (slug: string) => void;
}

function createCategoryIcon(category: string) {
  if (typeof window === 'undefined') return null;
  const L = require('leaflet');
  const color = CATEGORY_COLORS[category] || '#1B4332';
  const icon = CATEGORY_ICONS[category] || '📌';
  
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
        cursor: pointer;
      ">${icon}</div>
    `,
    className: 'custom-marker',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

export default function TaskMap({ tasks, center, zoom = 11, onTaskClick }: TaskMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(center || [47.5650, -122.6270]); // Kitsap County

  useEffect(() => {
    setIsClient(true);
    
    // Try to get user's location
    if (!center && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setMapCenter([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Default to Kitsap County if denied
        },
        { timeout: 5000 }
      );
    }
  }, [center]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading map...</div>
      </div>
    );
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {tasks.map((task) => (
        <Marker
          key={task.id}
          position={[parseFloat(task.latitude as any), parseFloat(task.longitude as any)]}
          icon={createCategoryIcon(task.category)}
          eventHandlers={{
            click: () => onTaskClick && onTaskClick(task.slug),
          }}
        >
          <Popup>
            <div className="p-1 min-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{CATEGORY_ICONS[task.category]}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full badge-${task.category}`}>
                  {task.category}
                </span>
              </div>
              <h3 className="font-bold text-sm mb-1">{task.title}</h3>
              {task.address && (
                <p className="text-xs text-gray-500 mb-1">📍 {task.address}</p>
              )}
              {task.event_date && (
                <p className="text-xs text-gray-500 mb-1">
                  📅 {new Date(task.event_date).toLocaleDateString()}
                </p>
              )}
              <p className="text-xs text-gray-600 mb-2">
                👥 {task.volunteers_count}/{task.volunteers_needed} volunteers
              </p>
              <a
                href={`/task/${task.slug}`}
                className="text-xs font-semibold text-green-700 hover:text-green-800"
              >
                View Details →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
