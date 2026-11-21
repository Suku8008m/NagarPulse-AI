import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { StatusBadge, SeverityBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/formatters';
import { ThumbsUp, Eye, MapPin } from 'lucide-react';

// Create custom colored civic marker icon
const createCivicPinIcon = (category, severityScore, status) => {
  let bgColor = '#475569'; // Roads
  if (category === 'Sanitation') bgColor = '#D97706';
  if (category === 'Water') bgColor = '#0284C7';
  if (category === 'Electrical') bgColor = '#DC2626';

  const isResolved = status === 'Verified Resolved';
  const strokeColor = isResolved ? '#059669' : '#FFFFFF';

  const html = `
    <div style="
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background-color: ${bgColor};
      border: 2px solid ${strokeColor};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.25);
    ">
      <div style="
        transform: rotate(45deg);
        color: white;
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 700;
      ">
        ${severityScore || '•'}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-civic-pin',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const NELLORE_CENTER = [14.4426, 79.9865];

// Component to smoothly pan the map to selected ticket or Nellore default
const MapCenterController = ({ selectedCoords }) => {
  const map = useMap();

  // Enforce Nellore default center on initial mount
  useEffect(() => {
    map.setView(NELLORE_CENTER, 13);
  }, [map]);

  useEffect(() => {
    if (selectedCoords && selectedCoords[0] && selectedCoords[1]) {
      // GeoJSON is [longitude, latitude], Leaflet expects [latitude, longitude]
      const lat = selectedCoords[1];
      const lng = selectedCoords[0];
      map.setView([lat, lng], 15, {
        animate: true,
        duration: 0.8
      });
    }
  }, [selectedCoords, map]);
  return null;
};

export const NelloreMap = ({ grievances = [], selectedGrievance, onSelectGrievance, onUpvote }) => {
  const center = NELLORE_CENTER;

  const selectedCoords = selectedGrievance?.location?.coordinates;

  return (
    <div className="w-full h-full min-h-[460px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 relative shadow-xs">
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[460px]"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapCenterController selectedCoords={selectedCoords} />

        {(Array.isArray(grievances) ? grievances : []).map((g) => {
          if (!g.location?.coordinates || g.location.coordinates.length < 2) return null;
          const [lng, lat] = g.location.coordinates;
          if (isNaN(lat) || isNaN(lng)) return null;

          const isSelected = selectedGrievance?._id === g._id;
          const pinIcon = createCivicPinIcon(g.category, g.severityScore, g.status);

          return (
            <Marker
              key={g._id || g.trackingId}
              position={[lat, lng]}
              icon={pinIcon}
              eventHandlers={{
                click: () => onSelectGrievance && onSelectGrievance(g)
              }}
            >
              <Popup className="civic-popup">
                <div className="p-3 max-w-[270px] space-y-2 text-slate-900">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {g.trackingId}
                    </span>
                    <SeverityBadge score={g.severityScore} />
                  </div>

                  {(g.imageUrl || g.beforeImageUrl) && (
                    <div className="w-full h-28 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative">
                      <img
                        src={g.imageUrl || g.beforeImageUrl}
                        alt="Civic Issue"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-1 left-1">
                        <StatusBadge status={g.status} />
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {g.category} • {g.department}
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {g.aiSummary || g.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
                    <span>{formatDate(g.createdAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onUpvote) onUpvote(g._id);
                      }}
                      className="inline-flex items-center gap-1 text-slate-700 hover:text-blue-700 font-semibold px-2 py-0.5 rounded bg-slate-50 hover:bg-blue-50 border border-slate-200 cursor-pointer transition-colors"
                    >
                      <ThumbsUp className="w-3 h-3" />
                      <span>{g.upvotes || 1}</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs p-2.5 rounded-xl border border-slate-200 shadow-md text-xs font-medium space-y-1.5 hidden sm:block">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Civic Categories
        </span>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
            Roads
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
            Sanitation
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 inline-block" />
            Water
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" />
            Electrical
          </span>
        </div>
      </div>
    </div>
  );
};

export default NelloreMap;
