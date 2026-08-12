import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/api-client';
import { MailCheck, XCircle, Loader2 } from 'lucide-react';

// Cache in-flight verification requests to prevent React 18 Strict Mode double-firing in dev mode
const verificationCache: { [token: string]: Promise<any> } = {};

const Verify: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Missing email verification token.');
      return;
    }

    const verifyToken = async () => {
      if (!verificationCache[token]) {
        verificationCache[token] = apiClient.post('/auth/verify', { token });
      }
      try {
        await verificationCache[token];
        setStatus('success');
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(
          err.friendlyMessage || 'Invalid or expired verification token.'
        );
      }
    };

    verifyToken();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResendLoading(true);
    setResendSuccess(false);
    setErrorMsg('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setErrorMsg(
        err.friendlyMessage || 'Failed to resend verification email.'
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
      }}
    >
      <div
        className="card fade-in-slide-up"
        style={{
          maxWidth: '440px',
          width: '100%',
          alignItems: 'center',
          padding: '40px',
          gap: '24px',
          textAlign: 'center',
        }}
      >
        {status === 'loading' && (
          <>
            <Loader2
              size={48}
              style={{
                color: 'var(--color-primary)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Verifying Email
              </h2>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  margin: 0,
                }}
              >
                Verifying your registration link with Kyros...
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-success)',
              }}
            >
              <MailCheck size={36} />
            </div>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Email Verified!
              </h2>
              <p
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  margin: 0,
                  lineHeight: '1.5',
                }}
              >
                Your account is now active. You can proceed to sign in and
                configure your workspace.
              </p>
            </div>
            <button
              onClick={() => navigate('/')}
              className="btn btn-primary"
              style={{ width: '100%', height: '44px' }}
            >
              Go to Home
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-danger)',
              }}
            >
              <XCircle size={36} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                width: '100%',
              }}
            >
              <h2
                style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Verification Failed
              </h2>
              <p
                style={{
                  color: 'var(--color-danger)',
                  fontSize: '13px',
                  margin: '4px 0 0 0',
                  lineHeight: '1.4',
                }}
              >
                {errorMsg}
              </p>
            </div>

            {/* Resend Token Form */}
            <div
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '20px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                textAlign: 'left',
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                Need a new verification link?
              </h4>
              <form
                onSubmit={handleResend}
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    fontSize: '13px',
                  }}
                  required
                />
                <button
                  type="submit"
                  disabled={resendLoading}
                  className="btn btn-secondary"
                  style={{
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '13px',
                  }}
                >
                  {resendLoading && (
                    <Loader2
                      size={14}
                      style={{ animation: 'spin 1s linear infinite' }}
                    />
                  )}
                  <span>Resend Verification Link</span>
                </button>
              </form>
              {resendSuccess && (
                <p
                  style={{
                    fontSize: '13px',
                    color: 'var(--color-success)',
                    margin: 0,
                    fontWeight: '500',
                  }}
                >
                  A new verification link has been sent to your email.
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Verify;
