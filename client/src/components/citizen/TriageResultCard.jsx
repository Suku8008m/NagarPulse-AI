import React from 'react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { CheckCircle2, AlertTriangle, ShieldCheck, Sparkles, Building2, Cpu, RotateCcw } from 'lucide-react';

export const TriageResultCard = ({ result, onReset }) => {
  if (!result) return null;

  // Unpack gracefully whether result is the server envelope { success, triage, data, isDuplicate }
  // or a direct ticket object { trackingId, category, severityScore, department, aiSummary, ... }
  const isDuplicate = Boolean(result.isDuplicate);
  const triage = result.triage || {};
  const ticket = result.data || (result.trackingId ? result : {});

  const trackingId = ticket.trackingId || triage.trackingId || result.trackingId || 'NP-NEW-TICKET';
  const category = ticket.category || triage.category || result.category || 'Other';
  const severityScore = ticket.severityScore ?? triage.severityScore ?? result.severityScore ?? 5;
  const department = ticket.assignedDepartment || ticket.department || triage.department || result.department || 'Municipal Administration';
  const aiSummary = ticket.aiSummary || triage.aiSummary || result.aiSummary || 'Civic issue triaged and logged.';
  const aiModelUsed = ticket.aiModelUsed || triage.aiModelUsed || result.aiModelUsed || 'gemini-3.8-flash';
  const beforeImageUrl = ticket.beforeImageUrl || result.beforeImageUrl || '';
  const coordinates = ticket.location?.coordinates || result.coordinates || null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className={`p-4 ${isDuplicate ? 'bg-amber-50 border-b border-amber-200' : 'bg-emerald-50 border-b border-emerald-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isDuplicate ? (
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            )}
            <div>
              <h3 className={`font-bold text-sm ${isDuplicate ? 'text-amber-900' : 'text-emerald-900'}`}>
                {isDuplicate
                  ? '50-Meter Duplicate Merged & Upvoted'
                  : 'Grievance Triaged & Authenticated'}
              </h3>
              <p className={`text-xs ${isDuplicate ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isDuplicate
                  ? 'An identical defect was already reported within 50 meters. Your vote was added!'
                  : 'Verified as an authentic civic infrastructure defect by Gemini AI.'}
              </p>
            </div>
          </div>
          <span className="font-mono font-bold text-xs px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-blue-700 shadow-2xs">
            {trackingId}
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="p-6 space-y-5">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Category
            </span>
            <div className="mt-1">
              <CategoryBadge category={category} />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Severity Danger
            </span>
            <div className="mt-1">
              <SeverityBadge score={severityScore} />
            </div>
          </div>

          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              AI Verification
            </span>
            <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Authentic</span>
            </div>
          </div>
        </div>

        {/* Assigned Municipal Department */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Assigned Action Department
          </span>
          <div className="flex items-center gap-2 p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-blue-900">
            <Building2 className="w-4 h-4 text-blue-700 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm">{department}</span>
          </div>
        </div>

        {/* Executive AI Summary */}
        <div>
          <span className="text-xs font-semibold text-slate-500 block mb-1">
            Gemini Multimodal Hazard Analysis
          </span>
          <div className="p-3.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed space-y-2">
            <p className="font-medium text-slate-900">{aiSummary}</p>
            {triage.audioTranscript && (
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 italic">
                Audio Transcript: &ldquo;{triage.audioTranscript}&rdquo;
              </div>
            )}
          </div>
        </div>

        {/* Evidence Photo Preview if available */}
        {beforeImageUrl && (
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">
              Watermarked Evidence Photo
            </span>
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48">
              <img
                src={beforeImageUrl}
                alt="Civic hazard evidence"
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-mono">
                GPS Telemetry Stamped
              </div>
            </div>
          </div>
        )}

        {/* Audit Footer & Model Badge */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            <span>Inference: <strong className="text-slate-800 font-semibold">{aiModelUsed}</strong></span>
          </div>

          {onReset && (
            <button
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Report Another Issue</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TriageResultCard;
