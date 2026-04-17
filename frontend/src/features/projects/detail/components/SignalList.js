import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';

const SignalList = ({ title, items }) => (
  <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/5">
    <p className="text-sm text-[#A3A3A3] mb-3">{title}</p>

    {items.length > 0 ? (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li
            key={`${title}-${index}-${String(item).substring(0, 24)}`}
            className="text-white text-sm flex items-start gap-2"
          >
            <CheckCircle size={14} className="text-[#0F5257] mt-1 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-[#A3A3A3] text-sm">Sin datos.</p>
    )}
  </div>
);

export default SignalList;
