import React, { useState } from 'react';
import { FileText, Tag, X, CheckCircle2, Send } from 'lucide-react';
import type { Note } from '../../hooks/useNotes';

interface ChatInputAreaProps {
  inputTurn: string;
  setInputTurn: (val: string) => void;
  selectedNotes: Note[];
  setSelectedNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  notes: Note[];
  onSendMessage: (e: React.FormEvent) => void;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  inputTurn,
  setInputTurn,
  selectedNotes,
  setSelectedNotes,
  notes,
  onSendMessage,
}) => {
  const [showNotePicker, setShowNotePicker] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        paddingTop: '4px',
      }}
    >
      {/* Selected Notes Chips Bar */}
      {selectedNotes.length > 0 && (
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
            <FileText size={14} /> Đang đính kèm ({selectedNotes.length}):
          </span>
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
            placeholder="Nhập câu lệnh (gõ @ hoặc bấm nút đính kèm Note để tạo task/lịch)..."
            value={inputTurn}
            onChange={(e) => {
              const val = e.target.value;
              setInputTurn(val);
              if (val.endsWith('@')) {
                setShowNotePicker(true);
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
            onClick={() => setShowNotePicker(!showNotePicker)}
            title="Đính kèm Smart Note (@Note)"
            style={{
              position: 'absolute',
              right: '10px',
              background: 'none',
              border: 'none',
              color:
                selectedNotes.length > 0
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

          {/* Note Picker Dropdown */}
          {showNotePicker && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                marginBottom: '8px',
                width: '320px',
                maxHeight: '220px',
                overflowY: 'auto',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 50,
                padding: '8px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                  padding: '4px 8px',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid var(--border-color)',
                  marginBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>📌 Chọn Note đính kèm</span>
                <button
                  type="button"
                  onClick={() => setShowNotePicker(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
              {notes.length === 0 ? (
                <div
                  style={{
                    padding: '12px',
                    fontSize: '13px',
                    color: 'var(--text-muted)',
                    textAlign: 'center',
                  }}
                >
                  Chưa có note nào trong Workspace này.
                </div>
              ) : (
                notes.map((n) => {
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
                        setShowNotePicker(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        backgroundColor: isSelected
                          ? 'rgba(99, 102, 241, 0.1)'
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
              )}
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
