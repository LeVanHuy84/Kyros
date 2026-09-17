import React from 'react';
import { Search, RefreshCw, FileText, Edit3, Trash2, Clock, CheckCircle2, Calendar, PanelLeftClose } from 'lucide-react';
import type { Note } from '../../hooks/useNotes';

interface NoteListPanelProps {
  notes: Note[];
  filteredNotes: Note[];
  selectedNote: Note | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectNote: (note: Note) => void;
  onOpenEditForm: (note: Note) => void;
  onDeleteNote: (id: string) => void;
  isLoading: boolean;
  isCreating: boolean;
  isEditing: boolean;
  onCollapse: () => void;
}

export const NoteListPanel: React.FC<NoteListPanelProps> = ({
  filteredNotes,
  selectedNote,
  searchQuery,
  onSearchChange,
  onSelectNote,
  onOpenEditForm,
  onDeleteNote,
  isLoading,
  isCreating,
  isEditing,
  onCollapse,
}) => {
  return (
    <div
      className="card"
      style={{
        padding: '20px',
        gap: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* List Header / Collapse toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          All Notes ({filteredNotes.length})
        </span>
        {(isCreating || isEditing || selectedNote) && (
          <button
            type="button"
            onClick={onCollapse}
            className="btn btn-secondary"
            title="Collapse list panel for wider workspace"
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <PanelLeftClose size={14} />
            <span>Collapse</span>
          </button>
        )}
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          style={{
            width: '100%',
            padding: '9px 12px 9px 36px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
      </div>

      {isLoading ? (
        <div
          style={{
            padding: '30px 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw
            size={20}
            className="spin"
            style={{ color: 'var(--color-primary)', marginBottom: '8px' }}
          />
          <div>Loading notes...</div>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div
          style={{
            padding: '40px 0',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <FileText
            size={36}
            style={{ opacity: 0.3, marginBottom: '8px' }}
          />
          <div
            style={{
              fontWeight: '600',
              fontSize: '14px',
              color: 'var(--text-main)',
            }}
          >
            No Notes Found
          </div>
          <div style={{ fontSize: '13px' }}>
            Click "+ New Note" to write down ideas.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxHeight: '640px',
            overflowY: 'auto',
          }}
        >
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note)}
              style={{
                padding: '14px 16px',
                backgroundColor:
                  selectedNote?.id === note.id
                    ? 'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.08)'
                    : 'var(--bg-app)',
                border:
                  selectedNote?.id === note.id
                    ? '1px solid var(--color-primary)'
                    : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontWeight: '600',
                    fontSize: '14px',
                    color: 'var(--text-main)',
                  }}
                >
                  {note.title}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenEditForm(note);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '4px 6px' }}
                    title="Edit"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteNote(note.id);
                    }}
                    className="btn btn-danger"
                    style={{ padding: '4px 6px' }}
                    title="Delete"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {note.content && (
                <p
                  style={{
                    margin: 0,
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {note.content}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '4px',
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Clock size={11} />
                  {new Date(note.updatedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {note.taskId && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <CheckCircle2 size={11} /> Linked Task
                  </span>
                )}
                {note.eventId && (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      color: 'var(--color-primary)',
                    }}
                  >
                    <Calendar size={11} /> Linked Event
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
