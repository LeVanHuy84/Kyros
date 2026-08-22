import React, { useState, useEffect } from 'react';
import { Search, Loader2, Trash2, Edit2, Check, X } from 'lucide-react';
import { useMemoryVault } from '../../hooks/useMemoryVault';

interface MemoryVaultPanelProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const MemoryVaultPanel: React.FC<MemoryVaultPanelProps> = ({ onSuccess, onError }) => {
  const {
    memories,
    searchQuery,
    setSearchQuery,
    page,
    setPage,
    totalPages,
    isLoading,
    isSaving,
    error,
    updateMemory,
    deleteMemory,
  } = useMemoryVault();

  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>('');
  const [editingConfidence, setEditingConfidence] = useState<number>(1.0);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleUpdate = async (id: string) => {
    if (!editingContent.trim()) {
      alert('Content cannot be blank.');
      return;
    }
    const success = await updateMemory(id, editingContent, editingConfidence);
    if (success) {
      setEditingMemoryId(null);
      onSuccess('Memory updated successfully.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this memory fact?')) {
      const success = await deleteMemory(id);
      if (success) {
        onSuccess('Memory deleted successfully.');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Loader2 className="animate-spin" size={24} style={{ color: 'var(--color-primary)' }} />
        </div>
      )}

      <div>
        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Memory Vault</h4>
        <p style={{ fontSize: '15px', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.6' }}>
          Semantic memory context extracted from your completed sessions. Audit, edit, or delete items.
        </p>
      </div>

      {/* Search bar */}
      <div style={{ position: 'relative', maxWidth: '400px' }}>
        <Search size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search memory vault..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '11px 16px 11px 42px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            outline: 'none',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Memories List */}
      <div
        style={{
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '15px' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '16px 20px', fontWeight: '600' }}>Extracted Fact</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', width: '150px' }}>Confidence Score</th>
              <th style={{ padding: '16px 20px', fontWeight: '600', width: '180px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {memories.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No semantic entries registered in this workspace yet.
                </td>
              </tr>
            ) : (
              memories.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    {editingMemoryId === entry.id ? (
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-primary)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                          outline: 'none',
                        }}
                      />
                    ) : (
                      <span>"{entry.content}"</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {editingMemoryId === entry.id ? (
                      <input
                        type="number"
                        min="0.0"
                        max="1.0"
                        step="0.05"
                        value={editingConfidence}
                        onChange={(e) => setEditingConfidence(parseFloat(e.target.value) || 1.0)}
                        style={{
                          width: '80px',
                          padding: '8px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--color-primary)',
                          backgroundColor: 'var(--bg-app)',
                          color: 'var(--text-main)',
                        }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${entry.confidenceScore * 100}%`, height: '100%', backgroundColor: entry.confidenceScore >= 0.8 ? '#10B981' : '#F59E0B' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{entry.confidenceScore.toFixed(2)}</span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {editingMemoryId === entry.id ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdate(entry.id)}
                          disabled={isSaving}
                          style={{ border: 'none', background: '#10B981', color: 'white', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Check size={14} />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setEditingMemoryId(null)}
                          style={{ border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          <span>Cancel</span>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => {
                            setEditingMemoryId(entry.id);
                            setEditingContent(entry.content);
                            setEditingConfidence(entry.confidenceScore);
                          }}
                          style={{ background: 'none', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Edit2 size={14} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          style={{ background: 'none', border: '1px solid #F87171', color: '#EF4444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: page === 0 ? 'default' : 'pointer', opacity: page === 0 ? 0.5 : 1, borderRadius: '4px' }}
          >
            Previous
          </button>
          <span style={{ alignSelf: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
            Page {page + 1} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            style={{ padding: '8px 16px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: page >= totalPages - 1 ? 'default' : 'pointer', opacity: page >= totalPages - 1 ? 0.5 : 1, borderRadius: '4px' }}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
