import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Search,
  X,
  FileSpreadsheet,
  File,
  Loader2,
} from 'lucide-react';
import apiClient from '../../services/api-client';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { WorkspaceDocument } from '../../hooks/useAgentChat';

interface DocumentsTabProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  onSuccess,
  onError,
}) => {
  const { activeWorkspace } = useWorkspace();
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Upload state
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview & Delete modal state
  const [selectedDoc, setSelectedDoc] = useState<WorkspaceDocument | null>(
    null
  );
  const [docToDelete, setDocToDelete] = useState<WorkspaceDocument | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchDocuments = useCallback(async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/documents`
      );
      setDocuments(res.data || []);
    } catch (err: any) {
      console.warn('Failed to load documents', err);
      onError(
        err?.response?.data?.message || 'Không thể tải danh sách tài liệu.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace, onError]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleFileUpload = async (file: File) => {
    if (!activeWorkspace) return;

    // Validate extension
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md'];
    if (!ext || !allowed.includes(ext)) {
      onError(
        'Định dạng không được hỗ trợ. Chỉ chấp nhận .pdf, .docx, .txt, .md.'
      );
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      onError('Kích thước tệp quá lớn (tối đa 25MB).');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/documents/upload`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const pct = Math.round(
                (progressEvent.loaded * 90) / progressEvent.total
              );
              setUploadProgress(Math.max(15, pct));
            }
          },
        }
      );
      setUploadProgress(100);
      onSuccess(
        `Tải lên tài liệu "${file.name}" thành công! Đã lập chỉ mục ${res.data.chunkCount || 1} chunks.`
      );
      fetchDocuments();
    } catch (err: any) {
      console.error('Document upload error', err);
      onError(
        err?.response?.data?.message ||
          'Tải lên hoặc lập chỉ mục tài liệu thất bại.'
      );
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(null);
      }, 500);
    }
  };

  const handleDeleteDocument = async () => {
    if (!activeWorkspace || !docToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(
        `/v1/workspaces/${activeWorkspace.id}/documents/${docToDelete.id}`
      );
      onSuccess(
        `Đã xóa tài liệu "${docToDelete.filename}" khỏi Knowledge Base.`
      );
      setDocToDelete(null);
      fetchDocuments();
    } catch (err: any) {
      onError(err?.response?.data?.message || 'Không thể xóa tài liệu.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf')
      return <FileText size={20} style={{ color: '#ef4444' }} />;
    if (ext === 'docx')
      return <FileSpreadsheet size={20} style={{ color: '#3b82f6' }} />;
    if (ext === 'md' || ext === 'txt')
      return <FileText size={20} style={{ color: '#10b981' }} />;
    return <File size={20} style={{ color: '#a855f7' }} />;
  };

  const filteredDocs = documents.filter((d) =>
    d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Intro Header */}
      <div>
        <h4
          style={{
            margin: '0 0 6px 0',
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-main)',
          }}
        >
          Workspace Knowledge Base & Documents
        </h4>
        <p
          style={{
            margin: 0,
            fontSize: '14px',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
          }}
        >
          Tải lên tài liệu (.pdf, .docx, .txt, .md) để tự động bẻ chunk và
          vector embedding vào tri thức của Kyros AI Agent. Agent có thể tra cứu
          ngữ cảnh và trả lời chính xác dựa trên tài liệu này.
        </p>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: isDragging
            ? '2px dashed var(--color-primary)'
            : '2px dashed var(--border-color)',
          backgroundColor: isDragging
            ? 'rgba(99, 102, 241, 0.08)'
            : 'var(--bg-app)',
          borderRadius: 'var(--radius-md, 12px)',
          padding: '36px 20px',
          textAlign: 'center',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md"
          style={{ display: 'none' }}
          disabled={isUploading}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            color: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isUploading ? (
            <Loader2 size={26} className="animate-spin" />
          ) : (
            <UploadCloud size={26} />
          )}
        </div>

        <div>
          <div
            style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--text-main)',
            }}
          >
            {isUploading
              ? 'Đang tải lên và lập chỉ mục Vector...'
              : 'Kéo thả file vào đây hoặc bấm để chọn tệp'}
          </div>
          <div
            style={{
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            Hỗ trợ PDF, DOCX, TXT, MD (Tối đa 25MB)
          </div>
        </div>

        {/* Progress Bar */}
        {uploadProgress !== null && (
          <div
            style={{
              width: '100%',
              maxWidth: '320px',
              height: '8px',
              backgroundColor: 'var(--border-color)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginTop: '8px',
            }}
          >
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-app)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            width: '100%',
            maxWidth: '360px',
          }}
        >
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu đã tải lên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'none',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '13px',
              width: '100%',
            }}
          />
        </div>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Tổng cộng: <strong>{documents.length}</strong> tài liệu
        </div>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div
          style={{
            padding: '40px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <Loader2 size={18} className="animate-spin" />
          <span>Đang tải danh sách tài liệu...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
          }}
        >
          {documents.length === 0
            ? 'Chưa có tài liệu nào trong Knowledge Base. Hãy tải lên tài liệu đầu tiên của bạn ở trên!'
            : 'Không tìm thấy tài liệu phù hợp với từ khóa.'}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '14px',
          }}
        >
          {filteredDocs.map((doc) => {
            const isReady = doc.chunkCount > 0;
            return (
              <div
                key={doc.id}
                className="card"
                style={{
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {getFileIcon(doc.filename)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h5
                      style={{
                        margin: '0 0 4px 0',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={doc.filename}
                    >
                      {doc.filename}
                    </h5>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>•</span>
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status and Action Buttons */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-color)',
                  }}
                >
                  {/* Status Indicator */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      backgroundColor: isReady
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(234, 179, 8, 0.12)',
                      color: isReady ? '#10b981' : '#eab308',
                      border: isReady
                        ? '1px solid rgba(16, 185, 129, 0.25)'
                        : '1px solid rgba(234, 179, 8, 0.25)',
                    }}
                  >
                    {isReady ? (
                      <>
                        <CheckCircle2 size={12} />
                        <span>Sẵn sàng ({doc.chunkCount} chunks)</span>
                      </>
                    ) : (
                      <>
                        <Clock size={12} className="animate-spin" />
                        <span>Đang xử lý</span>
                      </>
                    )}
                  </span>

                  {/* Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedDoc(doc)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      title="Xem chi tiết tài liệu"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="btn btn-danger"
                      style={{ padding: '6px 8px', fontSize: '12px' }}
                      title="Xóa tài liệu khỏi Knowledge Base"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Details Modal */}
      {selectedDoc && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="card fade-in-slide-up"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '24px',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h4
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {getFileIcon(selectedDoc.filename)}
                <span>Chi tiết tài liệu tri thức</span>
              </h4>
              <button
                onClick={() => setSelectedDoc(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                fontSize: '13px',
                color: 'var(--text-main)',
                backgroundColor: 'var(--bg-app)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>Tên tệp:</strong>{' '}
                {selectedDoc.filename}
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>
                  Mã tài liệu:
                </strong>{' '}
                <code style={{ fontSize: '12px' }}>{selectedDoc.id}</code>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>
                  Định dạng:
                </strong>{' '}
                {selectedDoc.contentType || 'N/A'}
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>
                  Dung lượng:
                </strong>{' '}
                {formatFileSize(selectedDoc.fileSize)}
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>
                  Số lượng chunk vector:
                </strong>{' '}
                <span
                  style={{
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {selectedDoc.chunkCount} chunks
                </span>
              </div>
              <div>
                <strong style={{ color: 'var(--text-muted)' }}>
                  Thời gian tải lên:
                </strong>{' '}
                {new Date(selectedDoc.createdAt).toLocaleString()}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: '20px',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setSelectedDoc(null)}
                style={{ fontSize: '13px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => !isDeleting && setDocToDelete(null)}
        >
          <div
            className="card fade-in-slide-up"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md, 12px)',
              padding: '24px',
              border: '1px solid var(--border-color)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AlertCircle size={20} />
              </div>
              <h4
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                }}
              >
                Xác nhận xóa tài liệu
              </h4>
            </div>

            <p
              style={{
                fontSize: '14px',
                color: 'var(--text-muted)',
                lineHeight: '1.5',
                margin: '0 0 20px 0',
              }}
            >
              Bạn có chắc chắn muốn xóa tài liệu{' '}
              <strong style={{ color: 'var(--text-main)' }}>
                "{docToDelete.filename}"
              </strong>{' '}
              khỏi kho tri thức của workspace? Các vector embedding liên quan
              cũng sẽ bị xóa vĩnh viễn.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <button
                className="btn btn-secondary"
                onClick={() => setDocToDelete(null)}
                disabled={isDeleting}
                style={{ fontSize: '13px' }}
              >
                Hủy
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteDocument}
                disabled={isDeleting}
                style={{ fontSize: '13px', gap: '6px' }}
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                <span>{isDeleting ? 'Đang xóa...' : 'Xóa tài liệu'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
