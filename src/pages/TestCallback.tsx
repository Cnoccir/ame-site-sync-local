import React from 'react';
import { useSearchParams } from 'react-router-dom';

export const TestCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const authCode = searchParams.get('code');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Test Callback Page</h1>
      <p>This page is working!</p>
      <p><strong>Auth Code:</strong> {authCode?.substring(0, 50)}...</p>
      <p><strong>All Params:</strong></p>
      <pre>{searchParams.toString()}</pre>
    </div>
  );
};
