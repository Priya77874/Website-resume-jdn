import React, { useRef, useEffect } from 'react';

interface EditableProps {
  value: string;
  onChange: (value: string) => void;
  tagName?: string;
  className?: string;
  disabled?: boolean;
  onEnter?: () => void;
  style?: React.CSSProperties;
}

export const Editable: React.FC<EditableProps> = ({ 
  value, 
  onChange, 
  tagName = 'div', 
  className = '', 
  disabled = false,
  onEnter,
  style
}) => {
  const contentRef = useRef<HTMLElement>(null);

  // Sync value to innerHTML only when not focused or initially
  useEffect(() => {
    if (contentRef.current && contentRef.current.innerHTML !== value && document.activeElement !== contentRef.current) {
      contentRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (contentRef.current) {
      onChange(contentRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (onEnter) {
        e.preventDefault();
        onEnter();
      } else if (tagName === 'span' || tagName === 'h1' || tagName === 'h2') {
         // Prevent new lines in inline-like elements
         e.preventDefault();
      }
    }
  };

  // Fixed: Cast to React.ElementType to resolve "Cannot find namespace JSX" and ensure valid JSX element type
  const Tag = tagName as React.ElementType;

  return (
    <Tag
      ref={contentRef}
      className={`${className} ${!disabled ? 'cursor-text hover:bg-orange-50/50 outline-none focus:ring-2 focus:ring-orange-300/50 rounded px-0.5 min-w-[10px]' : 'cursor-default'}`}
      contentEditable={!disabled}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning={true}
      style={{ 
        ...style,
        userSelect: disabled ? 'none' : 'text',
        display: tagName === 'span' ? 'inline-block' : 'block'
      }}
    />
  );
};