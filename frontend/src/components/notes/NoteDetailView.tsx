import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Edit3, Trash2, CheckCircle2, Calendar } from 'lucide-react';
import type { Note } from '../../hooks/useNotes';

interface NoteDetailViewProps {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

export const NoteDetailView: React.FC<NoteDetailViewProps> = ({
  note,
  onEdit,
  onDelete,
}) => {
  return (
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
            {note.title}
          </h3>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Last updated {new Date(note.updatedAt).toLocaleString()}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onEdit}
            className="btn btn-secondary"
            style={{ padding: '6px 12px' }}
          >
            <Edit3 size={14} /> Edit
          </button>
          <button
            onClick={onDelete}
            className="btn btn-danger"
            style={{ padding: '6px 12px' }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      <div
        className="markdown-body"
        style={{
          padding: '24px 28px',
          backgroundColor: 'var(--bg-app)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontSize: '14px',
          lineHeight: '1.75',
          color: 'var(--text-main)',
          minHeight: '220px',
        }}
      >
        {note.content ? (
          <ReactMarkdown>{note.content}</ReactMarkdown>
        ) : (
          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No content provided.
          </span>
        )}
      </div>

      {(note.taskId || note.eventId) && (
        <div
          style={{
            display: 'flex',
            gap: '16px',
            fontSize: '13px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-color)',
          }}
        >
          {note.taskId && (
            <span
              style={{
                color: 'var(--color-primary)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircle2 size={14} /> Task ID: {note.taskId}
            </span>
          )}
          {note.eventId && (
            <span
              style={{
                color: 'var(--color-primary)',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Calendar size={14} /> Event ID: {note.eventId}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
