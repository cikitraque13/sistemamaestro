import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const loadGoogleScript = () =>
  new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);

    if (existing) {
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google Sign-In')), {
        once: true
      });
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Sign-In'));
    document.head.appendChild(script);
  });

const GoogleSignInButton = ({ redirectPath = '/dashboard', redirectState = null }) => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { loginWithGoogleCredential } = useAuth();

  useEffect(() => {
    let active = true;

    const initGoogle = async () => {
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

      if (!clientId) {
        console.error('Falta REACT_APP_GOOGLE_CLIENT_ID');
        return;
      }

      try {
        await loadGoogleScript();

        if (!active || !window.google?.accounts?.id || !buttonRef.current) return;

        buttonRef.current.innerHTML = '';

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            const result = await loginWithGoogleCredential(response.credential);

            if (result.success) {
              toast.success('Sesión iniciada correctamente');
              navigate(redirectPath, {
                replace: true,
                state: redirectState
              });
            } else {
              toast.error(result.error || 'Error al iniciar sesión con Google');
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 360
        });
      } catch (error) {
        console.error(error);
      }
    };

    initGoogle();

    return () => {
      active = false;
    };
  }, [loginWithGoogleCredential, navigate, redirectPath, redirectState]);

  return <div className="w-full flex justify-center mb-6" ref={buttonRef} data-testid="google-auth-button" />;
};

export default GoogleSignInButton;
