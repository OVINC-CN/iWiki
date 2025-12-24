import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { signIn } from '../api';
import { Loading } from '../components/Loading';
import { useApp } from '../contexts/useApp';

export const LoginCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useApp();

  useEffect(() => {
    const handleLogin = async () => {
      try {
        const code = searchParams.get('code');
        if (!code) {
          throw new Error('No code provided');
        }
        await signIn(code);
        
        // Get redirect URL from params
        const redirect = searchParams.get('redirect');
        if (redirect) {
          try {
            const url = new URL(decodeURIComponent(redirect));
            // Only redirect to same origin for security
            if (url.origin === window.location.origin) {
              window.location.href = redirect;
              return;
            }
          } catch {
            // Invalid URL, ignore
          }
        }
        
        navigate('/', { replace: true });
      } catch {
        navigate('/', { replace: true });
      }
    };

    handleLogin();
  }, [searchParams, navigate]);

  return <Loading fullPage text={t.login.loggingIn} />;
};

export default LoginCallback;
