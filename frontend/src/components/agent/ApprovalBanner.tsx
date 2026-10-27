import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  X,
  ShieldAlert,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

export interface PendingApprovalData {
  toolName: string;
  argumentsJson: string;
  reason: string;
}

interface ApprovalBannerProps {
  pendingApproval: PendingApprovalData | null;
  onApprove: () => Promise<void> | void;
  onCancel: () => void;
  isInline?: boolean;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({
  pendingApproval,
  onApprove,
  onCancel,
  isInline = false,
}) => {
  const [actionState, setActionState] = useState<
    'idle' | 'approving' | 'approved' | 'rejected'
  >('idle');

  if (!pendingApproval && actionState === 'idle') return null;

  let parsedArgs: Record<string, any> = {};
  if (pendingApproval) {
    try {
      parsedArgs = JSON.parse(pendingApproval.argumentsJson || '{}');
    } catch {
      parsedArgs = { raw: pendingApproval.argumentsJson };
    }
  }

  const handleConfirm = async () => {
    setActionState('approving');
    try {
      await onApprove();
      setActionState('approved');
      setTimeout(() => {
        setActionState('idle');
      }, 3500);
    } catch {
      setActionState('idle');
    }
  };

  const handleReject = () => {
    setActionState('rejected');
    onCancel();
    setTimeout(() => {
      setActionState('idle');
    }, 2500);
  };

  if (actionState === 'approved') {
    return (
      <div
        className="fade-in-slide-up"
        style={{
          margin: isInline ? '10px 0' : '16px 20px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md, 12px)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '13px',
        }}
      >
        <CheckCircle2 size={18} />
        <span>Đã phê duyệt & thực thi thành công!</span>
      </div>
    );
  }

  if (actionState === 'rejected') {
    return (
      <div
        className="fade-in-slide-up"
        style={{
          margin: isInline ? '10px 0' : '16px 20px',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md, 12px)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '13px',
        }}
      >
        <XCircle size={18} />
        <span>Đã từ chối thực thi hành động nhạy cảm.</span>
      </div>
    );
  }

  if (!pendingApproval) return null;

  const isDeleteAction =
    pendingApproval.toolName.toLowerCase().includes('delete') ||
    pendingApproval.reason.toLowerCase().includes('xóa');

  return (
    <div
      className="card fade-in-slide-up"
      style={{
        margin: isInline ? '10px 0' : '16px 20px',
        border: isDeleteAction
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid rgba(234, 179, 8, 0.4)',
        backgroundColor: isDeleteAction
          ? 'rgba(239, 68, 68, 0.05)'
          : 'rgba(234, 179, 8, 0.06)',
        boxShadow: isDeleteAction
          ? '0 8px 30px rgba(239, 68, 68, 0.12)'
          : '0 8px 30px rgba(234, 179, 8, 0.12)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Header with Danger Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: isDeleteAction
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(234, 179, 8, 0.15)',
              color: isDeleteAction ? '#ef4444' : '#eab308',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={20} />
          </div>
          <div>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: '700',
                margin: 0,
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {isDeleteAction
                ? '⚠️ Yêu cầu Xác nhận Xóa Dữ liệu'
                : '⚠️ Yêu cầu Phê duyệt Hành động Nhạy cảm'}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: isDeleteAction
                    ? 'rgba(239, 68, 68, 0.2)'
                    : 'rgba(234, 179, 8, 0.2)',
                  color: isDeleteAction ? '#dc2626' : '#ca8a04',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Cần xác nhận
              </span>
            </h4>
            <p
              style={{
                margin: '2px 0 0 0',
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              Agent đang yêu cầu cấp quyền thực thi công cụ hệ thống.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono, monospace)',
              backgroundColor: 'var(--bg-app)',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Terminal size={12} style={{ color: 'var(--color-primary)' }} />
            {pendingApproval.toolName}
          </span>
        </div>
      </div>

      {/* Reason Box */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '12px 14px',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          fontSize: '13px',
          lineHeight: '1.5',
          color: 'var(--text-main)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <AlertTriangle
            size={16}
            style={{
              color: isDeleteAction ? '#ef4444' : '#eab308',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div>
            <strong>Lý do kiểm soát:</strong> {pendingApproval.reason}
          </div>
        </div>

        {/* Parsed Arguments Preview */}
        {Object.keys(parsedArgs).length > 0 && (
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed var(--border-color)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              Chi tiết mục tác động:
            </div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {Object.entries(parsedArgs).map(([key, val]) => (
                <span
                  key={key}
                  style={{
                    fontSize: '12px',
                    backgroundColor: 'var(--bg-app)',
                    border: '1px solid var(--border-color)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    color: 'var(--text-main)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <strong style={{ color: 'var(--text-muted)' }}>{key}:</strong>{' '}
                  <span style={{ fontWeight: 500 }}>
                    {typeof val === 'object'
                      ? JSON.stringify(val)
                      : String(val)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <button
          className="btn btn-secondary"
          onClick={handleReject}
          disabled={actionState === 'approving'}
          style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
        >
          <X size={15} />
          <span>Từ chối</span>
        </button>
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={actionState === 'approving'}
          style={{
            backgroundColor: isDeleteAction ? '#ef4444' : '#eab308',
            borderColor: isDeleteAction ? '#ef4444' : '#eab308',
            color: isDeleteAction ? '#fff' : '#000',
            fontWeight: 600,
            padding: '8px 18px',
            fontSize: '13px',
            gap: '6px',
          }}
        >
          {actionState === 'approving' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Đang thực thi...</span>
            </>
          ) : (
            <>
              <Check size={16} />
              <span>Đồng ý thực thi</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
