import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TagPicker } from './TagPicker';
import { useWorkspaceTags } from '../../hooks/useWorkspaceTags';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    title: string,
    description: string,
    priority: 'High' | 'Medium' | 'Low',
    dueDate: string | null,
    tags: string[]
  ) => Promise<void>;
  isSaving: boolean;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) => {
  const { tags: workspaceTags } = useWorkspaceTags();
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    dueDate: '',
    tags: [] as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    try {
      await onSave(
        form.title.trim(),
        form.description.trim(),
        form.priority,
        form.dueDate || null,
        form.tags
      );

      // Reset form
      setForm({
        title: '',
        description: '',
        priority: 'Medium',
        dueDate: '',
        tags: [],
      });
      onClose();
    } catch {
      // Error handled by custom hook state
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 'var(--space-6)',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--bg-card)',
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
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: 0,
            }}
          >
            Create Workspace Task
          </h3>
          <button
            type="button"
            onClick={onClose}
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
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
              placeholder="Task title"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Description
            </label>
            <textarea
              placeholder="Task description details..."
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={3}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                resize: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>

          {/* Row: Priority & Due Date */}
          <div
            className="form-row-grid"
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
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                }}
              >
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as any,
                  }))
                }
                style={{
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
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
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                style={{
                  padding: '11px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
          </div>

          {/* Tags Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Tags
            </label>
            <TagPicker
              value={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
              availableTags={workspaceTags}
            />
          </div>
        </div>

        {/* Modal actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '12px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </div>
  );
};
