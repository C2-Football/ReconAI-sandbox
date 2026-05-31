// shared/dev-preview-config.js -- local/sandbox AI endpoint override.
// Must load before shared/app-config.js so App.CONFIG points to the dev bridge.

(function () {
  'use strict';

  const host = window.location?.hostname || '';
  const isPreviewHost = ['localhost', '127.0.0.1', '[::1]'].includes(host)
    || host.includes('sandbox');
  if (!isPreviewHost) return;

  const existingConfig = window.DYNASTY_HQ_CONFIG || window.App?.CONFIG || window.OD?.CONFIG || {};
  const basePath = window.location.pathname.startsWith('/ReconAI/') ? '/ReconAI' : '';
  window.DYNASTY_HQ_CONFIG = {
    ...existingConfig,
    devPreviewAI: true,
    endpoints: {
      ...(existingConfig.endpoints || {}),
      aiAnalyze: `${window.location.origin}${basePath}/api/dev-ai-analyze`,
    },
  };
})();
