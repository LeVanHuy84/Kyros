import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (isAuthenticated) {
      navigate('/agent');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-app)',
        fontFamily: 'var(--font-sans)',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <div
        className="card fade-in-slide-up"
        style={{
          maxWidth: '480px',
          width: '100%',
          alignItems: 'center',
          padding: '48px',
          gap: '28px',
        }}
      >
        {/* Glow Icon Ring */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            border: '1px solid rgba(79, 70, 229, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
            boxShadow: '0 0 20px rgba(79, 70, 229, 0.05)',
          }}
        >
          <FileQuestion size={40} />
        </div>

        {/* Text Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h1
            style={{
              fontSize: '72px',
              fontWeight: '800',
              margin: 0,
              lineHeight: 1,
              background:
                'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-2px',
            }}
          >
            404
          </h1>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: '600',
              color: 'var(--text-main)',
              margin: '8px 0 0 0',
            }}
          >
            Page Not Found
          </h2>
          <p
            style={{
              color: 'var(--text-muted)',
              fontSize: '15px',
              margin: '4px 0 0 0',
              lineHeight: '1.6',
            }}
          >
            The requested page does not exist or has been relocated within the
            Kyros tenant directory.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleGoBack}
          className="btn btn-primary"
          style={{
            width: '100%',
            height: '48px',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <ArrowLeft size={16} />
          <span>
            {isAuthenticated ? 'Return to Dashboard' : 'Return to Sign In'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
