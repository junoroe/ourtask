'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const TaskMap = dynamic(() => import('../components/TaskMap'), { ssr: false });

const CATEGORIES = [
  { key: 'clean', icon: '🧹', label: 'Clean Up', desc: 'Litter, graffiti, debris, trail clearing' },
  { key: 'green', icon: '🌱', label: 'Green & Grow', desc: 'Planting, gardens, wildflowers, trees' },
  { key: 'fix', icon: '🔧', label: 'Fix & Repair', desc: 'Broken benches, faded signs, infrastructure' },
  { key: 'feed', icon: '🍱', label: 'Feed & Nourish', desc: 'Meal distribution, food banks, kitchens' },
  { key: 'build', icon: '🏗️', label: 'Build', desc: 'Little Free Libraries, garden beds, murals' },
  { key: 'serve', icon: '👐', label: 'Serve & Support', desc: 'Supporting vulnerable communities' },
];

export default function PostTaskPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [eventDate, setEventDate] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [volunteersNeeded, setVolunteersNeeded] = useState(5);
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login?redirect=/post');
    }
  }, []);

  async function searchAddress() {
    if (!address) return;
    setSearchingLocation(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await res.json();
      if (data.length > 0) {
        setLatitude(parseFloat(data[0].lat));
        setLongitude(parseFloat(data[0].lon));
        setAddress(data[0].display_name);
      } else {
        setError('Could not find that location. Try a more specific address.');
      }
    } catch (e) {
      setError('Failed to search location');
    } finally {
      setSearchingLocation(false);
    }
  }

  function useMyLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          // Reverse geocode
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            );
            const data = await res.json();
            setAddress(data.display_name || 'Current location');
          } catch (e) {
            setAddress('Current location');
          }
        },
        () => setError('Could not get your location. Please enter an address.'),
        { timeout: 10000 }
      );
    }
  }

  async function handleSubmit() {
    setError('');
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');

      // Upload photo if selected
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error || 'Photo upload failed');
          setSubmitting(false);
          setUploading(false);
          return;
        }
        finalPhotoUrl = uploadData.url;
        setUploading(false);
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          category,
          latitude,
          longitude,
          address,
          event_date: eventDate || null,
          estimated_duration: estimatedDuration || null,
          volunteers_needed: volunteersNeeded,
          photo_url: finalPhotoUrl || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(`/task/${data.task.slug}`);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError('Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--cream)' }}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--dark)' }}>
          Post a Task
        </h1>
        <p className="text-gray-500 mb-6">What needs doing? Let's rally people to help.</p>

        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>
        )}

        {/* Step 1: Category */}
        {step === 1 && (
          <div className="fade-in">
            <h2 className="text-lg font-semibold mb-4">What type of task is this?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => { setCategory(cat.key); setStep(2); }}
                  className={`p-4 rounded-xl text-left transition-all border-2 ${
                    category === cat.key
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-100 bg-white hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{cat.label}</p>
                      <p className="text-xs text-gray-500">{cat.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="fade-in space-y-4">
            <h2 className="text-lg font-semibold">Tell us about it</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Clean up Illahee Beach trail"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                maxLength={255}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                What needs to happen? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task in detail. What will volunteers be doing? What should they bring? Any special instructions?"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                rows={5}
                maxLength={5000}
              />
              <p className="text-xs text-gray-400 mt-1">{description.length}/5000</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-orange-400 transition-colors">
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); setPhotoUrl(''); }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <span className="text-3xl block mb-2">📷</span>
                    <span className="text-sm text-gray-500">Tap to add a photo</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError('Photo must be under 5MB');
                            return;
                          }
                          setPhotoFile(file);
                          setPhotoPreview(URL.createObjectURL(file));
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(1)} className="btn-secondary">
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!title || title.length < 5) { setError('Title must be at least 5 characters'); return; }
                  if (!description || description.length < 20) { setError('Description must be at least 20 characters'); return; }
                  setError('');
                  setStep(3);
                }}
                className="btn-primary flex-1"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Location & logistics */}
        {step === 3 && (
          <div className="fade-in space-y-4">
            <h2 className="text-lg font-semibold">Where and when?</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter address or location name"
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                  onKeyDown={(e) => e.key === 'Enter' && searchAddress()}
                />
                <button
                  onClick={searchAddress}
                  disabled={searchingLocation}
                  className="btn-secondary !py-2 !px-4 text-sm whitespace-nowrap"
                >
                  {searchingLocation ? '...' : '🔍 Find'}
                </button>
              </div>
              <button
                onClick={useMyLocation}
                className="text-xs text-orange-600 hover:underline mt-1"
              >
                📍 Use my current location
              </button>
              {latitude && longitude && (
                <div className="mt-3 h-48 rounded-xl overflow-hidden">
                  <TaskMap
                    tasks={[{
                      id: 0, title, slug: '', category, status: 'open',
                      latitude, longitude, address, event_date: '',
                      volunteers_needed: volunteersNeeded, volunteers_count: 0,
                      creator_name: '', photo_url: '',
                    }]}
                    center={[latitude, longitude]}
                    zoom={14}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date (optional)</label>
                <input
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration (optional)</label>
                <input
                  type="text"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  placeholder="e.g., 2 hours"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volunteers needed
              </label>
              <input
                type="number"
                value={volunteersNeeded}
                onChange={(e) => setVolunteersNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={500}
                className="w-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep(2)} className="btn-secondary">
                ← Back
              </button>
              <button
                onClick={() => {
                  if (!latitude || !longitude) { setError('Please set a location'); return; }
                  setError('');
                  handleSubmit();
                }}
                disabled={submitting}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {uploading ? 'Uploading photo...' : submitting ? 'Posting...' : '✦ Post Task'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
