import React from 'react';

interface FormattedExplanationProps {
  explanation: string;
  correctAnswer: string;
  className?: string;
}

export const FormattedExplanation: React.FC<FormattedExplanationProps> = ({
  explanation,
  correctAnswer,
  className = ''
}) => {
  if (!explanation) return null;

  // Regex to match **bold**, <mark>...</mark>, <span>...</span> or [EXACT ANSWER]
  const highlightRegex = /(\*\*[^*]+\*\*|<mark>.*?<\/mark>|<span[^>]*>.*?<\/span>|\[EXACT ANSWER[^\]]*\])/gi;

  const parts = explanation.split(highlightRegex);

  const renderSegment = (segment: string, key: number) => {
    // Check if segment matches **bold**
    if (segment.startsWith('**') && segment.endsWith('**') && segment.length > 4) {
      const cleanText = segment.slice(2, -2);
      return (
        <span
          key={key}
          className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-block my-0.5 shadow-sm"
        >
          {cleanText}
        </span>
      );
    }

    // Check if segment matches <mark>...</mark>
    if (/^<mark>/i.test(segment) && /<\/mark>$/i.test(segment)) {
      const cleanText = segment.replace(/^<mark>/i, '').replace(/<\/mark>$/i, '');
      return (
        <span
          key={key}
          className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-block my-0.5 shadow-sm"
        >
          {cleanText}
        </span>
      );
    }

    // Check if segment matches <span...>...</span>
    if (/^<span/i.test(segment) && /<\/span>$/i.test(segment)) {
      const cleanText = segment.replace(/^<span[^>]*>/i, '').replace(/<\/span>$/i, '');
      return (
        <span
          key={key}
          className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-block my-0.5 shadow-sm"
        >
          {cleanText}
        </span>
      );
    }

    // Check if segment matches [EXACT ANSWER...]
    if (/^\[EXACT ANSWER/i.test(segment) && segment.endsWith(']')) {
      const cleanText = segment.slice(1, -1);
      return (
        <span
          key={key}
          className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-block my-0.5 shadow-sm"
        >
          {cleanText}
        </span>
      );
    }

    // If no bold/mark tags were present in this segment, check if correctAnswer occurs inside segment
    if (correctAnswer && correctAnswer.trim().length > 1) {
      const trimmedTarget = correctAnswer.trim();
      const lowerSegment = segment.toLowerCase();
      const lowerTarget = trimmedTarget.toLowerCase();
      const targetIdx = lowerSegment.indexOf(lowerTarget);

      if (targetIdx !== -1) {
        const before = segment.slice(0, targetIdx);
        const matchText = segment.slice(targetIdx, targetIdx + trimmedTarget.length);
        const after = segment.slice(targetIdx + trimmedTarget.length);

        return (
          <React.Fragment key={key}>
            {before}
            <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg border border-emerald-500/40 inline-block my-0.5 shadow-sm">
              {matchText}
            </span>
            {renderSegment(after, key + 1000)}
          </React.Fragment>
        );
      }
    }

    return <span key={key}>{segment}</span>;
  };

  return (
    <div className={`leading-relaxed text-slate-300 ${className}`}>
      {parts.map((part, idx) => renderSegment(part, idx))}
    </div>
  );
};
