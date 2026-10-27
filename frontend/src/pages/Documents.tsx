import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { DocumentsTab } from '../components/settings/DocumentsTab';

export const Documents: React.FC = () => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Success alert toast */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: '#10B981',
            color: 'white',
            padding: '12px 24px',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 9999,
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error alert box */}
      {errorMsg && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            border: '1px solid #F87171',
            color: '#991B1B',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{errorMsg}</span>
          <button
            onClick={() => setErrorMsg(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          padding: '28px',
        }}
      >
        <DocumentsTab
          onSuccess={(msg) => {
            setSuccessMsg(msg);
            setErrorMsg(null);
          }}
          onError={(msg) => setErrorMsg(msg)}
        />
      </div>
    </div>
  );
};

export default Documents;
