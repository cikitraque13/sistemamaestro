import React from 'react';

export default function StepBar({ steps = [] }) {
  return (
    <ol data-testid="builder-step-bar" className="flex gap-2 overflow-x-auto px-4 py-2 text-[11px] text-[#9a9a9a]">
      {steps.map((step) => (
        <li
          key={step.id}
          data-current={step.current ? 'true' : 'false'}
          data-done={step.done ? 'true' : 'false'}
          className={`shrink-0 rounded-full px-2 py-1 ${step.current ? 'text-[#f2f2f2] ring-1 ring-teal-400' : ''} ${step.pending ? 'text-[#9a9a9a]' : ''}`}
        >
          {step.label}{step.done ? ' ✓' : ''}
        </li>
      ))}
    </ol>
  );
}
