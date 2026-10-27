import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Sun,
  Moon,
  Sparkles,
  Calendar,
  CheckSquare,
  X,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle,
} from 'lucide-react';
import apiClient from '../../services/api-client';
import { useWorkspace } from '../../hooks/useWorkspace';

export interface ExecutiveBriefingDto {
  type?: 'MORNING' | 'EVENING';
  briefingType?: 'MORNING' | 'EVENING';
  title?: string;
  markdownContent?: string;
  summary?: string;
  totalEvents?: number;
  upcomingEventsCount?: number;
  totalTasksPending?: number;
  urgentTasksCount?: number;
  totalTasksCompleted?: number;
  generatedAt?: string;
  eventsSummary?: Array<{
    title: string;
    startTime: string;
    endTime: string;
    location?: string;
  }>;
  tasksSummary?: Array<{
    title: string;
    priority: string;
    dueDate?: string;
  }>;
}

interface ExecutiveBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkRead?: () => void;
}

export const ExecutiveBriefingModal: React.FC<ExecutiveBriefingModalProps> = ({
  isOpen,
  onClose,
  onMarkRead,
}) => {
  const { activeWorkspace } = useWorkspace();
  const [briefingType, setBriefingType] = useState<'MORNING' | 'EVENING'>(
    'MORNING'
  );
  const [briefing, setBriefing] = useState<ExecutiveBriefingDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBriefing = useCallback(
    async (type: 'MORNING' | 'EVENING') => {
      if (!activeWorkspace) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(
          `/v1/workspaces/${activeWorkspace.id}/executive/briefing/today`,
          { params: { type } }
        );
        setBriefing(res.data);
      } catch (err: any) {
        console.warn('Failed to load briefing', err);
        setError(
          err?.response?.data?.message || 'Không thể tải bản tin điều hành.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [activeWorkspace]
  );

  const generateNewBriefing = async () => {
    if (!activeWorkspace) return;
    setIsGenerating(true);
    setError(null);
    try {
      const res = await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/executive/briefing/generate`,
        null,
        {
          params: {
            type: briefingType,
            sendNotification: false,
          },
        }
      );
      setBriefing(res.data);
    } catch (err: any) {
      console.warn('Failed to generate new briefing', err);
      setError(err?.response?.data?.message || 'Không thể sinh bản tin mới.');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeWorkspace) {
      const hour = new Date().getHours();
      const defaultType = hour >= 16 ? 'EVENING' : 'MORNING';
      setBriefingType(defaultType);
      fetchBriefing(defaultType);
    }
  }, [isOpen, activeWorkspace, fetchBriefing]);

  if (!isOpen) return null;

  const totalEvents =
    briefing?.totalEvents ?? briefing?.upcomingEventsCount ?? 0;
  const totalTasks =
    briefing?.totalTasksPending ?? briefing?.urgentTasksCount ?? 0;
  const totalCompleted = briefing?.totalTasksCompleted ?? 0;
  const markdownText = briefing?.markdownContent || briefing?.summary || '';

  const handleStartDay = () => {
    if (onMarkRead) onMarkRead();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card fade-in-slide-up"
        style={{
          width: '100%',
          maxWidth: '780px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              briefingType === 'MORNING'
                ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.1) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor:
                  briefingType === 'MORNING' ? '#fef3c7' : '#ede9fe',
                color: briefingType === 'MORNING' ? '#d97706' : '#7c3aed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {briefingType === 'MORNING' ? (
                <Sun size={24} />
              ) : (
                <Moon size={24} />
              )}
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '700',
                  color: 'var(--text-main)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {briefing?.title ||
                  (briefingType === 'MORNING'
                    ? 'Bản Tin Điều Hành Buổi Sáng'
                    : 'Tổng Kết Điều Hành Cuối Ngày')}
              </h3>
              <span
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                }}
              >
                <Clock size={12} />
                {briefing?.generatedAt
                  ? `Cập nhật lúc ${new Date(briefing.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Tự động bởi Trợ lý Kyros AI'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Morning / Evening Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-app)',
                borderRadius: '8px',
                padding: '3px',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setBriefingType('MORNING');
                  fetchBriefing('MORNING');
                }}
                style={{
                  background:
                    briefingType === 'MORNING'
                      ? 'var(--bg-card)'
                      : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color:
                    briefingType === 'MORNING'
                      ? '#d97706'
                      : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sun size={13} /> Sáng
              </button>
              <button
                type="button"
                onClick={() => {
                  setBriefingType('EVENING');
                  fetchBriefing('EVENING');
                }}
                style={{
                  background:
                    briefingType === 'EVENING'
                      ? 'var(--bg-card)'
                      : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color:
                    briefingType === 'EVENING'
                      ? '#7c3aed'
                      : 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Moon size={13} /> Tối
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {isLoading ? (
            <div
              style={{
                padding: '50px 20px',
                textAlign: 'center',
                color: 'var(--text-muted)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Sparkles
                size={32}
                className="animate-spin"
                style={{ color: 'var(--color-primary)' }}
              />
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                Đang tổng hợp lịch trình và nhiệm vụ trọng tâm hôm nay...
              </span>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                color: 'var(--color-danger)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              <p style={{ margin: 0, fontWeight: 500 }}>{error}</p>
              <button
                className="btn btn-secondary"
                onClick={generateNewBriefing}
                style={{ marginTop: '12px', fontSize: '12px' }}
              >
                Sinh bản tin mới ngay
              </button>
            </div>
          ) : (
            <>
              {/* Stat Highlights Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.08)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Calendar size={22} style={{ color: '#3b82f6' }} />
                  <div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#3b82f6',
                      }}
                    >
                      {totalEvents}
                    </div>
                    <div
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      Cuộc họp & Lịch trình
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <CheckSquare size={22} style={{ color: '#ef4444' }} />
                  <div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#ef4444',
                      }}
                    >
                      {totalTasks}
                    </div>
                    <div
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      Task cần giải quyết
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <CheckCircle size={22} style={{ color: '#10b981' }} />
                  <div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '800',
                        color: '#10b981',
                      }}
                    >
                      {totalCompleted}
                    </div>
                    <div
                      style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                    >
                      Đã hoàn tất
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Executive Briefing Body (Markdown) */}
              <div
                style={{
                  backgroundColor: 'var(--bg-app)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '20px 22px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'var(--color-primary)',
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <Sparkles size={15} /> Tóm tắt điều hành & Lộ trình hôm nay
                </div>

                {markdownText ? (
                  <div
                    className="markdown-body"
                    style={{ fontSize: '14px', lineHeight: '1.75' }}
                  >
                    <ReactMarkdown>{markdownText}</ReactMarkdown>
                  </div>
                ) : (
                  <p
                    style={{
                      margin: 0,
                      color: 'var(--text-muted)',
                      fontSize: '13px',
                    }}
                  >
                    Không có thông tin lịch trình hoặc task tồn đọng cho ngày
                    hôm nay. Chúc bạn một ngày làm việc hiệu quả!
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-app)',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={generateNewBriefing}
            disabled={isGenerating || isLoading}
            style={{ fontSize: '13px', gap: '6px' }}
          >
            <RefreshCw
              size={14}
              className={isGenerating ? 'animate-spin' : ''}
            />
            <span>{isGenerating ? 'Đang tạo mới...' : 'Làm mới bằng AI'}</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartDay}
            style={{ fontSize: '13px', gap: '6px', padding: '10px 22px' }}
          >
            <span>Bắt đầu ngày mới</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
