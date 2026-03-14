'use client';

import { useEffect, useRef, useState } from 'react';

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

export default function TaskMap({ tasks, center, zoom = 11, onTaskClick }: TaskMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !mapRef.current) return;

    // Dynamically import Leaflet
    const initMap = async () => {
      const L = (await import('leaflet')).default;

      // Fix default icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      // Don't re-init if already exists
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      const mapCenter = center || [47.5650, -122.6270];
      const map = L.map(mapRef.current!, {
        center: mapCenter as [number, number],
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      tasks.forEach((task) => {
        const lat = parseFloat(task.latitude as any);
        const lng = parseFloat(task.longitude as any);
        if (isNaN(lat) || isNaN(lng)) return;

        const color = CATEGORY_COLORS[task.category] || '#1B4332';
        const icon = CATEGORY_ICONS[task.category] || '📌';

        const divIcon = L.divIcon({
          html: `<div style="
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
          ">${icon}</div>`,
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        const marker = L.marker([lat, lng], { icon: divIcon }).addTo(map);

        const popupContent = `
          <div style="min-width: 200px; padding: 4px;">
            <div style="margin-bottom: 4px;">
              <span style="font-size: 14px;">${icon}</span>
              <span style="font-size: 11px; padding: 2px 8px; border-radius: 12px; background: ${color}20; color: ${color}; font-weight: 600;">
                ${task.category}
              </span>
            </div>
            <h3 style="font-weight: 700; font-size: 13px; margin: 4px 0;">${task.title}</h3>
            ${task.address ? `<p style="font-size: 11px; color: #666; margin: 2px 0;">📍 ${task.address}</p>` : ''}
            ${task.event_date ? `<p style="font-size: 11px; color: #666; margin: 2px 0;">📅 ${new Date(task.event_date).toLocaleDateString()}</p>` : ''}
            <p style="font-size: 11px; color: #444; margin: 4px 0;">
              👥 ${task.volunteers_count}/${task.volunteers_needed} volunteers
            </p>
            <a href="/task/${task.slug}" style="font-size: 11px; font-weight: 600; color: #15803D; text-decoration: none;">
              View Details →
            </a>
          </div>
        `;

        marker.bindPopup(popupContent);

        if (onTaskClick) {
          marker.on('click', () => {
            // Let popup show, clicking "View Details" navigates
          });
        }

        markersRef.current.push(marker);
      });

      // Fit bounds if we have tasks
      if (tasks.length > 0 && !center) {
        const bounds = L.latLngBounds(
          tasks.map(t => [parseFloat(t.latitude as any), parseFloat(t.longitude as any)] as [number, number])
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
      }

      // Force a resize after rendering
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient, tasks, center, zoom]);

  if (!isClient) {
    return (
      <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="text-gray-400 text-lg">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full h-full rounded-xl"
      style={{ minHeight: '400px' }}
    />
  );
}
