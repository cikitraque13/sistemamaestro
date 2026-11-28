import { useEffect, useState } from 'react';

import { api } from '../../../lib/apiClient';
import {
  loadPublicAdvisorConfig,
  readBuildAdvisorConfig,
  shouldLoadPublicAdvisorConfig,
} from './advisorFlowConfig';

export function useAdvisorFlowConfig() {
  const [config, setConfig] = useState(() => readBuildAdvisorConfig());

  useEffect(() => {
    if (!shouldLoadPublicAdvisorConfig()) return undefined;
    let cancelled = false;
    loadPublicAdvisorConfig(readBuildAdvisorConfig(), async () => {
      const response = await api.get('/public/config');
      return response?.data;
    }).then((next) => {
      if (!cancelled) setConfig(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}
