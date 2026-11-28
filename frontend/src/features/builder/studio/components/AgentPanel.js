import React, { useRef } from 'react';

import '../studio.css';
import Composer from './Composer';
import GemNotice from './GemNotice';
import MessageList from './MessageList';
import StepBar from './StepBar';

export default function AgentPanel({
  log,
  steps,
  phase,
  message,
  slow,
  preview,
  reactions,
  suggestionDisabled,
  onSuggest,
  onReact,
  onCopy,
  stepItems,
  notice,
  onDismissNotice,
  draft,
  pace,
  canSend,
  attachmentNote,
  micNote,
  onDraft,
  onPace,
  onSubmit,
  onAttach,
  onMic,
}) {
  const threadRef = useRef(null);
  return (
    <aside data-testid="builder-side-panel" aria-label="Ejecutor" className="studio-left">
      <MessageList
        threadRef={threadRef}
        log={log}
        steps={steps}
        phase={phase}
        message={message}
        slow={slow}
        preview={preview}
        reactions={reactions}
        onSuggest={suggestionDisabled ? undefined : onSuggest}
        onReact={onReact}
        onCopy={onCopy}
      />
      <StepBar steps={stepItems} />
      {notice ? <GemNotice tone={notice.tone} text={notice.text} onDismiss={onDismissNotice} /> : null}
      <Composer
        draft={draft}
        pace={pace}
        canSend={canSend}
        attachmentNote={attachmentNote}
        micNote={micNote}
        onDraft={onDraft}
        onPace={onPace}
        onSubmit={onSubmit}
        onAttach={onAttach}
        onMic={onMic}
      />
    </aside>
  );
}
