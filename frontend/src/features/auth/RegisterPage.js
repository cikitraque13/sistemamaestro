import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import GoogleSignInButton from '../../components/GoogleSignInButton';
import AuthScreenShell from './components/AuthScreenShell';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputData = location.state || {};

  const authRedirect = useMemo(() => {
    if (inputData.inputContent) {
      return {
        path: '/flow',
        state: inputData
      };
    }

    return {
      path: '/dashboard',
      state: null
    };
  }, [inputData]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(authRedirect.path, {
        state: authRedirect.state || undefined,
        replace: true
      });
    }
  }, [isAuthenticated, navigate, authRedirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    const result = await register(email, password, name);

    if (result.success) {
      toast.success('Cuenta creada correctamente');
      navigate(authRedirect.path, {
        state: authRedirect.state || undefined,
        replace: true
      });
    } else {
      setError(result.error);
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <AuthScreenShell
      badgeLabel="Auth / Register"
      title="Crear cuenta"
      subtitle="Empieza gratis y entra al sistema con una base limpia."
      statusLabel="acceso seguro · activación inicial"
    >
      <GoogleSignInButton
        redirectPath={authRedirect.path}
        redirectState={authRedirect.state}
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
            data-testid="register-error"
          >
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm text-[#A3A3A3] mb-2">Nombre</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            className="input-premium"
            required
            data-testid="register-name"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm text-[#A3A3A3] mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input-premium"
            required
            data-testid="register-email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm text-[#A3A3A3] mb-2">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input-premium"
            required
            minLength={6}
            data-testid="register-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="register-submit"
        >
          {loading ? (
            <div className="spinner" />
          ) : (
            <>
              Crear cuenta
              <ArrowRight weight="bold" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-[#A3A3A3] text-sm mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link
          to="/login"
          className="text-[#0F5257] hover:text-[#39ff88] transition-colors"
          data-testid="login-link"
        >
          Inicia sesión
        </Link>
      </p>
    </AuthScreenShell>
  );
};

export default RegisterPage;