import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Search,
  CheckCircle2,
  Calendar,
  X,
  AlertCircle,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../hooks/useNotes';

const NotesManagement: React.FC = () => {
  const { activeWorkspace } = useWorkspace();
  const {
    notes,
    isLoading,
    isSaving,
    error,
    setError,
    createNote,
    updateNote,
    deleteNote,
  } = useNotes();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formTaskId, setFormTaskId] = useState<string>('');
  const [formEventId, setFormEventId] = useState<string>('');

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateForm = () => {
    setSelectedNote(null);
    setIsEditing(false);
    setFormTitle('');
    setFormContent('');
    setFormTaskId('');
    setFormEventId('');
    setIsCreating(true);
  };

  const openEditForm = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setFormTitle(note.title);
    setFormContent(note.content || '');
    setFormTaskId(note.taskId || '');
    setFormEventId(note.eventId || '');
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    try {
      if (isEditing && selectedNote) {
        await updateNote(
          selectedNote.id,
          formTitle,
          formContent,
          formTaskId || null,
          formEventId || null
        );
      } else {
        await createNote(
          formTitle,
          formContent,
          formTaskId || null,
          formEventId || null
        );
      }
      setIsCreating(false);
      setIsEditing(false);
      setSelectedNote(null);
    } catch {
      // Error handled by hook
    }
  };

  if (!activeWorkspace) {
    return (
      <div
        style={{
          padding: '40px',
          textAlign: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '600',
            color: 'var(--text-main)',
          }}
        >
          No Active Workspace
        </h3>
        <p style={{ fontSize: '15px' }}>
          Please select or create a workspace to access Smart Notes.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: '700',
              color: 'var(--text-main)',
              margin: '0 0 4px 0',
              letterSpacing: '-0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Smart Notes Vault
            <span
              style={{
                fontSize: '12px',
                padding: '3px 8px',
                borderRadius: '12px',
                backgroundColor:
                  'rgba(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l), 0.15)',
                color: 'var(--color-primary)',
                fontWeight: '600',
              }}
            >
              Knowledge Base
            </span>
          </h2>
          <p
            style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}
          >
            Capture meeting notes, ideas, and context linked to tasks & calendar
            events for AI Agent reference.
          </p>
        </div>

        <button
          onClick={openCreateForm}
          className="btn btn-primary"
          style={{ height: '44px', padding: '0 18px', gap: '8px' }}
        >
          <Plus size={18} />
          <span>New Note</span>
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 18px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--color-danger)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--color-danger)',
            fontSize: '14px',
          }}
        >
          <AlertCircle size={18} />
          <span style={{ flexGrow: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Content Layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            isCreating || isEditing || selectedNote ? '340px 1fr' : '1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* Left List Panel */}
        <div
          className="card"
          style={{
            padding: '20px',
            gap: '16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
                  onClick={() => {
                    setSelectedNote(note);
                    setIsCreating(false);
                    setIsEditing(false);
                  }}
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
                          openEditForm(note);
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
                          deleteNote(note.id);
                          if (selectedNote?.id === note.id)
                            setSelectedNote(null);
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

        {/* Right Editor / Detail Panel */}
        {(isCreating || isEditing) && (
          <form
            onSubmit={handleSave}
            className="card"
            style={{
              padding: '24px',
              gap: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                {isEditing ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                }}
              >
                Title *
              </label>
              <input
                type="text"
                required
                placeholder="Note title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                style={{
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                }}
              >
                Content (Markdown supported)
              </label>
              <textarea
                placeholder="Write your note content, meeting summaries, ideas..."
                rows={10}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  resize: 'vertical',
                }}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                  }}
                >
                  Linked Task ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="UUID of associated Task"
                  value={formTaskId}
                  onChange={(e) => setFormTaskId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
              >
                <label
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: 'var(--text-muted)',
                  }}
                >
                  Linked Event ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="UUID of Calendar Event"
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className="btn btn-secondary"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Saving...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Note'}
              </button>
            </div>
          </form>
        )}

        {selectedNote && !isCreating && !isEditing && (
          <div
            className="card"
            style={{
              padding: '24px',
              gap: '16px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: 'var(--text-main)',
                    margin: '0 0 6px 0',
                  }}
                >
                  {selectedNote.title}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Last updated{' '}
                  {new Date(selectedNote.updatedAt).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditForm(selectedNote)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px' }}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  onClick={() => {
                    deleteNote(selectedNote.id);
                    setSelectedNote(null);
                  }}
                  className="btn btn-danger"
                  style={{ padding: '6px 12px' }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--bg-app)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--text-main)',
                whiteSpace: 'pre-wrap',
                minHeight: '200px',
              }}
            >
              {selectedNote.content || (
                <span
                  style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}
                >
                  No content provided.
                </span>
              )}
            </div>

            {(selectedNote.taskId || selectedNote.eventId) && (
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '13px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                {selectedNote.taskId && (
                  <span
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <CheckCircle2 size={14} /> Task ID: {selectedNote.taskId}
                  </span>
                )}
                {selectedNote.eventId && (
                  <span
                    style={{
                      color: 'var(--color-primary)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Calendar size={14} /> Event ID: {selectedNote.eventId}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesManagement;
