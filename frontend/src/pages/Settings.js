import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  EnvelopeSimple,
  CheckCircle,
  Warning
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Settings = () => {
  const { user, checkAuth } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(
        `${API_URL}/api/user/profile`,
        { name },
        { withCredentials: true }
      );
      await checkAuth();
      toast.success('Perfil actualizado');
    } catch (error) {
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout title="Ajustes">
      <div className="max-w-2xl mx-auto">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
          data-testid="profile-section"
        >
          <h3 className="text-lg font-medium text-white mb-6">Perfil</h3>

          <form onSubmit={handleSave}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#A3A3A3] mb-2">Nombre</label>
                <div className="relative">
                  <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tu nombre"
                    className="input-premium pl-12"
                    data-testid="settings-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[#A3A3A3] mb-2">Email</label>
                <div className="relative">
                  <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-premium pl-12 opacity-50 cursor-not-allowed"
                    data-testid="settings-email"
                  />
                </div>
                <p className="text-xs text-[#A3A3A3] mt-1">El email no se puede cambiar</p>
              </div>

              <button
                type="submit"
                disabled={saving || name === user?.name}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
                data-testid="save-profile-btn"
              >
                {saving ? (
                  <div className="spinner w-4 h-4"></div>
                ) : (
                  <CheckCircle size={18} />
                )}
                Guardar cambios
              </button>
            </div>
          </form>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-6"
          data-testid="account-section"
        >
          <h3 className="text-lg font-medium text-white mb-6">Cuenta</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-[#A3A3A3]">Plan actual</span>
              <span className="text-white capitalize font-medium">{user?.plan || 'Gratis'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-[#A3A3A3]">Rol</span>
              <span className="text-white capitalize">{user?.role || 'Usuario'}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#262626]">
              <span className="text-[#A3A3A3]">Miembro desde</span>
              <span className="text-white">{formatDate(user?.created_at)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-[#A3A3A3]">ID de usuario</span>
              <span className="text-white font-mono text-sm">{user?.user_id || '-'}</span>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card border-red-500/20"
          data-testid="danger-section"
        >
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <Warning size={20} className="text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Zona de peligro</h3>
              <p className="text-[#A3A3A3] text-sm mb-4">
                Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate.
              </p>
              <button
                className="px-4 py-2 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors text-sm"
                onClick={() => toast.info('Contacta a soporte para eliminar tu cuenta')}
                data-testid="delete-account-btn"
              >
                Eliminar cuenta
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
