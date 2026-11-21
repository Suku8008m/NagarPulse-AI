/**
 * Format ISO date string into readable civic timestamp
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

/**
 * Format relative time (e.g. "2 hours ago")
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(dateString);
};

/**
 * Severity styling configuration (1-10)
 */
export const getSeverityConfig = (score) => {
  const num = Number(score) || 5;
  if (num >= 8) {
    return {
      label: 'High Danger',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-600',
      badge: 'bg-red-100 text-red-800 border-red-300'
    };
  }
  if (num >= 5) {
    return {
      label: 'Moderate',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      badge: 'bg-amber-100 text-amber-800 border-amber-300'
    };
  }
  return {
    label: 'Low Priority',
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-700 border-slate-300'
  };
};

/**
 * Status badge styling
 */
export const getStatusConfig = (status) => {
  switch (status) {
    case 'Verified Resolved':
      return {
        label: 'Verified Resolved',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        dot: 'bg-emerald-600'
      };
    case 'In Progress':
      return {
        label: 'In Progress',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-600 animate-pulse'
      };
    case 'Pending':
    default:
      return {
        label: 'Pending Triage',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        dot: 'bg-amber-500'
      };
  }
};

/**
 * Category icons and badge classes
 */
export const getCategoryConfig = (category) => {
  switch (category) {
    case 'Roads':
      return {
        name: 'Roads & Pavement',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-300',
        pinColor: '#475569'
      };
    case 'Sanitation':
      return {
        name: 'Sanitation & Waste',
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        border: 'border-amber-300',
        pinColor: '#D97706'
      };
    case 'Water':
      return {
        name: 'Water & Drainage',
        bg: 'bg-sky-100',
        text: 'text-sky-800',
        border: 'border-sky-300',
        pinColor: '#0284C7'
      };
    case 'Electrical':
      return {
        name: 'Electrical & Power',
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-300',
        pinColor: '#DC2626'
      };
    default:
      return {
        name: category || 'General Civic',
        bg: 'bg-slate-100',
        text: 'text-slate-800',
        border: 'border-slate-200',
        pinColor: '#64748B'
      };
  }
};
