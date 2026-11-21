import React, { useState, useEffect } from 'react';
import {
  Upload,
  Camera,
  MapPin,
  Navigation,
  Send,
  Loader2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import TriageCard from './TriageCard';
import { createGrievance } from '../services/api';

// Curated sample test images across Nellore landmarks for quick one-click testing
const SAMPLE_PRESETS = [
  {
    name: 'Trunk Road Pothole',
    category: 'Roads',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
    desc: 'Deep sharp pothole on Trunk Road opposite Gandhi Statue, Nellore causing dangerous swerving.',
    coords: { lat: 14.4426, lng: 79.9865 }
  },
  {
    name: 'Dargamitta Garbage Overflow',
    category: 'Sanitation',
    url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=800&q=80',
    desc: 'Uncollected municipal solid waste spilling onto sidewalk near Dargamitta RTC bus shelter.',
    coords: { lat: 14.4320, lng: 79.9730 }
  },
  {
    name: 'Mini Bypass Pipe Burst',
    category: 'Water',
    url: 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=800&q=80',
    desc: 'High-pressure drinking water line ruptured and gushing potable water along Mini Bypass Road.',
    coords: { lat: 14.4380, lng: 79.9600 }
  },
  {
    name: 'Kovur Junction Live Cable',
    category: 'Electrical',
    url: 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&w=800&q=80',
    desc: 'Storm-damaged power line hanging precariously over Kovur Junction bridge approach.',
    coords: { lat: 14.4980, lng: 79.9850 }
  }
];

export default function ReportHazard({ onGrievanceCreated, onViewMap }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [description, setDescription] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);

  // Geolocation state (Default to Nellore city center)
  const [latitude, setLatitude] = useState('14.4426');
  const [longitude, setLongitude] = useState('79.9865');
  const [locationStatus, setLocationStatus] = useState('Nellore City Center (Trunk Road) selected');
  const [isLocating, setIsLocating] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [triageResponse, setTriageResponse] = useState(null);

  // Try to acquire browser geolocation on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring precise GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocationStatus(`GPS Locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setLocationStatus('GPS permission skipped. Using default municipal coordinates or edit manually.');
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyPreset = (preset) => {
    setImageFile(null);
    setImagePreview(preset.url);
    setDescription(preset.desc);
    setLatitude(preset.coords.lat.toString());
    setLongitude(preset.coords.lng.toString());
    setLocationStatus(`Preset coordinates applied: ${preset.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!imageFile && !imagePreview) {
      setErrorMessage('Please upload or select a hazard photo.');
      return;
    }

    if (!latitude || !longitude) {
      setErrorMessage('Please provide valid GPS latitude and longitude.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);

      if (imageFile) {
        formData.append('beforeImage', imageFile);
      } else if (imagePreview) {
        formData.append('beforeImageUrl', imagePreview);
      }

      if (audioBlob) {
        formData.append('audio', audioBlob, 'citizen_grievance_voice.webm');
      }

      const res = await createGrievance(formData);

      setTriageResponse(res);
      if (onGrievanceCreated) {
        onGrievanceCreated(res.data);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to submit grievance. Please verify server connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImageFile(null);
    setImagePreview('');
    setDescription('');
    setAudioBlob(null);
    setTriageResponse(null);
    setErrorMessage('');
    detectLocation();
  };

  // If already triaged, show result card
  if (triageResponse) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
        <TriageCard
          grievance={triageResponse.data}
          isDuplicate={triageResponse.isDuplicate}
          message={triageResponse.message}
          onReset={resetForm}
          onViewMap={onViewMap}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Civic Triage Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Report Civic Hazard & Grievance
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
          Upload photo evidence, record an optional voice note, and get instant municipal routing with Gemini Flash AI triage and 50m duplicate detection.
        </p>
      </div>

      {/* Quick Test Presets */}
      <div className="mb-6 p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
          ⚡ 1-Click Test Scenarios (Instant Mock Data):
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all text-xs group cursor-pointer"
            >
              <span className="font-semibold text-slate-800 block group-hover:text-blue-600">
                {p.name}
              </span>
              <span className="text-[10px] text-slate-400">{p.category}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {errorMessage && (
          <div className="flex items-start space-x-3 p-4 bg-rose-50 text-rose-800 text-sm rounded-xl border border-rose-200 animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Submission Warning</p>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 1. Hazard Image Upload */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Photo Evidence of Grievance <span className="text-rose-500">*</span>
          </label>

          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
              <img
                src={imagePreview}
                alt="Hazard Preview"
                className="w-full h-64 object-cover object-center"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-3">
                <label className="px-3 py-1.5 bg-white text-slate-800 text-xs font-semibold rounded-lg shadow-md cursor-pointer hover:bg-slate-100">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="px-3 py-1.5 bg-rose-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-rose-700"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 bg-slate-50/60 hover:bg-blue-50/20 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-sm font-semibold text-slate-800">
                Click to upload or take a photo
              </span>
              <span className="text-xs text-slate-500 mt-1">
                JPEG, PNG, WEBP up to 15MB
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* 2. Geolocation Section */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>2. Geolocation Coordinates <span className="text-rose-500">*</span></span>
            </label>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isLocating}
              className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5" />
                  <span>GPS Auto-Detect</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Latitude:</span>
              <input
                type="number"
                step="any"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="12.9716"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-0.5">Longitude:</span>
              <input
                type="number"
                step="any"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="77.5946"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span>ℹ️</span>
            <span>{locationStatus}</span>
          </p>
        </div>

        {/* 3. Audio Recorder Component */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            3. Voice Grievance Recording
          </label>
          <AudioRecorder
            onAudioRecorded={setAudioBlob}
            audioBlob={audioBlob}
            setAudioBlob={setAudioBlob}
          />
        </div>

        {/* 4. Text Description */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>4. Additional Description (Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the issue, landmarks, street name, or potential risk to public safety..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing with Gemini Flash (Checking 50m Duplicates & Classifying)...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit for AI Triage & Municipal Action</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
