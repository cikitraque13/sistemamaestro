import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import AuthScreenShell from './components/AuthScreenShell';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const callbackError = location.state?.error || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(callbackError);
  const callbackErrorShownRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  useEffect(() => {
    if (location.state?.error && !callbackErrorShownRef.current) {
      callbackErrorShownRef.current = true;
      toast.error(location.state.error);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success('Sesión iniciada correctamente');
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setError(result.error);
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <AuthScreenShell
      badgeLabel="Auth / Access"
      title="Iniciar sesión"
      subtitle="Accede a tu cuenta y continúa dentro del sistema."
      statusLabel="acceso seguro · continuidad de sesión"
    >
      <GoogleSignInButton
        redirectPath={location.state?.from?.pathname || '/dashboard'}
      />

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-[#A3A3A3] text-sm">o</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div
            className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm"
            data-testid="login-error"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-[#A3A3A3] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input-premium"
            required
            data-testid="login-email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-[#A3A3A3] mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input-premium"
            required
            data-testid="login-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="login-submit"
        >
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              Iniciar sesión
              <ArrowRight weight="bold" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[#A3A3A3] text-sm mt-6">
        ¿No tienes cuenta?{' '}
        <Link
          to="/register"
          className="text-[#0F5257] hover:text-[#39ff88] transition-colors"
          data-testid="register-link"
        >
          Regístrate
        </Link>
      </p>
    </AuthScreenShell>
  );
};

export default LoginPage;