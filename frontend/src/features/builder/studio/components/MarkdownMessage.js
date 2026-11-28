import React from 'react';

function inlineNodes(text, keyPrefix) {
  const parts = String(text || '').split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter((part) => part !== '');
  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code key={key} className="rounded bg-[#1e1e20] px-1.5 py-0.5 font-mono text-[12px] text-[#f2f2f2]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return <strong key={key} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={key}>{part}</span>;
  });
}

export default function MarkdownMessage({ text = '' }) {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^#{1,3}\s/.test(line.trim())) {
      blocks.push({ type: 'h', text: line.trim().replace(/^#{1,3}\s/, '') });
      index += 1;
      continue;
    }
    if (/^\d+\.\s/.test(line.trim())) {
      const items = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s/, ''));
        index += 1;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }
    if (/^[-*]\s/.test(line.trim())) {
      const items = [];
      while (index < lines.length && /^[-*]\s/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s/, ''));
        index += 1;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }
    blocks.push({ type: 'p', text: line });
    index += 1;
  }

  return (
    <div className="min-w-0 text-sm leading-6 text-[#f2f2f2]">
      {blocks.map((block, blockIndex) => {
        if (block.type === 'h') {
          return <p key={blockIndex} className="font-semibold text-white">{inlineNodes(block.text, String(blockIndex))}</p>;
        }
        if (block.type === 'ol') {
          return (
            <ol key={blockIndex} className="list-decimal space-y-1 pl-5">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item, `${blockIndex}-${itemIndex}`)}</li>)}
            </ol>
          );
        }
        if (block.type === 'ul') {
          return (
            <ul key={blockIndex} className="list-disc space-y-1 pl-5">
              {block.items.map((item, itemIndex) => <li key={itemIndex}>{inlineNodes(item, `${blockIndex}-${itemIndex}`)}</li>)}
            </ul>
          );
        }
        return <p key={blockIndex}>{inlineNodes(block.text, String(blockIndex))}</p>;
      })}
    </div>
  );
}
