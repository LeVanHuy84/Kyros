import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../services/api-client';
import { ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('operator@assistant.ai');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Verification Resend States
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Mount Guard: Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/agent');
    }
  }, [isAuthenticated, navigate]);

  const handleToggleMode = () => {
    setIsRegister(!isRegister);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setError('');
    setShowResend(false);
    setResendSuccess(false);
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');
    try {
      await apiClient.post('/auth/resend-verification', { email });
      setResendSuccess(true);
      setShowResend(false);
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendSuccess(false);
    setShowResend(false);

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isRegister) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please re-enter.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      navigate('/agent');
    } catch (err: any) {
      console.error(err);
      const msg =
        err.friendlyMessage ||
        (isRegister
          ? 'Registration failed. This email may already be registered.'
          : 'Sign in failed. Please verify your email and password.');
      setError(msg);
      if (
        msg.toLowerCase().includes('verify your email') ||
        msg.toLowerCase().includes('not verified')
      ) {
        setShowResend(true);
      }
    } finally {
      setIsLoading(false);
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
        className="auth-card"
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-lg)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-sm)',
              padding: '12px',
            }}
          >
            <img
              src="/favicon.svg"
              alt="Kyros Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: '8px 0 0 0',
              letterSpacing: '-0.5px',
            }}
          >
            {isRegister ? 'Create an account' : 'Sign in to Kyros'}
          </h2>
          <p
            style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}
          >
            AI Executive Assistant Coordinator
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--color-danger)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: 'var(--color-danger)',
              fontSize: '13px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              lineHeight: '1.4',
              textAlign: 'left',
            }}
          >
            <span>{error}</span>
            {showResend && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  outline: 'none',
                }}
              >
                {resendLoading && (
                  <Loader2
                    size={12}
                    style={{ animation: 'spin 1s linear infinite' }}
                  />
                )}
                Resend Verification Email
              </button>
            )}
          </div>
        )}

        {resendSuccess && (
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid var(--color-success)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              color: 'var(--color-success)',
              fontSize: '13px',
              lineHeight: '1.4',
            }}
          >
            A new email verification link has been sent. Please check your
            inbox.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-muted)',
              }}
            >
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                outline: 'none',
                transition: 'border-color var(--transition-fast)',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                }}
              >
                Password
              </label>
              {!isRegister && (
                <a href="#" style={{ fontSize: '12px' }}>
                  Forgot password?
                </a>
              )}
            </div>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-app)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  transition: 'border-color var(--transition-fast)',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  outline: 'none',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
            >
              <label
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--text-muted)',
                }}
              >
                Confirm Password
              </label>
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-app)',
                    color: 'var(--text-main)',
                    outline: 'none',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px',
                    outline: 'none',
                  }}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'var(--color-primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              boxShadow: 'var(--shadow-sm)',
              transition: 'opacity var(--transition-fast)',
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {isLoading && (
              <Loader2
                size={16}
                style={{ animation: 'spin 1s linear infinite' }}
              />
            )}
            <span>{isRegister ? 'Register' : 'Sign In'}</span>
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '-8px' }}>
          <button
            type="button"
            onClick={handleToggleMode}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary)',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Register"}
          </button>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            color: 'var(--text-muted)',
          }}
        >
          <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
          <span>
            Tip: Use <strong>operator@assistant.ai</strong> for Operator views.
          </span>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Login;
