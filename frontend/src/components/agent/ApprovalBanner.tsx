import React from 'react';
import { AlertTriangle, Check } from 'lucide-react';

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

  return (
    <div
      className="card"
      style={{
        border: '2px solid #eab308',
        backgroundColor: 'rgba(234, 179, 8, 0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertTriangle size={24} style={{ color: '#eab308' }} />
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            margin: 0,
            color: '#eab308',
          }}
        >
          Yêu cầu Phê duyệt Thao tác Nguy hiểm
        </h3>
      </div>
      <p
        style={{
          margin: '12px 0',
          fontSize: '14px',
          color: 'var(--text-main)',
        }}
      >
        <strong>Lý do:</strong> {pendingApproval.reason}
        <br />
        <strong>Công cụ:</strong> <code>{pendingApproval.toolName}</code>
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          className="btn btn-primary"
          onClick={onApprove}
          style={{ backgroundColor: '#eab308', borderColor: '#eab308' }}
        >
          <Check size={16} />
          <span>Phê duyệt và Thực thi</span>
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Hủy thao tác
        </button>
      </div>
    </div>
  );
};
