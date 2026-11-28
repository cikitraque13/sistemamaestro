import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import DashboardLayout from '../../components/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/apiClient';
import { loadBuilderSession } from '../builder/api/builderPreviewClient';
import { gemNoticeState } from '../builder/studio/model';

import DashboardBuilderLauncher from './components/DashboardBuilderLauncher';
import { gemBalanceFromBilling } from './dashboardModel';

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [gemBalance, setGemBalance] = useState(null);
  const [billingLoaded, setBillingLoaded] = useState(false);
  const [freeTestMode, setFreeTestMode] = useState(false);

  useEffect(() => {
    let live = true;

    api
      .get('/user/billing')
      .then((response) => {
        if (live) setGemBalance(gemBalanceFromBilling(response?.data));
      })
      .catch(() => {
        if (live) setGemBalance(null);
      })
      .finally(() => {
        if (live) setBillingLoaded(true);
      });

    loadBuilderSession().then((session) => {
      if (live) setFreeTestMode(Boolean(session?.freeTestMode));
    });

    return () => {
      live = false;
    };
  }, []);

  const gemLabel = !billingLoaded || gemBalance == null ? '—' : String(gemBalance);

  return (
    <DashboardLayout title="Resumen">
      <div className="pointer-events-none absolute right-4 top-4 z-20 flex items-center gap-2 md:right-6">
        {freeTestMode ? (
          <p
            data-testid="dashboard-test-mode"
            className="pointer-events-auto inline-flex h-7 items-center rounded-full border border-white/10 bg-black/40 px-2.5 text-[11px] text-zinc-200"
          >
            {gemNoticeState({ freeTestMode: true }).text}
          </p>
        ) : null}
        <p
          data-testid="dashboard-gem-pill"
          className="pointer-events-auto inline-flex h-7 items-center rounded-full border border-white/10 bg-black/40 px-2.5 text-[11px] font-medium text-zinc-100"
        >
          ◆ {gemLabel} gemas
        </p>
      </div>
      <div id="builder-launcher" className="h-full min-h-0">
        <DashboardBuilderLauncher
          user={user}
          freeTestMode={freeTestMode}
          launcherState={location.state || null}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
