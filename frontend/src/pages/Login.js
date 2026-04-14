import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import GoogleSignInButton from '../components/GoogleSignInButton';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

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
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-8">
            <Logo size="xlarge" />
          </div>

          <div className="bg-[#171717] border border-white/10 rounded-2xl p-8">
            <h1 className="text-2xl font-light text-white text-center mb-2" data-testid="login-title">
              Iniciar sesión
            </h1>
            <p className="text-[#A3A3A3] text-center mb-8">
              Accede a tu cuenta para continuar
            </p>

            <GoogleSignInButton
              redirectPath={location.state?.from?.pathname || '/dashboard'}
            />

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[#A3A3A3] text-sm">o</span>
              <div className="flex-1 h-px bg-white/10"></div>
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
                  <div className="spinner"></div>
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
                className="text-[#0F5257] hover:text-[#136970] transition-colors"
                data-testid="register-link"
              >
                Regístrate
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
