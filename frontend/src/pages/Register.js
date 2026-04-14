import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import Logo from '../components/Logo';

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, isAuthenticated } = useAuth();

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

            <div className="mb-6 rounded-lg border border-[#0F5257]/20 bg-[#0F5257]/10 px-4 py-3 text-sm text-[#CDECEE] text-center">
              El acceso con Google está temporalmente en revisión. Regístrate con email y contraseña.
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
              <Link
                to="/login"
                className="text-[#0F5257] hover:text-[#136970] transition-colors"
                data-testid="login-link"
              >
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
