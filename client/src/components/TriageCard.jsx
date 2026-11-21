import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Building2,
  Copy,
  Check,
  Zap,
  MapPin,
  ExternalLink,
  Flame,
  ThumbsUp,
  Volume2
} from 'lucide-react';

export default function TriageCard({ grievance, isDuplicate = false, message = '', onReset, onViewMap }) {
  const [copied, setCopied] = useState(false);

  if (!grievance) return null;

  const {
    trackingId,
    category,
    severityScore = 5,
    department,
    aiSummary,
    isVerifiedAuthentic,
    beforeImageUrl,
    audioUrl,
    location,
    upvotes,
    status,
    aiModelUsed
  } = grievance;

  const handleCopyId = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Severity styling
  const getSeverityBadge = (score) => {
    if (score >= 8) {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        bar: 'bg-rose-600',
        label: 'CRITICAL HAZARD'
      };
    }
    if (score >= 5) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        bar: 'bg-amber-500',
        label: 'MODERATE PRIORITY'
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      bar: 'bg-emerald-500',
      label: 'LOW PRIORITY'
    };
  };

  const severityStyle = getSeverityBadge(severityScore);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Top Banner for Duplicate or Success */}
      {isDuplicate ? (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
          <div className="flex items-center space-x-2">
            <ThumbsUp className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Nearby Duplicate Detected (Within 50m)</h4>
              <p className="text-xs text-amber-100">{message || 'We automatically added your upvote to the existing open ticket.'}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <h4 className="font-bold text-sm tracking-wide flex items-center space-x-2">
                <span>Gemini Flash Triage Complete</span>
                {aiModelUsed && (
                  <span className="text-[10px] font-mono bg-white/20 px-2 py-0.5 rounded-full font-normal">
                    {aiModelUsed}
                  </span>
                )}
              </h4>
            </div>
            <span className="text-[11px] font-semibold bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full">
              Status: {status}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Tracking ID Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs uppercase font-medium text-slate-400">Tracking Reference ID</span>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-lg font-mono font-bold text-slate-900">{trackingId}</span>
              <button
                onClick={handleCopyId}
                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
                title="Copy Tracking ID"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isVerifiedAuthentic ? (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verified Authentic Hazard</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Suspect Content Flagged</span>
              </span>
            )}
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <ThumbsUp className="w-3 h-3 text-blue-600" />
              <span>{upvotes || 1} upvotes</span>
            </span>
          </div>
        </div>

        {/* Severity Score Meter */}
        <div className={`p-4 rounded-xl border ${severityStyle.bg} space-y-2`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="flex items-center space-x-1.5">
              <Flame className="w-4 h-4" />
              <span>Severity Assessment: {severityStyle.label}</span>
            </span>
            <span className="text-base font-bold font-mono">{severityScore}/10</span>
          </div>
          <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${severityStyle.bar}`}
              style={{ width: `${(severityScore / 10) * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
            <span>1 (Minor / Cosmetic)</span>
            <span>5 (Moderate Hazard)</span>
            <span>10 (Emergency Hazard)</span>
          </div>
        </div>

        {/* Category & Department Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Category</span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{category}</p>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Building2 className="w-3 h-3" />
              <span>Assigned Department</span>
            </span>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{department}</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center space-x-1.5 mb-1">
            <Zap className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Executive Summary</span>
          </span>
          <p className="text-sm text-slate-700 leading-relaxed">
            {aiSummary || 'Automated triage completed based on visual and sensor context.'}
          </p>
        </div>

        {/* Image & Audio Media Preview */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          {beforeImageUrl && (
            <div className="w-full sm:w-1/2">
              <span className="text-xs font-medium text-slate-500 mb-1 block">Logged Evidence Photo:</span>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                <img
                  src={beforeImageUrl}
                  alt="Hazard evidence"
                  className="w-full h-44 object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            </div>
          )}

          <div className="w-full sm:w-1/2 space-y-3">
            {location?.coordinates && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-800 flex items-center space-x-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Geospatial Coordinates:</span>
                </span>
                <p className="font-mono text-[11px]">
                  Lat: {location.coordinates[1]?.toFixed(5)}, Lng: {location.coordinates[0]?.toFixed(5)}
                </p>
              </div>
            )}

            {audioUrl && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-800 flex items-center space-x-1 mb-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Citizen Voice Note:</span>
                </span>
                <audio controls src={audioUrl} className="w-full h-8" />
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <button
            onClick={onReset}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Submit Another Report
          </button>
          <button
            onClick={onViewMap}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs shadow-blue-500/20 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Track on Public Map</span>
          </button>
        </div>
      </div>
    </div>
  );
}
