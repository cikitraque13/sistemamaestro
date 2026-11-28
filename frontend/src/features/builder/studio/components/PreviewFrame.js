import React from 'react';

export default function PreviewFrame({ frameRef, children, strip = null }) {
  return (
    <div
      ref={frameRef}
      data-testid="builder-preview-frame"
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] outline outline-1 outline-[#2a2a2d]"
    >
      <div className="min-h-0 flex-1 overflow-auto bg-white">{children}</div>
      {strip}
    </div>
  );
}
