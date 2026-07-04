import React from 'react';

const Badge = ({ variant = 'low', children, className = '' }) => {
  const styles = {
    // Severities
    critical: 'bg-severity-critical/15 text-severity-critical border-severity-critical/35 shadow-glow-critical',
    high: 'bg-severity-high/15 text-severity-high border-severity-high/35 shadow-glow-high',
    medium: 'bg-severity-medium/15 text-severity-medium border-severity-medium/35',
    low: 'bg-severity-low/15 text-severity-low border-severity-low/35',
    
    // Statuses
    new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    in_review: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    escalated: 'bg-red-500/15 text-red-400 border-red-500/30',
    closed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    
    open: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    investigating: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    resolved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  };

  const selectedStyle = styles[variant.toLowerCase()] || styles.low;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${selectedStyle} ${className}`}>
      {children || variant.toUpperCase()}
    </span>
  );
};

export default Badge;
