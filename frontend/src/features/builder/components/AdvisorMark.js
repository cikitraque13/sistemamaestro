import React from 'react';

export default function AdvisorMark() {
  return (
    <svg className="advisor-mark" data-testid="builder-advisor-mark" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#17403a" />
      <path d="M8 14.5c0-5 3.4-8.2 8-8.2s8 3.2 8 8.2v1.2c0 1.2-2.2 2-4.2 2.4-.4 2.2-1.8 3.6-3.8 3.6s-3.4-1.4-3.8-3.6C10.2 17.7 8 16.9 8 15.7v-1.2z" fill="#2ee6c8" />
      <path d="M11.2 13.2c.2 1.6 1.2 2.6 2.6 2.6M18.2 15.8c1.4 0 2.4-1 2.6-2.6" fill="none" stroke="#17403a" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="13.2" cy="13.4" r="1" fill="#102824" />
      <circle cx="18.8" cy="13.4" r="1" fill="#102824" />
      <path d="M14.2 17.2c.5.6 1.2.9 1.8.9s1.3-.3 1.8-.9" fill="none" stroke="#102824" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M22.6 8.2l1.2-1.6M24.4 10.2l1.8-.2" fill="none" stroke="#7af0dc" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
