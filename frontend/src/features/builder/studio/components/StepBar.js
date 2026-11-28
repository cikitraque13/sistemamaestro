import React, { useEffect, useRef, useState } from 'react';

import { fitStepLabels } from '../model';

function Check() {
  return (
    <svg viewBox="0 0 8 8" width="7" height="7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1.6 4.2 3.3 5.8 6.4 2.3" />
    </svg>
  );
}

export default function StepBar({ steps = [] }) {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const read = () => setWidth(node.clientWidth || 0);
    read();
    if (typeof ResizeObserver !== 'function') return undefined;
    const observer = new ResizeObserver(read);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fit = fitStepLabels(steps, width);

  return (
    <ol
      ref={ref}
      data-testid="builder-step-bar"
      aria-label="Pasos hasta tu web"
      className="steps"
      style={{ fontSize: `${fit.font}px` }}
    >
      {steps.map((step) => {
        const state = step.done ? 'ok' : step.current ? 'now' : 'off';
        return (
          <li key={step.id} data-current={step.current ? 'true' : 'false'} data-done={step.done ? 'true' : 'false'} className={`st ${state}`}>
            <i>{step.done ? <Check /> : null}</i>
            <span className="lab">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
