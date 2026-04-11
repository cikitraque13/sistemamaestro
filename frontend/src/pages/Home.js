import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Globe, 
  Lightning, 
  Storefront, 
  Gear, 
  Lightbulb,
  CheckCircle,
  CaretDown,
  X,
  EnvelopeSimple
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const ROUTES = [
  {
    id: 'improve_existing',
    icon: Globe,
    title: 'Mejorar algo existente',
    description: 'Analiza una URL o activo digital y recibe un diagnóstico con propuestas de mejora.',
    color: '#0F5257'
  },
  {
    id: 'sell_and_charge',
    icon: Storefront,
    title: 'Vender y cobrar',
    description: 'Estructura tu propuesta comercial con el flujo y modelo de cobro correcto.',
    color: '#0F5257'
  },
  {
    id: 'automate_operation',
    icon: Gear,
    title: 'Automatizar operación',
    description: 'Identifica cuellos de botella y recibe un flujo de automatización priorizado.',
    color: '#0F5257'
  },
  {
    id: 'idea_to_project',
    icon: Lightbulb,
    title: 'Idea a proyecto',
    description: 'Convierte tu idea en un proyecto digital monetizable con arquitectura clara.',
    color: '#0F5257'
  }
];

const STEPS = [
  { num: '01', title: 'Interpretamos tu necesidad', desc: 'Analizamos tu entrada con IA para entender exactamente qué necesitas.' },
  { num: '02', title: 'Clasificamos en la ruta correcta', desc: 'Te asignamos el camino óptimo según tu caso específico.' },
  { num: '03', title: 'Devolvemos estructura clara', desc: 'Recibes diagnóstico, prioridades y siguiente paso concreto.' },
  { num: '04', title: 'Te ayudamos a activar', desc: 'Con blueprint y plan de despliegue para poner en marcha.' }
];

const BENEFITS = [
  'Diagnóstico inicial',
  'Ruta recomendada',
  'Blueprint estructurado',
  'Propuesta de monetización',
  'Plan de activación',
  'Orientación de despliegue'
];

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0',
    period: '',
    features: ['Diagnóstico inicial', 'Ruta recomendada', 'Resultado resumido', '2 oportunidades'],
    cta: 'Empezar gratis',
    highlight: false
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    price: '29',
    period: '/mes',
    features: ['Todo de Gratis', 'Estructura completa', 'Prioridades', 'Arquitectura recomendada', '4 oportunidades'],
    cta: 'Obtener Blueprint',
    highlight: false
  },
  {
    id: 'sistema',
    name: 'Sistema',
    price: '79',
    period: '/mes',
    features: ['Todo de Blueprint', 'Continuidad guiada', 'Mayor profundidad', 'Activación y despliegue', 'Guardado y progreso'],
    cta: 'Activar Sistema',
    highlight: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '199',
    period: '/mes',
    features: ['Todo de Sistema', 'Soporte prioritario', 'Personalización', 'Experiencia completa', 'Oportunidades ilimitadas'],
    cta: 'Ir a Premium',
    highlight: false
  }
];

const FAQ = [
  {
    q: '¿Qué tipo de entrada puedo usar?',
    a: 'Puedes describir tu necesidad en texto libre, pegar una URL para analizar un activo existente, o explicar una idea que quieres desarrollar.'
  },
  {
    q: '¿Qué recibo con el plan gratuito?',
    a: 'Un diagnóstico inicial, la ruta recomendada para tu caso y un resultado resumido con el siguiente paso claro.'
  },
  {
    q: '¿Qué es un Blueprint?',
    a: 'Es una estructura detallada con prioridades, arquitectura recomendada, modelo de monetización y pasos de despliegue para tu proyecto.'
  },
  {
    q: '¿Puedo cambiar de plan después?',
    a: 'Sí, puedes subir o bajar de plan en cualquier momento desde tu panel de facturación.'
  },
  {
    q: '¿Los proyectos se guardan?',
    a: 'Sí, todos tus proyectos y blueprints se guardan en tu dashboard para que puedas acceder cuando quieras.'
  }
];

// Cookie Banner Component
const CookieBanner = ({ onAccept }) => {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#171717] border-t border-[#262626]"
      data-testid="cookie-banner"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[#A3A3A3] text-sm text-center sm:text-left">
          Usamos cookies para mejorar tu experiencia. Al continuar, aceptas nuestra{' '}
          <a href="/privacy" className="text-[#0F5257] hover:underline">política de privacidad</a> y{' '}
          <a href="/cookies" className="text-[#0F5257] hover:underline">uso de cookies</a>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="px-6 py-2 bg-[#0F5257] text-white rounded-lg text-sm font-medium hover:bg-[#136970] transition-colors"
            data-testid="accept-cookies-btn"
          >
            Aceptar
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [inputMode, setInputMode] = useState('text');
  const [inputValue, setInputValue] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [showCookies, setShowCookies] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Check if cookies were already accepted
    const cookiesAccepted = localStorage.getItem('cookies_accepted');
    if (!cookiesAccepted) {
      setShowCookies(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookies_accepted', 'true');
    setShowCookies(false);
  };

  const handleStart = () => {
    if (isAuthenticated) {
      navigate('/flow', { state: { inputType: inputMode, inputContent: inputValue } });
    } else {
      navigate('/register', { state: { inputType: inputMode, inputContent: inputValue } });
    }
  };

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setSubscribing(true);
    try {
      await axios.post(`${API_URL}/api/newsletter/subscribe`, { email: newsletterEmail });
      toast.success('¡Suscripción exitosa!');
      setNewsletterEmail('');
    } catch (error) {
      if (error.response?.data?.subscribed) {
        toast.info('Ya estás suscrito');
      } else {
        toast.error('Error al suscribirse');
      }
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Cookie Banner */}
      <AnimatePresence>
        {showCookies && <CookieBanner onAccept={handleAcceptCookies} />}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-semibold text-white tracking-tight" data-testid="logo">
            Sistema Maestro
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#routes" className="text-[#A3A3A3] hover:text-white transition-colors">Rutas</a>
            <a href="#how" className="text-[#A3A3A3] hover:text-white transition-colors">Cómo funciona</a>
            <a href="#pricing" className="text-[#A3A3A3] hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="text-[#A3A3A3] hover:text-white transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary" data-testid="dashboard-btn">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-[#A3A3A3] hover:text-white transition-colors" data-testid="login-link">
                  Iniciar sesión
                </Link>
                <Link to="/register" className="btn-primary" data-testid="register-btn">
                  Empezar
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F5257]/5 to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight mb-6"
            data-testid="hero-title"
          >
            Explica tu necesidad
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-[#A3A3A3] mb-12 max-w-2xl mx-auto"
            data-testid="hero-subtitle"
          >
            Sistema Maestro transforma tu idea, necesidad o activo existente en una solución digital clara, monetizable y lista para ponerse en marcha.
          </motion.p>

          {/* Input Module */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#171717] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto"
            data-testid="input-module"
          >
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'text' 
                    ? 'bg-[#0F5257] text-white' 
                    : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
                }`}
                data-testid="tab-text"
              >
                Describe tu necesidad
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  inputMode === 'url' 
                    ? 'bg-[#0F5257] text-white' 
                    : 'bg-[#262626] text-[#A3A3A3] hover:text-white'
                }`}
                data-testid="tab-url"
              >
                Analiza una URL
              </button>
            </div>

            {/* Input Field */}
            {inputMode === 'text' ? (
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Describe tu idea, necesidad o problema que quieres resolver..."
                className="w-full h-32 bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none"
                data-testid="input-text"
              />
            ) : (
              <input
                type="url"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="https://tu-sitio-web.com"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all"
                data-testid="input-url"
              />
            )}

            <p className="text-sm text-[#A3A3A3] mt-3 mb-4">
              Obtén una ruta clara, un diagnóstico inicial y el siguiente paso recomendado.
            </p>

            <button
              onClick={handleStart}
              disabled={!inputValue.trim()}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="start-btn"
            >
              Empezar ahora
              <ArrowRight weight="bold" />
            </button>
          </motion.div>

          <motion.a
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            href="#how"
            className="inline-flex items-center gap-2 text-[#A3A3A3] hover:text-white mt-8 transition-colors"
          >
            Ver cómo funciona
            <CaretDown />
          </motion.a>
        </div>
      </section>

      {/* Routes Section */}
      <section id="routes" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4" data-testid="routes-title">
            Cuatro formas de avanzar
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12 max-w-xl mx-auto">
            Cada ruta te lleva al mismo destino: claridad, estructura y activación.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {ROUTES.map((route, index) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="route-card group"
                data-testid={`route-card-${route.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-[#0F5257]/20 rounded-lg">
                    <route.icon size={24} weight="duotone" className="text-[#0F5257]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">{route.title}</h3>
                    <p className="text-[#A3A3A3] text-sm">{route.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 px-6 bg-[#0A0A0A]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4" data-testid="how-title">
            Cómo te guiamos
          </h2>
          <p className="text-[#A3A3A3] text-center mb-16 max-w-xl mx-auto">
            Un proceso claro de principio a fin.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
                data-testid={`step-${step.num}`}
              >
                <div className="text-4xl font-light text-[#0F5257] mb-4">{step.num}</div>
                <h3 className="text-lg font-medium text-white mb-2">{step.title}</h3>
                <p className="text-sm text-[#A3A3A3]">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4" data-testid="benefits-title">
            Qué recibes
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12">
            Todo lo que necesitas para pasar de idea a ejecución.
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center gap-3 bg-[#171717] border border-white/5 rounded-lg px-4 py-3"
                data-testid={`benefit-${index}`}
              >
                <CheckCircle size={20} weight="fill" className="text-[#0F5257]" />
                <span className="text-white">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Results */}
      <section className="py-24 px-6 bg-[#171717]/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4" data-testid="examples-title">
            Ejemplos de resultado
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12 max-w-xl mx-auto">
            Así se ve una salida real del sistema.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                type: 'Mejorar web existente',
                finding: 'Tu página principal no tiene propuesta de valor clara en los primeros 3 segundos.',
                route: 'improve_existing',
                next: 'Desbloquea el blueprint para ver la estructura de hero optimizada.'
              },
              {
                type: 'Vender y cobrar',
                finding: 'Estás ofreciendo servicios sin un proceso de compra definido.',
                route: 'sell_and_charge',
                next: 'Desbloquea el blueprint para ver el flujo de venta recomendado.'
              },
              {
                type: 'Automatizar operación',
                finding: 'El cuello de botella está en la gestión manual de leads.',
                route: 'automate_operation',
                next: 'Desbloquea el blueprint para ver el flujo de automatización.'
              },
              {
                type: 'Idea a proyecto',
                finding: 'Tu idea tiene potencial como micro-SaaS de nicho.',
                route: 'idea_to_project',
                next: 'Desbloquea el blueprint para ver la arquitectura mínima.'
              }
            ].map((example, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card"
                data-testid={`example-${index}`}
              >
                <div className="text-xs text-[#0F5257] font-medium uppercase tracking-wider mb-3">
                  {example.type}
                </div>
                <p className="text-white mb-4">"{example.finding}"</p>
                <div className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                  <Lightning weight="fill" className="text-[#0F5257]" />
                  {example.next}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiation */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-12" data-testid="diff-title">
            Lo que hace diferente a Sistema Maestro
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { no: 'No empiezas desde cero', yes: 'Empiezas con estructura' },
              { no: 'No te pierdes entre herramientas', yes: 'Recibes una ruta clara' },
              { no: 'No dependes de un proceso caótico', yes: 'Sigues un sistema guiado' },
              { no: 'No recibes solo ideas', yes: 'Recibes planes de activación' }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-[#171717] border border-white/5 rounded-xl p-5"
                data-testid={`diff-${index}`}
              >
                <div className="flex items-center gap-2 text-[#A3A3A3] text-sm mb-2">
                  <X size={16} className="text-red-400/60" />
                  {item.no}
                </div>
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle size={16} weight="fill" className="text-[#0F5257]" />
                  {item.yes}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-[#171717]/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4" data-testid="pricing-title">
            Planes y precios
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12 max-w-xl mx-auto">
            Elige el nivel que mejor se adapte a tu momento.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`bg-[#171717] border rounded-xl p-6 relative ${
                  plan.highlight 
                    ? 'border-[#0F5257] pricing-highlight' 
                    : 'border-white/5'
                }`}
                data-testid={`plan-${plan.id}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#0F5257] rounded-full text-xs font-medium text-white">
                    Recomendado
                  </div>
                )}
                <h3 className="text-lg font-medium text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-3xl font-light text-white">€{plan.price}</span>
                  <span className="text-[#A3A3A3]">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-[#A3A3A3]">
                      <CheckCircle size={16} weight="fill" className="text-[#0F5257]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={isAuthenticated ? '/dashboard/billing' : '/register'}
                  className={`block text-center py-3 rounded-lg font-medium transition-all ${
                    plan.highlight
                      ? 'bg-[#0F5257] text-white hover:bg-[#136970]'
                      : 'bg-[#262626] text-white hover:bg-[#363636]'
                  }`}
                  data-testid={`plan-cta-${plan.id}`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-12" data-testid="faq-title">
            Preguntas frecuentes
          </h2>

          <div className="space-y-4">
            {FAQ.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="border border-white/10 rounded-xl overflow-hidden"
                data-testid={`faq-${index}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-[#171717]/50 transition-colors"
                >
                  <span className="text-white font-medium">{item.q}</span>
                  <CaretDown 
                    className={`text-[#A3A3A3] transition-transform ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-[#A3A3A3]">
                    {item.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 px-6 bg-[#171717]/50">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="text-xl font-medium text-white mb-3">Mantente informado</h3>
          <p className="text-[#A3A3A3] mb-6">
            Recibe actualizaciones sobre nuevas funciones y oportunidades.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257]"
                data-testid="newsletter-email"
              />
            </div>
            <button
              type="submit"
              disabled={subscribing}
              className="btn-primary px-6 disabled:opacity-50"
              data-testid="newsletter-submit"
            >
              {subscribing ? '...' : 'Suscribir'}
            </button>
          </form>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-gradient-to-b from-[#0F5257]/10 to-transparent">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-6" data-testid="final-cta-title">
            Empieza ahora
          </h2>
          <p className="text-[#A3A3A3] mb-8">
            Explica tu necesidad y recibe en minutos un diagnóstico, una ruta clara y el siguiente paso concreto.
          </p>
          <Link
            to={isAuthenticated ? '/flow' : '/register'}
            className="btn-primary inline-flex items-center gap-2"
            data-testid="final-cta-btn"
          >
            Empezar gratis
            <ArrowRight weight="bold" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[#A3A3A3] text-sm">
            © 2026 Sistema Maestro. Todos los derechos reservados.
          </div>
          <div className="flex items-center gap-6 text-sm text-[#A3A3A3]">
            <a href="/privacy" className="hover:text-white transition-colors">Privacidad</a>
            <a href="/cookies" className="hover:text-white transition-colors">Cookies</a>
            <a href="/terms" className="hover:text-white transition-colors">Términos</a>
            <a href="mailto:hola@sistemamaestro.com" className="hover:text-white transition-colors">Contacto</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
