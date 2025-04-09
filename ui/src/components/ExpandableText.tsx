import React, { useState, useRef } from 'react';

interface Props {
  text: string;
  maxLength?: number;
}

function ExpandableText({ text, maxLength = 35 }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!shouldTruncate) {
    return <span>{text}</span>;
  }

  if (isExpanded) {
    return (
      <textarea
        onBlur={() => setIsExpanded(false)}
        readOnly
        value={text}
        className="w-full text-xs resize-none bg-gray-50"
        rows={Math.min(Math.ceil(text.length / 50), 10)}
        ref={textareaRef}
      />
    );
  }

  return (
    <span onClick={() => {
      setIsExpanded(true);

      setTimeout(() => {
        console.log(textareaRef.current);
        // focus the textarea using ref
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 500);
    }} className="cursor-pointer">
      {text.slice(0, maxLength)}... <span className="text-blue-600">(read more)</span>
    </span>
  );
}

export default ExpandableText; 