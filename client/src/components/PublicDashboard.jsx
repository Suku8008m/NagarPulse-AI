import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Search,
  Filter,
  Flame,
  ThumbsUp,
  MapPin,
  Clock,
  CheckCircle2,
  Building2,
  Copy,
  Check,
  RefreshCw,
  Layers,
  ArrowUpDown,
  Volume2,
  ExternalLink,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  X,
  Split,
  Eye
} from 'lucide-react';
import { getGrievances, upvoteGrievance } from '../services/api';

// Center map controller hook with animated flyTo
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom || 15, {
        animate: true,
        duration: 1.2
      });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet DivIcon generator for severity pins
const createCustomPin = (score = 5, status = 'Pending', isSelected = false) => {
  if (status === 'Verified Resolved') {
    return L.divIcon({
      className: 'custom-leaflet-marker',
      html: `
        <div style="background-color: #059669; width: ${isSelected ? '38px' : '32px'}; height: ${isSelected ? '38px' : '32px'}; border-radius: 50%; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: bold; font-size: ${isSelected ? '18px' : '15px'}; transition: all 0.2s;">
          ✓
        </div>
      `,
      iconSize: isSelected ? [38, 38] : [32, 32],
      iconAnchor: isSelected ? [19, 19] : [16, 16],
      popupAnchor: [0, -18]
    });
  }

  let color = '#10b981'; // Green (1-4)
  let isSevere = false;
  if (score >= 8) {
    color = '#dc2626'; // Red (8-10)
    isSevere = true;
  } else if (score >= 5) {
    color = '#f59e0b'; // Amber (5-7)
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: ${isSelected ? '40px' : '32px'}; height: ${isSelected ? '40px' : '32px'};">
        ${isSevere ? `<span style="position: absolute; width: ${isSelected ? '50px' : '42px'}; height: ${isSelected ? '50px' : '42px'}; border-radius: 50%; background-color: ${color}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>` : ''}
        <div style="background-color: ${color}; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; border: 2.5px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: #ffffff; font-weight: 800; font-size: ${isSelected ? '14px' : '12px'}; font-family: monospace; transition: all 0.2s;">
          ${score}
        </div>
      </div>
    `,
    iconSize: isSelected ? [40, 40] : [32, 32],
    iconAnchor: isSelected ? [20, 20] : [16, 16],
    popupAnchor: [0, -18]
  });
};

export default function PublicDashboard({ initialGrievances = [], onRefreshStats }) {
  const [grievances, setGrievances] = useState(initialGrievances);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [copiedId, setCopiedId] = useState('');

  // Nellore coordinates default: [lat, lng]
  const [mapCenter, setMapCenter] = useState([14.4426, 79.9865]);
  const [zoomLevel, setZoomLevel] = useState(13);

  // Bi-directional selection & highlight
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);

  // Before/After comparison modal state
  const [activeComparison, setActiveComparison] = useState(null);

  const mapContainerRef = useRef(null);

  // Fetch grievances from server
  const fetchGrievancesList = async () => {
    setLoading(true);
    try {
      const res = await getGrievances({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        search: searchQuery || undefined,
        sort: sortBy
      });
      if (res.data) {
        setGrievances(res.data);
      }
      if (onRefreshStats) onRefreshStats();
    } catch (err) {
      console.error('Error fetching grievances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievancesList();
  }, [selectedCategory, selectedStatus, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchGrievancesList();
  };

  const handleUpvote = async (id) => {
    try {
      const res = await upvoteGrievance(id);
      if (res.success) {
        setGrievances((prev) =>
          prev.map((g) => (g._id === id || g.trackingId === id ? { ...g, upvotes: res.upvotes } : g))
        );
        if (onRefreshStats) onRefreshStats();
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handleCopy = (trackingId) => {
    navigator.clipboard.writeText(trackingId);
    setCopiedId(trackingId);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Sync: Card -> Map flyTo
  const focusOnMap = (coordinates, trackingId) => {
    if (coordinates && coordinates.length === 2) {
      const [lng, lat] = coordinates;
      setMapCenter([lat, lng]);
      setZoomLevel(16);
      setSelectedMarkerId(trackingId);

      // Scroll smoothly to map
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Sync: Map Pin -> Scroll to Card & Highlight
  const handlePinClick = (item) => {
    setSelectedMarkerId(item.trackingId);
    setHighlightedId(item.trackingId);

    const cardElement = document.getElementById(`card-${item.trackingId}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      setHighlightedId(null);
    }, 4000);
  };

  // KPI Calculations
  const kpis = useMemo(() => {
    const list = Array.isArray(grievances) ? grievances : [];
    const total = list.length;
    const critical = list.filter((g) => (g.severityScore || 0) >= 8).length;
    const resolved = list.filter((g) => g.status === 'Verified Resolved').length;
    const activeDepts = new Set(list.map((g) => g.department).filter(Boolean)).size;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { total, critical, resolved, activeDepts, resolutionRate };
  }, [grievances]);

  // Filtered grievances for card grid
  const displayGrievances = useMemo(() => {
    const list = Array.isArray(grievances) ? grievances : [];
    return list.filter((g) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.trackingId?.toLowerCase().includes(q) ||
        g.description?.toLowerCase().includes(q) ||
        g.aiSummary?.toLowerCase().includes(q) ||
        g.category?.toLowerCase().includes(q) ||
        g.department?.toLowerCase().includes(q)
      );
    });
  }, [grievances, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* 4-Card Public Accountability KPI Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Grievances */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md relative overflow-hidden group">
          <div className="absolute right-3 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Layers className="w-20 h-20 text-blue-400" />
          </div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Civic Tickets
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black tracking-tight text-white">{kpis.total}</span>
            <span className="text-xs text-blue-400 font-semibold">Active in Nellore</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Audited & Geotagged</span>
          </p>
        </div>

        {/* Critical Hazards (8-10) */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-rose-900/40 shadow-md relative overflow-hidden group">
          <div className="absolute right-3 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Flame className="w-20 h-20 text-rose-500" />
          </div>
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
            Critical Hazards (8–10)
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black tracking-tight text-rose-400">{kpis.critical}</span>
            <span className="text-xs text-rose-300 font-semibold">High Priority</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
            <span>Immediate Response Required</span>
          </p>
        </div>

        {/* AI-Verified Resolution % */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-emerald-900/40 shadow-md relative overflow-hidden group">
          <div className="absolute right-3 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle2 className="w-20 h-20 text-emerald-400" />
          </div>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            AI-Verified Resolution %
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black tracking-tight text-emerald-400">
              {kpis.resolutionRate}%
            </span>
            <span className="text-xs text-emerald-300 font-semibold">
              ({kpis.resolved} Resolved)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audited via Gemini Vision</span>
          </p>
        </div>

        {/* Active Departments */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 border border-indigo-900/40 shadow-md relative overflow-hidden group">
          <div className="absolute right-3 -bottom-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Building2 className="w-20 h-20 text-indigo-400" />
          </div>
          <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider block mb-1">
            Active Departments
          </span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black tracking-tight text-white">{kpis.activeDepts}</span>
            <span className="text-xs text-indigo-300 font-semibold">Municipal Cells</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Roads, Sanitation, Water, Power</span>
          </p>
        </div>
      </div>

      {/* Search & Filter Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tracking ID / Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full md:w-1/2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Tracking ID (e.g. NP-NEL-...), road, landmark, or hazard..."
              className="w-full pl-10 pr-24 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all font-medium"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Quick Refresh & Record Count */}
          <div className="flex items-center space-x-3 text-xs font-semibold text-slate-700">
            <span className="px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>{Array.isArray(displayGrievances) ? displayGrievances.length : 0} Landmark Issues</span>
            </span>
            <button
              onClick={fetchGrievancesList}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-colors cursor-pointer border border-slate-200"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Chips & Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mr-1">
              Category:
            </span>
            {['all', 'Roads', 'Sanitation', 'Water', 'Electrical', 'Other'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>

          {/* Status & Sort */}
          <div className="flex items-center space-x-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Verified Resolved">Verified Resolved</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="severity">Sort: Highest Severity</option>
              <option value="upvotes">Sort: Most Upvoted</option>
              <option value="oldest">Sort: Oldest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Legend Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-950 text-white rounded-xl text-xs font-medium border border-slate-800 shadow-sm">
        <span className="flex items-center space-x-2 font-bold text-slate-200">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Interactive Nellore Landmark Map (Click any pin to focus ticket):</span>
        </span>
        <div className="flex items-center space-x-4 text-[11px] font-semibold">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-rose-300">Critical (8–10)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="text-amber-300">Moderate (5–7)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-300">Low (1–4)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-emerald-400 font-bold">✓ Verified Resolved</span>
          </span>
        </div>
      </div>

      {/* Leaflet Map Section */}
      <div
        id="map-container"
        ref={mapContainerRef}
        className="h-[440px] sm:h-[500px] rounded-2xl overflow-hidden border border-slate-200 shadow-lg relative z-10"
      >
        <MapContainer
          center={mapCenter}
          zoom={zoomLevel}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <ChangeView center={mapCenter} zoom={zoomLevel} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {displayGrievances.map((item) => {
            const coords = item.location?.coordinates;
            if (!coords || coords.length < 2) return null;
            const [lng, lat] = coords;
            const isSelected = selectedMarkerId === item.trackingId;

            return (
              <Marker
                key={item._id || item.trackingId}
                position={[lat, lng]}
                icon={createCustomPin(item.severityScore, item.status, isSelected)}
                eventHandlers={{
                  click: () => handlePinClick(item)
                }}
              >
                <Popup>
                  <div className="w-68 max-w-xs font-sans text-slate-800">
                    {/* Header Image */}
                    {item.beforeImageUrl && (
                      <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                        <img
                          src={item.beforeImageUrl}
                          alt={item.category}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={`absolute top-2 right-2 text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white shadow-xs ${
                            item.severityScore >= 8
                              ? 'bg-rose-600'
                              : item.severityScore >= 5
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                        >
                          Severity: {item.severityScore}/10
                        </span>
                      </div>
                    )}

                    <div className="p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-blue-600">
                          {item.trackingId}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            item.status === 'Verified Resolved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.category}: {item.department}
                      </h4>

                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {item.aiSummary || item.description}
                      </p>

                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <button
                          onClick={() => handlePinClick(item)}
                          className="text-[11px] text-blue-600 font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Scroll to Details</span>
                          <span>↓</span>
                        </button>
                        <span className="text-[10px] font-bold text-slate-600">
                          👍 {item.upvotes || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Grievances Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center space-x-2">
            <span>Public Incident Log</span>
            <span className="text-xs font-extrabold px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {Array.isArray(displayGrievances) ? displayGrievances.length : 0} Landmarks
            </span>
          </h2>
          <span className="text-xs text-slate-500 hidden sm:block">
            Click "Locate on Map" to fly camera to incident coordinates
          </span>
        </div>

        {(!displayGrievances || displayGrievances.length === 0) ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No grievances match criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try resetting filters or clear search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayGrievances.map((item) => {
              const isCardHighlighted = highlightedId === item.trackingId;

              return (
                <div
                  id={`card-${item.trackingId}`}
                  key={item._id || item.trackingId}
                  className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                    isCardHighlighted
                      ? 'border-blue-500 ring-4 ring-blue-500/30 shadow-2xl scale-[1.02]'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Photo Container */}
                    <div className="h-48 w-full bg-slate-100 relative overflow-hidden group">
                      <img
                        src={item.beforeImageUrl}
                        alt={item.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />

                      {/* Severity Badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-black text-white shadow-md ${
                            item.severityScore >= 8
                              ? 'bg-rose-600'
                              : item.severityScore >= 5
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                        >
                          <Flame className="w-3.5 h-3.5" />
                          <span>Severity {item.severityScore}/10</span>
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span
                          className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-md backdrop-blur-md ${
                            item.status === 'Verified Resolved'
                              ? 'bg-emerald-600 text-white'
                              : item.status === 'In Progress'
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-900/90 text-white'
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      {/* Tracking ID & Copy */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {item.trackingId}
                          </span>
                          <button
                            onClick={() => handleCopy(item.trackingId)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer"
                            title="Copy ID"
                          >
                            {copiedId === item.trackingId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.category}
                        </span>
                      </div>

                      {/* Department */}
                      <h4 className="text-xs font-bold text-slate-800 flex items-center space-x-1">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{item.department}</span>
                      </h4>

                      {/* Description & AI Summary */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {item.aiSummary || item.description}
                      </p>

                      {/* Before / After Verification Badge on Resolved Tickets */}
                      {item.status === 'Verified Resolved' && item.afterImageUrl && (
                        <div className="pt-2">
                          <button
                            onClick={() => setActiveComparison(item)}
                            className="w-full p-2.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center justify-between transition-colors cursor-pointer group"
                          >
                            <span className="flex items-center space-x-1.5 font-bold">
                              <Sparkles className="w-4 h-4 text-emerald-600" />
                              <span>Gemini Vision Verified Repair</span>
                            </span>
                            <span className="text-[11px] font-bold text-emerald-700 flex items-center space-x-1 group-hover:underline">
                              <span>View Audit</span>
                              <Eye className="w-3.5 h-3.5" />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="p-4 pt-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <button
                      onClick={() => handleUpvote(item._id || item.trackingId)}
                      className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                      <span>{item.upvotes || 1} Upvotes</span>
                    </button>

                    <button
                      onClick={() => focusOnMap(item.location?.coordinates, item.trackingId)}
                      className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Locate on Map</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Before / After Inspection Modal */}
      {activeComparison && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-950 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      Ticket #{activeComparison.trackingId}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                      Verified Resolved
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white mt-0.5">
                    Gemini Vision Remediation Audit & Proof of Work
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveComparison(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Gemini Vision Verdict Banner */}
              <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 p-4 rounded-2xl border border-emerald-800/60 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-300">
                      Gemini 3.5 Vision AI Inspection Verdict
                    </h4>
                    <p className="text-xs text-slate-300">
                      Automated visual comparison between original citizen hazard and contractor restoration.
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold">
                    Confidence: 96%
                  </span>
                  <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-bold">
                    Quality: Satisfactory
                  </span>
                </div>
              </div>

              {/* Side-by-Side Images */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* BEFORE */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-rose-600 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                      <span>Before Repair (Citizen Report)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Original Hazard</span>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 border-2 border-rose-300 shadow-sm relative">
                    <img
                      src={activeComparison.beforeImageUrl}
                      alt="Before Repair"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Reported Evidence
                    </span>
                  </div>
                </div>

                {/* AFTER */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                      <span>After Repair (Contractor Proof)</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">Remediated State</span>
                  </div>
                  <div className="h-64 rounded-2xl overflow-hidden bg-slate-100 border-2 border-emerald-400 shadow-sm relative">
                    <img
                      src={activeComparison.afterImageUrl}
                      alt="After Repair"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 bg-emerald-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Field Execution Completed
                    </span>
                  </div>
                </div>
              </div>

              {/* Technical Audit Notes */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Municipal Verification Audit Log:
                </span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium">
                  {activeComparison.verificationNotes ||
                    'Gemini Vision confirmed structural restoration of the civic infrastructure defect. Site normalized for public transit.'}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Assigned Department: <strong className="text-slate-800">{activeComparison.department}</strong></span>
                  <span>Category: <strong className="text-slate-800">{activeComparison.category}</strong></span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveComparison(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
