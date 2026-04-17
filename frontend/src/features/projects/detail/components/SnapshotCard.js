import React from 'react';

const SnapshotCard = ({ eyebrow, value, accent = 'default' }) => {
  const accentMap = {
    teal: 'border-[#0F5257]/20 bg-[#0F5257]/8 text-[#8DE1D0]',
    amber: 'border-amber-500/20 bg-amber-500/8 text-amber-300',
    violet: 'border-fuchsia-500/20 bg-fuchsia-500/8 text-fuchsia-300',
    default: 'border-white/5 bg-[#0A0A0A] text-white'
  };

  const accentClass = accentMap[accent] || accentMap.default;

  return (
    <div className={`rounded-xl border p-5 ${accentClass}`}>
      <p className="text-[11px] uppercase tracking-wide mb-2 opacity-80">{eyebrow}</p>
      <p className="text-white font-medium leading-relaxed">{value}</p>
    </div>
  );
};

export default SnapshotCard;
