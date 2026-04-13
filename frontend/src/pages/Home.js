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
  EnvelopeSimple,
  Microphone,
  Stop
} from '@phosphor-icons/react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import Logo from '../components/Logo';
import { useVoice } from '../hooks/useVoice';
import {
  pricingSection,
  entryOffer,
  pricingPlans,
  pricingTrustSignals
} from '../content/pricingContent';

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
  {
    num: '01',
    title: 'Interpretamos tu necesidad',
    desc: 'Analizamos tu entrada con IA para entender exactamente qué necesitas.'
  },
  {
    num: '02',
    title: 'Clasificamos en la ruta correcta',
    desc: 'Te asignamos el camino óptimo según tu caso específico.'
  },
  {
    num: '03',
    title: 'Devolvemos estructura clara',
    desc: 'Recibes diagnóstico, prioridades y siguiente paso concreto.'
  },
  {
    num: '04',
    title: 'Te ayudamos a activar',
    desc: 'Con blueprint, prompts y plan de despliegue para poner en marcha.'
  }
];

const BENEFITS = [
  'Diagnóstico inicial',
  'Ruta recomendada',
  'Blueprint estructurado',
  'Prompts de trabajo',
  'Propuesta de monetización',
  'Plan de activación'
];

const FAQ = [
  {
    q: '¿Qué tipo de entrada puedo usar?',
    a: 'Puedes describir tu necesidad en texto libre, pegar una URL para analizar un activo existente o explicar una idea que quieres convertir en proyecto, propuesta o mejora real.'
  },
  {
    q: '¿Qué recibo con el plan gratuito?',
    a: 'Una primera lectura de tu caso, la ruta recomendada y una salida resumida para entender si merece profundizar.'
  },
  {
    q: '¿Qué incluye el informe puntual de 6,99 €?',
    a: 'Una validación más seria de la oportunidad, una lectura más concreta y un prompt accionable para seguir avanzando con mejor dirección.'
  },
  {
    q: '¿Qué incluye el Pro?',
    a: 'Estructura base, prioridades, enfoque de monetización o mejora y prompts estructurales para empezar a trabajar con criterio.'
  },
  {
    q: '¿Qué diferencia hay entre Growth y AI Master 199?',
    a: 'Growth optimiza rendimiento, growth y priorización. AI Master 199 añade una capa senior de CRO, auditoría, prompts maestros, arquitectura de trabajo y criterio estratégico.'
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
          <Link to="/privacy" className="text-[#0F5257] hover:underline">
            política de privacidad
          </Link>{' '}
          y{' '}
          <Link to="/cookies" className="text-[#0F5257] hover:underline">
            uso de cookies
          </Link>
          .
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

  const voice = useVoice();

  useEffect(() => {
    if (voice.transcript && inputMode === 'text') {
      setInputValue(voice.transcript);
    }
  }, [voice.transcript, inputMode]);

  useEffect(() => {
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
      <AnimatePresence>
        {showCookies && <CookieBanner onAccept={handleAcceptCookies} />}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="large" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#routes" className="text-[#A3A3A3] hover:text-white transition-colors">
              Rutas
            </a>
            <a href="#how" className="text-[#A3A3A3] hover:text-white transition-colors">
              Cómo funciona
            </a>
            <a href="#pricing" className="text-[#A3A3A3] hover:text-white transition-colors">
              Precios
            </a>
            <a href="#faq" className="text-[#A3A3A3] hover:text-white transition-colors">
              FAQ
            </a>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary" data-testid="dashboard-btn">
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[#A3A3A3] hover:text-white transition-colors"
                  data-testid="login-link"
                >
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
            Sistema Maestro transforma tu idea, una URL o una oportunidad real en una salida clara,
            monetizable y lista para convertirse en trabajo serio.
          </motion.p>

          {/* Input Module */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-[#171717] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto"
            data-testid="input-module"
          >
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

            {inputMode === 'text' ? (
              <div className="relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    voice.isListening
                      ? 'Escuchando...'
                      : 'Describe tu idea, necesidad, negocio o problema que quieres resolver...'
                  }
                  className={`w-full h-32 bg-[#0A0A0A] border rounded-lg px-4 py-3 pr-14 text-white placeholder-[#A3A3A3] focus:outline-none focus:border-[#0F5257] focus:ring-1 focus:ring-[#0F5257]/50 transition-all resize-none ${
                    voice.isListening ? 'border-red-500/50 animate-pulse' : 'border-white/10'
                  }`}
                  data-testid="input-text"
                />
                {voice.isSupported && (
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={voice.isListening ? voice.stopListening : voice.startListening}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        voice.isListening
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-[#262626] text-[#A3A3A3] hover:bg-[#363636] hover:text-white'
                      }`}
                      title={voice.isListening ? 'Detener' : 'Hablar por voz'}
                      data-testid="voice-input-btn"
                    >
                      {voice.isListening ? (
                        <Stop size={20} weight="fill" />
                      ) : (
                        <Microphone size={20} weight="fill" />
                      )}
                    </button>
                  </div>
                )}
              </div>
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4"
            data-testid="routes-title"
          >
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
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/flow', { state: { inputType: 'text', inputContent: '' } });
                  } else {
                    navigate('/register');
                  }
                }}
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4"
            data-testid="how-title"
          >
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4"
            data-testid="benefits-title"
          >
            Qué recibes
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12">
            Todo lo que necesitas para pasar de idea a ejecución con una base más seria.
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4"
            data-testid="examples-title"
          >
            Ejemplos de resultado
          </h2>
          <p className="text-[#A3A3A3] text-center mb-12 max-w-xl mx-auto">
            Así se ve una salida real del sistema.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                type: 'Negocio local con web obsoleta',
                finding:
                  'Tu web no deja claro qué ofreces ni cómo debe actuar un cliente en los primeros segundos.',
                route: 'improve_existing',
                next: 'Activa el Pro para ver la estructura recomendada y el enfoque de mejora.'
              },
              {
                type: 'Vender y cobrar',
                finding: 'Estás ofreciendo servicios sin un proceso de compra definido ni una propuesta clara.',
                route: 'sell_and_charge',
                next: 'Activa el Pro para ordenar la oferta y construir una base comercial mejor.'
              },
              {
                type: 'Automatizar operación',
                finding: 'El cuello de botella está en la gestión manual y en la falta de un flujo operativo claro.',
                route: 'automate_operation',
                next: 'Sube a Growth para priorizar automatización, continuidad y mejora del rendimiento.'
              },
              {
                type: 'Idea a proyecto',
                finding: 'La idea tiene recorrido si se estructura mejor el enfoque de monetización y activación.',
                route: 'idea_to_project',
                next: 'Empieza por un informe puntual o entra al Pro para construir sobre una base sólida.'
              }
            ].map((example, index) => (
              <motion.div
                key={example.route + index}
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-12"
            data-testid="diff-title"
          >
            Lo que hace diferente a Sistema Maestro
          </h2>

          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { no: 'No empiezas desde cero', yes: 'Empiezas con estructura' },
              { no: 'No te pierdes entre herramientas', yes: 'Recibes una ruta clara' },
              { no: 'No dependes de un proceso caótico', yes: 'Sigues un sistema guiado' },
              { no: 'No recibes solo ideas', yes: 'Recibes base, prompts y siguiente paso' }
            ].map((item, index) => (
              <motion.div
                key={item.no}
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257]/15 text-[#0F5257] text-xs font-medium uppercase tracking-wider mb-4">
              {pricingSection.eyebrow}
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-4"
              data-testid="pricing-title"
            >
              {pricingSection.title}
            </h2>
            <p className="text-[#A3A3A3] text-center mb-4 max-w-2xl mx-auto">
              {pricingSection.description}
            </p>
            <p className="text-sm text-[#737373] text-center max-w-2xl mx-auto">
              {pricingSection.microNote}
            </p>
          </div>

          {/* Entry Offer / Bridge Block */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-10"
            data-testid="entry-offer-card"
          >
            <div className="bg-[#121212] border border-[#0F5257]/30 rounded-2xl p-6 lg:p-8">
              <div className="grid lg:grid-cols-[1.35fr_0.9fr] gap-8">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#0F5257] text-white text-xs font-medium">
                      {entryOffer.badge}
                    </span>
                    <span className="text-xs uppercase tracking-wider text-[#A3A3A3]">
                      {entryOffer.priceLabel} · {entryOffer.periodLabel}
                    </span>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-light text-white mb-3">
                    {entryOffer.headline}
                  </h3>
                  <p className="text-[#D4D4D4] mb-4 max-w-2xl">{entryOffer.description}</p>
                  <p className="text-sm text-[#A3A3A3] mb-6 max-w-2xl">{entryOffer.valuePromise}</p>

                  <div className="grid sm:grid-cols-2 gap-3 mb-6">
                    {entryOffer.features.map((feature) => (
                      <div
                        key={feature}
                        className="flex items-start gap-2 bg-[#0A0A0A] border border-white/5 rounded-lg px-4 py-3"
                      >
                        <CheckCircle
                          size={18}
                          weight="fill"
                          className="text-[#0F5257] mt-0.5 flex-shrink-0"
                        />
                        <span className="text-sm text-[#D4D4D4]">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      {entryOffer.promptLayer.label}
                    </p>
                    <p className="text-sm text-white">{entryOffer.promptLayer.description}</p>
                  </div>
                </div>

                <div className="flex flex-col justify-between bg-[#0A0A0A] border border-[#262626] rounded-2xl p-6">
                  <div>
                    <p className="text-sm text-[#A3A3A3] mb-2">Progresión conceptual</p>
                    <div className="space-y-3 mb-6">
                      {entryOffer.conceptualGraphic.steps.map((step) => {
                        const isActive = step === entryOffer.conceptualGraphic.activeStep;
                        return (
                          <div
                            key={step}
                            className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                              isActive
                                ? 'bg-[#0F5257]/15 border-[#0F5257]/40'
                                : 'bg-[#171717] border-white/5'
                            }`}
                          >
                            <span
                              className={`text-sm ${
                                isActive ? 'text-white' : 'text-[#A3A3A3]'
                              }`}
                            >
                              {step}
                            </span>
                            {isActive && (
                              <span className="text-xs font-medium text-[#0F5257]">Ahora</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="mb-6">
                      <p className="text-sm text-[#A3A3A3] mb-1">Mejor encaje</p>
                      <p className="text-white text-sm">{entryOffer.bestFor}</p>
                    </div>
                  </div>

                  <Link
                    to={isAuthenticated ? '/dashboard/billing' : '/register'}
                    className="block text-center py-3 rounded-lg font-medium bg-[#0F5257] text-white hover:bg-[#136970] transition-all"
                    data-testid="entry-offer-cta"
                  >
                    {entryOffer.cta.label}
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Plans */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => {
              const isPrimary = plan.isPrimaryPlan || plan.highlight;
              const isStrategic = plan.isStrategicPlan;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className={`bg-[#171717] border rounded-2xl p-6 relative flex flex-col min-h-[640px] ${
                    isPrimary
                      ? 'border-[#0F5257] pricing-highlight'
                      : isStrategic
                        ? 'border-[#3A3A3A]'
                        : 'border-white/5'
                  }`}
                  data-testid={`plan-${plan.id}`}
                >
                  <div className="min-h-[32px] mb-4 flex items-start justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {plan.badge && (
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            isPrimary
                              ? 'bg-[#0F5257] text-white'
                              : isStrategic
                                ? 'bg-[#262626] text-white'
                                : 'bg-[#202020] text-[#D4D4D4]'
                          }`}
                        >
                          {plan.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="min-h-[112px] mb-5">
                    <h3 className="text-2xl font-medium text-white mb-2">{plan.visibleName}</h3>
                    <p className="text-sm text-[#D4D4D4] mb-2">{plan.headline}</p>
                    <p className="text-sm text-[#A3A3A3]">{plan.description}</p>
                  </div>

                  <div className="min-h-[72px] flex items-baseline gap-1 mb-5">
                    <span className="text-4xl font-light text-white">{plan.priceLabel}</span>
                    <span className="text-[#A3A3A3]">{plan.periodLabel}</span>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-5 min-h-[112px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      Mejor encaje
                    </p>
                    <p className="text-sm text-white">{plan.bestFor}</p>
                  </div>

                  <div className="bg-[#0A0A0A] border border-[#262626] rounded-xl p-4 mb-5 min-h-[104px]">
                    <p className="text-xs text-[#A3A3A3] uppercase tracking-wide mb-2">
                      {plan.promptLayer.label}
                    </p>
                    <p className="text-sm text-white">{plan.promptLayer.description}</p>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#D4D4D4]"
                      >
                        <CheckCircle
                          size={16}
                          weight="fill"
                          className="text-[#0F5257] mt-0.5 flex-shrink-0"
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={isAuthenticated ? '/dashboard/billing' : '/register'}
                    className={`block text-center py-3 rounded-lg font-medium transition-all mt-auto ${
                      isPrimary
                        ? 'bg-[#0F5257] text-white hover:bg-[#136970]'
                        : isStrategic
                          ? 'bg-[#262626] text-white hover:bg-[#363636]'
                          : 'bg-[#262626] text-white hover:bg-[#363636]'
                    }`}
                    data-testid={`plan-cta-${plan.id}`}
                  >
                    {plan.cta.label}
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Signals */}
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pricingTrustSignals.map((signal, index) => (
              <div
                key={signal}
                className="bg-[#121212] border border-white/5 rounded-lg px-4 py-3 text-sm text-[#D4D4D4]"
                data-testid={`pricing-signal-${index}`}
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white text-center mb-12"
            data-testid="faq-title"
          >
            Preguntas frecuentes
          </h2>

          <div className="space-y-4">
            {FAQ.map((item, index) => (
              <motion.div
                key={item.q}
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
                    className={`text-[#A3A3A3] transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-[#A3A3A3]">{item.a}</div>
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
            Recibe actualizaciones sobre nuevas funciones, oportunidades y mejoras del sistema.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex gap-3">
            <div className="relative flex-1">
              <EnvelopeSimple
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]"
              />
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
          <h2
            className="text-2xl sm:text-3xl lg:text-4xl font-light text-white mb-6"
            data-testid="final-cta-title"
          >
            Empieza ahora
          </h2>
          <p className="text-[#A3A3A3] mb-8">
            Explica tu necesidad y recibe una salida inicial útil, una ruta clara y el siguiente paso
            correcto para avanzar con criterio.
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
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-[#A3A3A3] text-sm">
              © 2026 Sistema Maestro. Todos los derechos reservados.
            </div>
            <div className="flex items-center gap-6 text-sm text-[#A3A3A3]">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacidad
              </Link>
              <Link to="/cookies" className="hover:text-white transition-colors">
                Cookies
              </Link>
              <Link to="/terms" className="hover:text-white transition-colors">
                Términos
              </Link>
              <a
                href="mailto:hola@sistemamaestro.com"
                className="hover:text-white transition-colors"
              >
                Contacto
              </a>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs text-[#666666] pt-4 border-t border-white/5">
            <a
              href="https://systeme.io/es?sa=sa021243679877282e02190853937f18793f713170"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#A3A3A3] transition-colors"
            >
              Systeme.io
            </a>
            <a
              href="https://sistemamaestroia.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#A3A3A3] transition-colors"
            >
              SistemaMaestroIA
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
