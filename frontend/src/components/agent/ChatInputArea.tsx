import React, { useState } from 'react';
import {
  FileText,
  Tag,
  X,
  CheckCircle2,
  Send,
  BookOpen,
  Search,
} from 'lucide-react';
import type { Note } from '../../hooks/useNotes';
import type { WorkspaceDocument } from '../../hooks/useAgentChat';

interface ChatInputAreaProps {
  inputTurn: string;
  setInputTurn: (val: string) => void;
  selectedNotes: Note[];
  setSelectedNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  notes: Note[];
  selectedDocs?: WorkspaceDocument[];
  setSelectedDocs?: React.Dispatch<React.SetStateAction<WorkspaceDocument[]>>;
  documents?: WorkspaceDocument[];
  onSendMessage: (e: React.FormEvent) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputTurn,
  setInputTurn,
  selectedNotes,
  setSelectedNotes,
  notes,
  selectedDocs = [],
  setSelectedDocs,
  documents = [],
  onSendMessage,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'notes' | 'docs'>('notes');
  const [searchFilter, setSearchFilter] = useState('');

  const filteredNotes = notes.filter((n) =>
    n.title.toLowerCase().includes(searchFilter.toLowerCase())
  );
  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const totalAttachments = selectedNotes.length + selectedDocs.length;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingTop: '4px',
      }}
    >
      {/* Selected Attachments Chips Bar */}
      {totalAttachments > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: 'var(--radius-sm)',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FileText size={14} /> Đang đính kèm ({totalAttachments}):
          </span>

          {/* Notes Chips */}
          {selectedNotes.map((n) => (
            <span
              key={n.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-main)',
              }}
            >
              📝 {n.title}
              <button
                type="button"
                onClick={() =>
                  setSelectedNotes((prev) =>
                    prev.filter((item) => item.id !== n.id)
                  )
                }
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}

          {/* Documents Chips */}
          {selectedDocs.map((d) => (
            <span
              key={d.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'rgba(6, 182, 212, 0.08)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                borderRadius: '12px',
                padding: '2px 8px',
                fontSize: '12px',
                fontWeight: '500',
                color: 'var(--text-main)',
              }}
            >
              📄 {d.filename}
              {setSelectedDocs && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedDocs((prev) =>
                      prev.filter((item) => item.id !== d.id)
                    )
                  }
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={onSendMessage}
        style={{ display: 'flex', gap: '10px', position: 'relative' }}
      >
        <div
          style={{
            position: 'relative',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Nhập câu lệnh (gõ @ hoặc bấm icon đính kèm Note / Tài liệu tri thức)..."
            value={inputTurn}
            onChange={(e) => {
              const val = e.target.value;
              setInputTurn(val);
              if (val.endsWith('@')) {
                setShowPicker(true);
              }
            }}
            style={{
              width: '100%',
              padding: '12px 40px 12px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              fontSize: '14px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            title="Đính kèm Smart Note hoặc Document (@Doc)"
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color:
                totalAttachments > 0
                  ? 'var(--color-primary)'
                  : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Tag size={18} />
          </button>

          {/* Context Picker Dropdown */}
          {showPicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                width: '340px',
                maxHeight: '300px',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                zIndex: 50,
                padding: '10px',
              }}
            >
              {/* Header and Close */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPickerTab('notes')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor:
                        pickerTab === 'notes'
                          ? 'var(--color-primary)'
                          : 'var(--bg-app)',
                      color:
                        pickerTab === 'notes' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    📝 Note ({notes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTab('docs')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor:
                        pickerTab === 'docs'
                          ? 'var(--color-primary)'
                          : 'var(--bg-app)',
                      color:
                        pickerTab === 'docs' ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    📄 Tài liệu ({documents.length})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPicker(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '2px',
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Filter Search Input */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 8px',
                  backgroundColor: 'var(--bg-app)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  marginBottom: '8px',
                }}
              >
                <Search size={13} style={{ color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder={
                    pickerTab === 'notes'
                      ? 'Tìm kiếm Note...'
                      : 'Tìm kiếm Tài liệu...'
                  }
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  style={{
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--text-main)',
                    width: '100%',
                  }}
                />
              </div>

              {/* Items List */}
              <div style={{ overflowY: 'auto', flex: 1, maxHeight: '180px' }}>
                {pickerTab === 'notes' ? (
                  filteredNotes.length === 0 ? (
                    <div
                      style={{
                        padding: '16px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                        textAlign: 'center',
                      }}
                    >
                      {notes.length === 0
                        ? 'Chưa có note nào trong Workspace này.'
                        : 'Không tìm thấy ghi chú phù hợp.'}
                    </div>
                  ) : (
                    filteredNotes.map((n) => {
                      const isSelected = selectedNotes.some(
                        (item) => item.id === n.id
                      );
                      return (
                        <div
                          key={n.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedNotes((prev) =>
                                prev.filter((item) => item.id !== n.id)
                              );
                            } else {
                              setSelectedNotes((prev) => [...prev, n]);
                            }
                            setShowPicker(false);
                          }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            backgroundColor: isSelected
                              ? 'rgba(99, 102, 241, 0.12)'
                              : 'transparent',
                            color: isSelected
                              ? 'var(--color-primary)'
                              : 'var(--text-main)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '2px',
                          }}
                        >
                          <div
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            📝 <strong>{n.title}</strong>
                          </div>
                          {isSelected && (
                            <CheckCircle2
                              size={14}
                              style={{ color: 'var(--color-primary)' }}
                            />
                          )}
                        </div>
                      );
                    })
                  )
                ) : filteredDocs.length === 0 ? (
                  <div
                    style={{
                      padding: '16px',
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                    }}
                  >
                    {documents.length === 0
                      ? 'Chưa có tài liệu nào trong Knowledge Base.'
                      : 'Không tìm thấy tài liệu phù hợp.'}
                  </div>
                ) : (
                  filteredDocs.map((d) => {
                    const isSelected = selectedDocs.some(
                      (item) => item.id === d.id
                    );
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          if (setSelectedDocs) {
                            if (isSelected) {
                              setSelectedDocs((prev) =>
                                prev.filter((item) => item.id !== d.id)
                              );
                            } else {
                              setSelectedDocs((prev) => [...prev, d]);
                            }
                          }
                          setShowPicker(false);
                        }}
                        style={{
                          padding: '7px 10px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '12px',
                          cursor: 'pointer',
                          backgroundColor: isSelected
                            ? 'rgba(6, 182, 212, 0.12)'
                            : 'transparent',
                          color: isSelected ? '#06b6d4' : 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '2px',
                        }}
                      >
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <BookOpen size={13} />
                          <span>{d.filename}</span>
                          <span
                            style={{
                              fontSize: '10px',
                              opacity: 0.7,
                            }}
                          >
                            ({d.chunkCount} chunks)
                          </span>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            size={14}
                            style={{ color: '#06b6d4' }}
                          />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0 20px', gap: '8px' }}
        >
          <Send size={16} />
          <span>Gửi</span>
        </button>
      </form>
    </div>
  );
};
