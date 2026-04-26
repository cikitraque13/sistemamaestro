import React from 'react';
import { motion } from 'framer-motion';
import Logo from '../../../components/Logo';

const AuthScreenShell = ({
  badgeLabel = 'Auth / Access',
  title,
  subtitle,
  statusLabel,
  children
}) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050607]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[10%] top-[10%] h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-[8%] top-[14%] h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-[8%] left-[24%] h-60 w-60 rounded-full bg-[#39ff88]/8 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <div className="flex justify-center mb-6">
              <Logo size="xlarge" />
            </div>

            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#39ff88]/14 bg-[#07110c] px-4 py-2">
                <span className="h-2 w-2 rounded-full bg-[#39ff88] animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#b8ffd4]">
                  {badgeLabel}
                </span>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#111315]/92 shadow-[0_0_70px_rgba(0,0,0,0.28)]">
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(57,255,136,0.04),transparent_20%,transparent_78%,rgba(57,255,136,0.03))]" />
              <div className="absolute inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.012)_0px,rgba(255,255,255,0.012)_1px,transparent_1px,transparent_4px)] opacity-20" />

              <div className="relative p-8">
                <h1 className="text-2xl font-light text-white text-center mb-2">
                  {title}
                </h1>

                <p className="text-[#A3A3A3] text-center mb-3">
                  {subtitle}
                </p>

                <p className="text-center text-xs font-mono uppercase tracking-[0.18em] text-[#6ee7a8] mb-8">
                  {statusLabel}
                </p>

                {children}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreenShell;