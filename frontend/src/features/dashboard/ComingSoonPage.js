import React from 'react';

import DashboardLayout from '../../components/DashboardLayout';

const ComingSoonPage = ({ title }) => (
  <DashboardLayout title={title}>
    <section className="mx-auto max-w-lg py-16 text-center">
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm text-zinc-400">Próximamente</p>
    </section>
  </DashboardLayout>
);

export default ComingSoonPage;
