import React, { useEffect, useRef, useState } from 'react';

import BuilderPublishSteps from './BuilderPublishSteps';
import {
  loadPublication,
  publishErrorMessage,
  publishSavedLanding,
  republishSavedLanding,
  saveCustomDomain,
  unpublishSavedLanding,
  verifyCustomDomain,
} from './builderPublishClient';

export default function BuilderPublishDock({
  projectId = '',
  publishLanding = false,
  customDomain = false,
  hasPreview = false,
  busy = false,
  scoreAllowed = true,
  onPublication,
}) {
  const [publication, setPublication] = useState(null);
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const onPublicationRef = useRef(onPublication);
  onPublicationRef.current = onPublication;

  useEffect(() => {
    if (!publishLanding || !projectId) return undefined;
    let live = true;
    loadPublication(projectId)
      .then((data) => {
        if (!live || !data) return;
        setPublication(data);
        if (data.slug) setSlug(data.slug);
        if (data.customDomain?.host) setDomain(data.customDomain.host);
        onPublicationRef.current?.(data);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [publishLanding, projectId]);

  if (!publishLanding || !hasPreview) return null;

  async function run(action) {
    setPending(true);
    setNotice('');
    try {
      const data = await action();
      setPublication(data);
      if (data?.slug) setSlug(data.slug);
      if (data?.customDomain?.host) setDomain(data.customDomain.host);
      setNotice(data?.message || '');
      if (data) onPublication?.(data);
    } catch (error) {
      setNotice(publishErrorMessage(error));
    } finally {
      setPending(false);
    }
  }

  return (
    <BuilderPublishSteps
      publishLanding={publishLanding}
      customDomain={customDomain}
      hasPreview={hasPreview}
      busy={busy}
      pending={pending}
      slug={slug}
      domain={domain}
      notice={notice}
      publication={publication}
      onSlugChange={setSlug}
      onDomainChange={setDomain}
      onPublish={(next) => run(() => publishSavedLanding(projectId, next))}
      onRepublish={() => run(() => republishSavedLanding(projectId))}
      onUnpublish={() => run(() => unpublishSavedLanding(projectId))}
      onSaveDomain={(value) => run(() => saveCustomDomain(projectId, value))}
      onVerifyDomain={() => run(() => verifyCustomDomain(projectId))}
      scoreAllowed={scoreAllowed}
    />
  );
}
