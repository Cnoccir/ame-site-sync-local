import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const SimpleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Google authentication...');

  useEffect(() => {
    console.log('SimpleCallback mounted');
    console.log('Search params:', searchParams.toString());
    
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const authCode = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!authCode) {
        throw new Error('No authorization code received');
      }

      console.log('Auth code received:', authCode.substring(0, 20) + '...');
      
      setStatus('success');
      setMessage(`Successfully received authorization code! Length: ${authCode.length}`);

      // Redirect back after 3 seconds
      setTimeout(() => {
        navigate('/admin');
      }, 3000);

    } catch (error) {
      console.error('Callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f3f4f6', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{ marginBottom: '20px', color: '#1f2937' }}>
          OAuth Callback Test
        </h1>
        
        <div style={{ 
          width: '40px', 
          height: '40px', 
          border: status === 'processing' ? '4px solid #e5e7eb' : 'none',
          borderTop: status === 'processing' ? '4px solid #3b82f6' : 'none',
          borderRadius: '50%',
          animation: status === 'processing' ? 'spin 1s linear infinite' : 'none',
          margin: '0 auto 20px',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <p style={{ color: '#6b7280', marginBottom: '20px' }}>
          {message}
        </p>

        {status === 'success' && (
          <p style={{ color: '#059669', fontSize: '14px' }}>
            Redirecting to admin panel in 3 seconds...
          </p>
        )}

        {status === 'error' && (
          <button 
            onClick={() => navigate('/admin')}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go Back to Admin
          </button>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};
