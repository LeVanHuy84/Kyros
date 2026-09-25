import React from 'react';
import { AlertTriangle, Check, X, ShieldAlert, Terminal } from 'lucide-react';

export interface PendingApprovalData {
  toolName: string;
  argumentsJson: string;
  reason: string;
}

interface ApprovalBannerProps {
  pendingApproval: PendingApprovalData | null;
  onApprove: () => void;
  onCancel: () => void;
}

export const ApprovalBanner: React.FC<ApprovalBannerProps> = ({
  pendingApproval,
  onApprove,
  onCancel,
}) => {
  if (!pendingApproval) return null;

  let parsedArgs: Record<string, any> = {};
  try {
    parsedArgs = JSON.parse(pendingApproval.argumentsJson || '{}');
  } catch {
    parsedArgs = { raw: pendingApproval.argumentsJson };
  }

  return (
    <div
      className="card fade-in-slide-up"
      style={{
        margin: '16px 20px',
        border: '1px solid rgba(234, 179, 8, 0.4)',
        backgroundColor: 'rgba(234, 179, 8, 0.06)',
        boxShadow: '0 8px 30px rgba(234, 179, 8, 0.12)',
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
              backgroundColor: 'rgba(234, 179, 8, 0.15)',
              color: '#eab308',
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
              Yêu cầu Phê duyệt Hành động Nhạy cảm
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'rgba(234, 179, 8, 0.2)',
                  color: '#ca8a04',
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
            style={{ color: '#eab308', flexShrink: 0, marginTop: '2px' }}
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
              Tham số thực thi:
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
                    padding: '2px 8px',
                    borderRadius: '4px',
                    color: 'var(--text-main)',
                  }}
                >
                  <strong style={{ color: 'var(--text-muted)' }}>{key}:</strong>{' '}
                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
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
          onClick={onCancel}
          style={{ padding: '8px 16px', fontSize: '13px', gap: '6px' }}
        >
          <X size={15} />
          <span>Từ chối</span>
        </button>
        <button
          className="btn btn-primary"
          onClick={onApprove}
          style={{
            backgroundColor: '#eab308',
            borderColor: '#eab308',
            color: '#000',
            fontWeight: 600,
            padding: '8px 18px',
            fontSize: '13px',
            gap: '6px',
          }}
        >
          <Check size={16} />
          <span>Đồng ý & Phê duyệt</span>
        </button>
      </div>
    </div>
  );
};
