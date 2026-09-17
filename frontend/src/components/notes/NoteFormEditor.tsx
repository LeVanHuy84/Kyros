import React from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Edit3, Eye } from 'lucide-react';

interface NoteFormEditorProps {
  isEditing: boolean;
  formTitle: string;
  setFormTitle: (val: string) => void;
  formContent: string;
  setFormContent: (val: string) => void;
  formTaskId: string;
  setFormTaskId: (val: string) => void;
  formEventId: string;
  setFormEventId: (val: string) => void;
  formTab: 'edit' | 'preview';
  setFormTab: (tab: 'edit' | 'preview') => void;
  isSaving: boolean;
  onSave: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const NoteFormEditor: React.FC<NoteFormEditorProps> = ({
  isEditing,
  formTitle,
  setFormTitle,
  formContent,
  setFormContent,
  formTaskId,
  setFormTaskId,
  formEventId,
  setFormEventId,
  formTab,
  setFormTab,
  isSaving,
  onSave,
  onCancel,
}) => {
  return (
    <form
      onSubmit={onSave}
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
          onClick={onCancel}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
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

          {/* Edit / Preview Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              backgroundColor: 'var(--bg-app)',
              padding: '3px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
            }}
          >
            <button
              type="button"
              onClick={() => setFormTab('edit')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor:
                  formTab === 'edit'
                    ? 'var(--color-primary)'
                    : 'transparent',
                color:
                  formTab === 'edit' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Edit3 size={13} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setFormTab('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                backgroundColor:
                  formTab === 'preview'
                    ? 'var(--color-primary)'
                    : 'transparent',
                color:
                  formTab === 'preview' ? '#ffffff' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <Eye size={13} /> Preview
            </button>
          </div>
        </div>

        {formTab === 'edit' ? (
          <textarea
            placeholder="Write your note content, meeting summaries, ideas..."
            rows={12}
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            style={{
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '14px',
              lineHeight: '1.6',
              outline: 'none',
              fontFamily: 'var(--font-sans)',
              resize: 'vertical',
            }}
          />
        ) : (
          <div
            className="markdown-body"
            style={{
              padding: '20px 24px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '14px',
              lineHeight: '1.7',
              minHeight: '260px',
              maxHeight: '420px',
              overflowY: 'auto',
            }}
          >
            {formContent.trim() ? (
              <ReactMarkdown>{formContent}</ReactMarkdown>
            ) : (
              <span
                style={{
                  color: 'var(--text-muted)',
                  fontStyle: 'italic',
                }}
              >
                Nothing to preview.
              </span>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
          onClick={onCancel}
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
  );
};
