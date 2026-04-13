import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../components/Logo';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle, isAuthenticated } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const inputData = location.state || {};

  React.useEffect(() => {
    if (isAuthenticated) {
      if (inputData.inputContent) {
        navigate('/flow', { state: inputData, replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, navigate, inputData]);

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
      if (inputData.inputContent) {
        navigate('/flow', { state: inputData, replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
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
            <h1 className="text-2xl font-light text-white text-center mb-2" data-testid="register-title">
              Crear cuenta
            </h1>
            <p className="text-[#A3A3A3] text-center mb-8">
              Empieza gratis, sin tarjeta de crédito
            </p>

            <button
              onClick={() =>
                loginWithGoogle(
                  inputData.inputContent
                    ? {
                        redirectPath: '/flow',
                        redirectState: inputData
                      }
                    : {
                        redirectPath: '/dashboard'
                      }
                )
              }
              className="w-full flex items-center justify-center gap-3 bg-white text-[#1f1f1f] py-3.5 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm mb-6"
              data-testid="google-register-btn"
            >
              <GoogleIcon />
              <span className="text-sm font-medium">Continuar con Google</span>
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-[#A3A3A3] text-sm">o</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-red-400 text-sm" data-testid="register-error">
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
                  <div className="spinner"></div>
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
              <Link to="/login" className="text-[#0F5257] hover:text-[#136970] transition-colors" data-testid="login-link">
                Inicia sesión
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
