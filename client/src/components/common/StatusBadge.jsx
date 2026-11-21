import React from 'react';
import { getStatusConfig, getSeverityConfig, getCategoryConfig } from '../../utils/formatters';

export const StatusBadge = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export const SeverityBadge = ({ score }) => {
  const config = getSeverityConfig(score);
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold border ${config.bg} ${config.text} ${config.border}`}
      title={`Severity Score: ${score}/10`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {score}/10
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const config = getCategoryConfig(category);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {category}
    </span>
  );
};

export default StatusBadge;
