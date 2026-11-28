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
    <DashboardLayout
      title="Resumen"
      headerExtra={(
        <>
          {freeTestMode ? (
            <p
              data-testid="dashboard-test-mode"
              className="inline-flex h-7 items-center rounded-full border border-white/10 px-2.5 text-[11px] text-zinc-200"
            >
              {gemNoticeState({ freeTestMode: true }).text}
            </p>
          ) : null}
          <p
            data-testid="dashboard-gem-pill"
            className="inline-flex h-7 items-center rounded-full border border-white/10 bg-[#101114] px-2.5 text-[11px] font-medium text-zinc-200"
          >
            Gema Maestra · {gemLabel}
          </p>
        </>
      )}
    >
      <div id="builder-launcher" className="h-full min-h-0">
        <DashboardBuilderLauncher
          user={user}
          launcherState={location.state || null}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
