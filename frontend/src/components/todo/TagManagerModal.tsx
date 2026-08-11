import React, { useState } from 'react';
import { X, Plus, Pencil, Check, Trash2, AlertCircle } from 'lucide-react';
import { useWorkspaceTags } from '../../hooks/useWorkspaceTags';

const TAG_COLORS = [
  '#6366f1',
  '#ef4444',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { tags, isLoading, error, setError, createTag, updateTag, deleteTag } =
    useWorkspaceTags();

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<string>(TAG_COLORS[0]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createTag(newName, newColor);
      setNewName('');
      setNewColor(TAG_COLORS[0]);
    } catch {
      // error handled by hook
    }
  };

  const startEdit = (id: string, name: string, color: string | null) => {
    setEditingId(id);
    setEditName(name);
    setEditColor(color || TAG_COLORS[0]);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateTag(editingId, editName, editColor);
      setEditingId(null);
    } catch {
      // error handled by hook
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTag(id);
    } catch {
      // error handled by hook
    }
  };

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
        zIndex: 110,
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '640px',
          padding: '36px',
          gap: '24px',
          boxShadow: 'var(--shadow-lg)',
          backgroundColor: 'var(--bg-card)',
          maxHeight: '80vh',
          overflowY: 'auto',
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
            Manage Workspace Tags
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

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-danger)',
              fontSize: '14px',
            }}
          >
            <AlertCircle size={16} />
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
              <X size={14} />
            </button>
          </div>
        )}

        {/* Add new tag */}
        <form
          onSubmit={handleAdd}
          style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              flexGrow: 1,
            }}
          >
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              New Tag
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. urgent, design, work"
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '15px',
                outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Color
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TAG_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: color,
                    border:
                      newColor === color
                        ? '2px solid var(--text-main)'
                        : '2px solid transparent',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ height: '44px' }}
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>

        {/* Tags table */}
        {isLoading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            Loading tags...
          </div>
        ) : tags.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            No workspace tags yet. Add your first tag above.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  textAlign: 'left',
                }}
              >
                <th
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border-color)',
                  }}
                >
                  Color
                </th>
                <th
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid var(--border-color)',
                    textAlign: 'right',
                  }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.tagId}>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {editingId === tag.tagId ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-primary)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          fontSize: '14px',
                          outline: 'none',
                          fontFamily: 'var(--font-sans)',
                        }}
                      />
                    ) : (
                      <span
                        className="badge"
                        style={{
                          fontSize: '12px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          color: tag.color ? '#fff' : 'var(--text-main)',
                          backgroundColor: tag.color || 'var(--border-color)',
                          border: 'none',
                        }}
                      >
                        {tag.name}
                      </span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                    }}
                  >
                    {editingId === tag.tagId ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: '5px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditColor(color)}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: color,
                              border:
                                editColor === color
                                  ? '2px solid var(--text-main)'
                                  : '2px solid transparent',
                              cursor: 'pointer',
                              padding: 0,
                            }}
                            aria-label={`Color ${color}`}
                          />
                        ))}
                      </div>
                    ) : (
                      <span
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          display: 'inline-block',
                          backgroundColor: tag.color || 'var(--border-color)',
                        }}
                      />
                    )}
                  </td>
                  <td
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--border-color)',
                      textAlign: 'right',
                    }}
                  >
                    {editingId === tag.tagId ? (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          type="button"
                          onClick={handleSaveEdit}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                        >
                          <Check size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(tag.tagId, tag.name, tag.color)
                          }
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          title="Edit Tag"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tag.tagId)}
                          className="btn btn-danger"
                          style={{ padding: '6px 10px', fontSize: '13px' }}
                          title="Delete Tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
