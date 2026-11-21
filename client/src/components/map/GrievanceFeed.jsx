import React, { useState } from 'react';
import { StatusBadge, SeverityBadge, CategoryBadge } from '../common/StatusBadge';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { Search, ThumbsUp, MapPin, Zap, Construction, Trash2, Droplets, Building2 } from 'lucide-react';

const CategoryThumbnail = ({ category }) => {
  const cat = category || 'Other';
  if (cat === 'Electrical') {
    return (
      <div className="w-16 h-16 rounded-lg bg-amber-50 border border-amber-200 flex flex-col items-center justify-center shrink-0 text-amber-600 gap-1 shadow-2xs">
        <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">Power</span>
      </div>
    );
  }
  if (cat === 'Roads') {
    return (
      <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-300 flex flex-col items-center justify-center shrink-0 text-slate-700 gap-1 shadow-2xs">
        <Construction className="w-5 h-5 text-slate-600" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-700">Road</span>
      </div>
    );
  }
  if (cat === 'Sanitation') {
    return (
      <div className="w-16 h-16 rounded-lg bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0 text-emerald-600 gap-1 shadow-2xs">
        <Trash2 className="w-5 h-5 text-emerald-600" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Waste</span>
      </div>
    );
  }
  if (cat === 'Water') {
    return (
      <div className="w-16 h-16 rounded-lg bg-blue-50 border border-blue-200 flex flex-col items-center justify-center shrink-0 text-blue-600 gap-1 shadow-2xs">
        <Droplets className="w-5 h-5 text-blue-600 fill-blue-600/20" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-blue-700">Water</span>
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-lg bg-purple-50 border border-purple-200 flex flex-col items-center justify-center shrink-0 text-purple-600 gap-1 shadow-2xs">
      <Building2 className="w-5 h-5 text-purple-600" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700">Civic</span>
    </div>
  );
};

const GrievanceFeedImage = ({ g }) => {
  const [hasError, setHasError] = useState(false);
  const photoUrl = g.beforeImageUrl || g.imageUrl;

  if (!photoUrl || hasError) {
    return <CategoryThumbnail category={g.category} />;
  }

  return (
    <div className="w-16 h-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative shadow-2xs">
      <img
        src={photoUrl}
        alt={g.category || 'Hazard'}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export const GrievanceFeed = ({
  grievances = [],
  selectedGrievance,
  selectedId,
  onSelectGrievance,
  onUpvote,
  filters,
  onFilterChange,
  isLoading = false
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState('all');

  const categories = ['all', 'Roads', 'Sanitation', 'Water', 'Electrical'];

  const activeCategory = filters?.category !== undefined ? filters.category : localCategory;
  const activeSearch = filters?.search !== undefined ? filters.search : localSearch;

  const handleCategoryClick = (cat) => {
    if (onFilterChange) {
      onFilterChange({ category: cat });
    } else {
      setLocalCategory(cat);
    }
  };

  const handleSearchChange = (val) => {
    if (onFilterChange) {
      onFilterChange({ search: val });
    } else {
      setLocalSearch(val);
    }
  };

  // Filter items
  const filteredGrievances = (Array.isArray(grievances) ? grievances : []).filter((g) => {
    const matchesCat = activeCategory === 'all' || g.category === activeCategory;
    const matchesSearch =
      !activeSearch ||
      g.trackingId?.toLowerCase().includes(activeSearch.toLowerCase()) ||
      g.category?.toLowerCase().includes(activeSearch.toLowerCase()) ||
      g.locationName?.toLowerCase().includes(activeSearch.toLowerCase()) ||
      g.description?.toLowerCase().includes(activeSearch.toLowerCase()) ||
      g.aiSummary?.toLowerCase().includes(activeSearch.toLowerCase());

    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Search & Filter Header */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search tracking ID, hazard, street..."
            value={activeSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  isActive
                    ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat === 'all' ? 'All Divisions' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading live grievances...
          </div>
        ) : filteredGrievances.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No grievances match the active filter criteria.
          </div>
        ) : (
          filteredGrievances.map((g) => {
            const currentSelectedId = selectedId || selectedGrievance?._id;
            const isSelected = currentSelectedId === g._id;
            const photoUrl = g.imageUrl || g.beforeImageUrl;

            return (
              <div
                key={g._id || g.trackingId}
                onClick={() => onSelectGrievance && onSelectGrievance(g)}
                className={`p-3 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-400/20 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-xs text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                      {g.trackingId || 'NP-2026-REF'}
                    </span>
                    <CategoryBadge category={g.category} />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <SeverityBadge score={g.severityScore} />
                    <StatusBadge status={g.status} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <GrievanceFeedImage g={g} />

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-medium">
                      {g.aiSummary || g.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1 truncate min-w-0 flex-1 font-sans text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{g.locationName || 'Nellore, AP'}</span>
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="shrink-0">{formatRelativeTime(g.createdAt)}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onUpvote) onUpvote(g._id);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 font-semibold transition-colors cursor-pointer shrink-0"
                          title="Upvote verified civic issue"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>{g.upvotes || 1}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default GrievanceFeed;
