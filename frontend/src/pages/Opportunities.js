import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lightbulb,
  TrendUp,
  Lock,
  ArrowRight,
  Sparkle,
  CurrencyDollar,
  Gauge
} from '@phosphor-icons/react';
import axios from 'axios';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROUTE_NAMES = {
  improve_existing: 'Mejorar existente',
  sell_and_charge: 'Vender y cobrar',
  automate_operation: 'Automatizar',
  idea_to_project: 'Idea a proyecto'
};

const DIFFICULTY_BADGES = {
  baja: { label: 'Fácil', color: 'bg-green-500/20 text-green-400' },
  media: { label: 'Media', color: 'bg-yellow-500/20 text-yellow-400' },
  alta: { label: 'Avanzada', color: 'bg-red-500/20 text-red-400' }
};

const Opportunities = () => {
  const { user } = useAuth();
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpp, setSelectedOpp] = useState(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/opportunities`, { withCredentials: true });
      setOpportunities(response.data);
    } catch (error) {
      toast.error('Error al cargar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  const canAccessAll = user?.plan === 'premium';
  const isLimited = user?.plan === 'free' && opportunities.length <= 2;

  return (
    <DashboardLayout title="Oportunidades">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-light text-white mb-2" data-testid="opportunities-title">
                Oportunidades monetizables
              </h2>
              <p className="text-[#A3A3A3]">
                Ideas de negocio digital con modelo de monetización y pasos concretos.
              </p>
            </div>
            {!canAccessAll && (
              <Link 
                to="/dashboard/billing"
                className="btn-secondary text-sm flex items-center gap-2"
                data-testid="upgrade-btn"
              >
                <Lock size={16} />
                Desbloquear más
              </Link>
            )}
          </div>
        </motion.div>

        {/* Opportunities Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.opportunity_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card cursor-pointer hover:border-[#0F5257]/50"
                onClick={() => setSelectedOpp(opp)}
                data-testid={`opportunity-${opp.opportunity_id}`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                    <Lightbulb size={24} className="text-[#0F5257]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg text-white font-medium mb-1">{opp.title}</h3>
                    <p className="text-[#A3A3A3] text-sm line-clamp-2">{opp.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="px-2 py-1 bg-[#0F5257]/10 text-[#0F5257] rounded text-xs">
                    {ROUTE_NAMES[opp.recommended_route]}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs ${DIFFICULTY_BADGES[opp.difficulty]?.color || DIFFICULTY_BADGES.media.color}`}>
                    {DIFFICULTY_BADGES[opp.difficulty]?.label || 'Media'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-[#A3A3A3] flex items-center gap-1">
                    <CurrencyDollar size={16} />
                    {opp.monetization_model.substring(0, 40)}...
                  </span>
                  <span className="text-[#0F5257] flex items-center gap-1">
                    Ver detalles
                    <ArrowRight size={14} />
                  </span>
                </div>
              </motion.div>
            ))}

            {/* Locked Opportunities Placeholder */}
            {isLimited && (
              <>
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={`locked-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (opportunities.length + i) * 0.1 }}
                    className="card opacity-50 cursor-not-allowed relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] to-transparent z-10 flex items-end justify-center pb-6">
                      <Link 
                        to="/dashboard/billing"
                        className="btn-primary text-sm flex items-center gap-2"
                      >
                        <Lock size={14} />
                        Desbloquear
                      </Link>
                    </div>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-[#262626] rounded-lg">
                        <Lightbulb size={24} className="text-[#A3A3A3]" />
                      </div>
                      <div className="flex-1">
                        <div className="h-5 bg-[#262626] rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-[#262626] rounded w-full"></div>
                        <div className="h-4 bg-[#262626] rounded w-2/3 mt-1"></div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Opportunity Detail Modal */}
        {selectedOpp && (
          <div 
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6"
            onClick={() => setSelectedOpp(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#171717] border border-[#262626] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              data-testid="opportunity-modal"
            >
              <div className="p-6 border-b border-[#262626]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                      <Sparkle size={24} className="text-[#0F5257]" />
                    </div>
                    <div>
                      <h3 className="text-xl text-white font-medium">{selectedOpp.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-[#0F5257]/10 text-[#0F5257] rounded text-xs">
                          {ROUTE_NAMES[selectedOpp.recommended_route]}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${DIFFICULTY_BADGES[selectedOpp.difficulty]?.color}`}>
                          <Gauge size={12} className="inline mr-1" />
                          {DIFFICULTY_BADGES[selectedOpp.difficulty]?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="text-[#A3A3A3] hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Descripción</p>
                  <p className="text-white">{selectedOpp.description}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Lógica de negocio</p>
                  <p className="text-white">{selectedOpp.business_logic}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Modelo de monetización</p>
                  <div className="bg-[#0A0A0A] rounded-lg p-4">
                    <CurrencyDollar size={20} className="text-[#0F5257] mb-2" />
                    <p className="text-white">{selectedOpp.monetization_model}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Formato del activo digital</p>
                  <p className="text-white">{selectedOpp.digital_asset_format}</p>
                </div>

                <div>
                  <p className="text-sm text-[#A3A3A3] mb-2">Primeros pasos</p>
                  <ol className="space-y-2">
                    {selectedOpp.first_steps.map((step, index) => (
                      <li key={index} className="flex items-start gap-3 text-white">
                        <span className="w-6 h-6 rounded-full bg-[#0F5257]/20 text-[#0F5257] text-sm flex items-center justify-center flex-shrink-0">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="pt-4 border-t border-[#262626]">
                  <Link
                    to="/flow"
                    state={{ 
                      inputType: 'text', 
                      inputContent: `Quiero desarrollar: ${selectedOpp.title}. ${selectedOpp.description}` 
                    }}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                    onClick={() => setSelectedOpp(null)}
                  >
                    Comenzar con esta idea
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Opportunities;
