import React, { useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { builderEntryIsOpen } from './builderAccess';
import BuilderUnderConstruction from './BuilderUnderConstruction';
import BuilderWorkspacePage from './workspace/BuilderWorkspacePage';

export default function BuilderRoute() {
  const { user } = useAuth();
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let cancelled = false;
    builderEntryIsOpen(user).then((enabled) => {
      if (!cancelled) setOpen(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (open === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0A0A0A]">
        <div className="spinner" />
      </div>
    );
  }

  if (open) return <BuilderWorkspacePage />;
  return <BuilderUnderConstruction />;
}
