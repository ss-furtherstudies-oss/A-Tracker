import React, { useState } from 'react';

const EditableCell = ({ value, onSave, className = '', readOnly = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? '');

  const commit = async () => {
    setIsEditing(false);
    if ((draft ?? '') !== (value ?? '')) {
      await onSave(draft);
    }
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setDraft(value ?? '');
            setIsEditing(false);
          }
        }}
        className={`w-full px-1 py-0.5 border border-aura-teal rounded bg-white text-slateBlue-800 outline-none ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => {
        if (!readOnly) setIsEditing(true);
      }}
      className={`${readOnly ? '' : 'cursor-pointer hover:bg-slateBlue-50'} rounded px-1 -mx-1 transition-colors min-h-[1.5em] ${className}`}
    >
      {value || '-'}
    </div>
  );
};

export default EditableCell;
