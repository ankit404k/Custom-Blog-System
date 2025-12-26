import React, { useEffect, useRef, useState } from 'react';

const PostEditor = ({ value, onChange, placeholder = 'Write your post content...' }) => {
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize with simple WYSIWYG editor
    if (editorRef.current && !isInitialized) {
      editorRef.current.innerHTML = value || '';
      setIsInitialized(true);
    }
  }, [value, isInitialized]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const getWordCount = () => {
    if (!value) return 0;
    const text = value.replace(/<[^>]*>/g, '');
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    if (!value) return 0;
    return value.replace(/<[^>]*>/g, '').length;
  };

  const ToolbarButton = ({ command, label, icon }) => (
    <button
      type="button"
      onClick={() => execCommand(command)}
      className="p-2 hover:bg-gray-200 rounded transition-colors"
      title={label}
    >
      {icon}
    </button>
  );

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1">
        <ToolbarButton
          command="bold"
          label="Bold"
          icon={<span className="font-bold">B</span>}
        />
        <ToolbarButton
          command="italic"
          label="Italic"
          icon={<span className="italic">I</span>}
        />
        <ToolbarButton
          command="underline"
          label="Underline"
          icon={<span className="underline">U</span>}
        />
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          command="insertUnorderedList"
          label="Bullet List"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          }
        />
        <ToolbarButton
          command="insertOrderedList"
          label="Numbered List"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
          }
        />
        <div className="w-px bg-gray-300 mx-1" />
        <ToolbarButton
          command="justifyLeft"
          label="Align Left"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
            </svg>
          }
        />
        <ToolbarButton
          command="justifyCenter"
          label="Align Center"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" />
            </svg>
          }
        />
        <ToolbarButton
          command="justifyRight"
          label="Align Right"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" />
            </svg>
          }
        />
        <div className="w-px bg-gray-300 mx-1" />
        <select
          onChange={(e) => execCommand('formatBlock', e.target.value)}
          className="px-2 py-1 border rounded text-sm"
        >
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="blockquote">Quote</option>
        </select>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[400px] p-4 focus:outline-none prose max-w-none"
        data-placeholder={placeholder}
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
        }}
        suppressContentEditableWarning={true}
      />

      {/* Character/Word count */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-sm text-gray-600 flex justify-between">
        <span>Words: {getWordCount()}</span>
        <span>Characters: {getCharCount()}</span>
      </div>
    </div>
  );
};

export default PostEditor;
