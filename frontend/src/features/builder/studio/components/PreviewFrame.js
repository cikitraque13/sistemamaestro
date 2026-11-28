import React from 'react';

export default function PreviewFrame({ frameRef, children, strip = null }) {
  return (
    <div ref={frameRef} data-testid="builder-preview-frame" className="frame">
      <div className="frame-page">{children}</div>
      {strip}
    </div>
  );
}
