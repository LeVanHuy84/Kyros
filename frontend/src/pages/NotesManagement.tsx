import React, { useState } from 'react';
import {
  FileText,
  Plus,
  X,
  AlertCircle,
  PanelLeftOpen,
} from 'lucide-react';
import { useWorkspace } from '../hooks/useWorkspace';
import { useNotes } from '../hooks/useNotes';
import type { Note } from '../hooks/useNotes';
import { NoteListPanel } from '../components/notes/NoteListPanel';
import { NoteFormEditor } from '../components/notes/NoteFormEditor';
import { NoteDetailView } from '../components/notes/NoteDetailView';

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
  const [isListCollapsed, setIsListCollapsed] = useState<boolean>(false);

  // Form states
  const [formTitle, setFormTitle] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formTaskId, setFormTaskId] = useState<string>('');
  const [formEventId, setFormEventId] = useState<string>('');
  const [formTab, setFormTab] = useState<'edit' | 'preview'>('edit');

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
    setFormTab('edit');
    setIsCreating(true);
  };

  const openEditForm = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setFormTitle(note.title);
    setFormContent(note.content || '');
    setFormTaskId(note.taskId || '');
    setFormEventId(note.eventId || '');
    setFormTab('edit');
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
            isListCollapsed
              ? 'auto 1fr'
              : isCreating || isEditing || selectedNote
                ? '320px 1fr'
                : '1fr',
          gap: '20px',
          alignItems: 'start',
          transition: 'all var(--transition-normal)',
        }}
      >
        {/* Left List Panel */}
        {isListCollapsed ? (
          <button
            onClick={() => setIsListCollapsed(false)}
            className="btn btn-secondary"
            title="Expand Note List"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-card)',
              whiteSpace: 'nowrap',
            }}
          >
            <PanelLeftOpen size={18} />
            <span>Notes List ({filteredNotes.length})</span>
          </button>
        ) : (
          <NoteListPanel
            notes={notes}
            filteredNotes={filteredNotes}
            selectedNote={selectedNote}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSelectNote={(note) => {
              setSelectedNote(note);
              setIsCreating(false);
              setIsEditing(false);
            }}
            onOpenEditForm={openEditForm}
            onDeleteNote={(id) => {
              deleteNote(id);
              if (selectedNote?.id === id) setSelectedNote(null);
            }}
            isLoading={isLoading}
            isCreating={isCreating}
            isEditing={isEditing}
            onCollapse={() => setIsListCollapsed(true)}
          />
        )}

        {/* Right Editor Panel */}
        {(isCreating || isEditing) && (
          <NoteFormEditor
            isEditing={isEditing}
            formTitle={formTitle}
            setFormTitle={setFormTitle}
            formContent={formContent}
            setFormContent={setFormContent}
            formTaskId={formTaskId}
            setFormTaskId={setFormTaskId}
            formEventId={formEventId}
            setFormEventId={setFormEventId}
            formTab={formTab}
            setFormTab={setFormTab}
            isSaving={isSaving}
            onSave={handleSave}
            onCancel={() => {
              setIsCreating(false);
              setIsEditing(false);
            }}
          />
        )}

        {/* Right Detail Panel */}
        {selectedNote && !isCreating && !isEditing && (
          <NoteDetailView
            note={selectedNote}
            onEdit={() => openEditForm(selectedNote)}
            onDelete={() => {
              deleteNote(selectedNote.id);
              setSelectedNote(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NotesManagement;
