import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import type { WorkspaceTag } from '../../hooks/useWorkspaceTags';

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags: WorkspaceTag[];
  placeholder?: string;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  value,
  onChange,
  availableTags,
  placeholder = 'Search tags to add...'
}) => {
  const [search, setSearch] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedNames = new Set(value);
  const filteredTags = availableTags.filter(
    tag =>
      !selectedNames.has(tag.name) &&
      (search.trim() === '' ||
        tag.name.toLowerCase().includes(search.trim().toLowerCase()))
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  const toggleTag = (name: string) => {
    if (selectedNames.has(name)) {
      onChange(value.filter(t => t !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const removeTag = (name: string) => {
    onChange(value.filter(t => t !== name));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && filteredTags[highlightedIndex]) {
        toggleTag(filteredTags[highlightedIndex].name);
        setSearch('');
        setHighlightedIndex(-1);
        inputRef.current?.focus();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(filteredTags.length - 1, prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(-1, prev - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Backspace' && search === '' && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const getTagColor = (name: string): string | null => {
    const found = availableTags.find(t => t.name === name);
    return found?.color || null;
  };

  return (
    <div ref={wrapperRef} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Selected chips */}
      {value.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {value.map(name => (
            <span
              key={name}
              className="badge"
              style={{
                fontSize: '12px',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: getTagColor(name) ? '#fff' : 'var(--text-main)',
                backgroundColor: getTagColor(name) || 'var(--border-color)',
                border: 'none'
              }}
            >
              {name}
              <button
                type="button"
                onClick={() => removeTag(name)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  padding: 0,
                  opacity: 0.7
                }}
                aria-label={`Remove tag ${name}`}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Combobox */}
      <div style={{ position: 'relative' }}>
        <div
          onClick={() => {
            setIsOpen(prev => !prev);
            if (!isOpen) setTimeout(() => inputRef.current?.focus(), 0);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--border-color)'}`,
            backgroundColor: 'var(--bg-app)',
            cursor: 'pointer',
            gap: '8px'
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={search}
            placeholder={placeholder}
            onClick={e => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            onChange={e => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsOpen(true)}
            style={{
              width: '100%',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-main)',
              fontSize: '15px',
              outline: 'none',
              fontFamily: 'var(--font-sans)'
            }}
          />
          <ChevronDown
            size={16}
            style={{
              color: 'var(--text-muted)',
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease'
            }}
          />
        </div>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 20
            }}
          >
            {filteredTags.length === 0 ? (
              <div style={{ padding: '12px 14px', color: 'var(--text-muted)', fontSize: '14px' }}>
                {availableTags.length === 0
                  ? 'No workspace tags available.'
                  : 'No matching tags.'}
              </div>
            ) : (
              filteredTags.map((tag, index) => (
                <button
                  key={tag.tagId}
                  type="button"
                  onClick={() => {
                    toggleTag(tag.name);
                    setSearch('');
                    setHighlightedIndex(-1);
                    inputRef.current?.focus();
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: '100%',
                    padding: '10px 14px',
                    background: index === highlightedIndex ? 'var(--bg-hover, rgba(0,0,0,0.04))' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: 'var(--text-main)'
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: tag.color || 'var(--border-color)',
                      flexShrink: 0
                    }}
                  />
                  {tag.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
