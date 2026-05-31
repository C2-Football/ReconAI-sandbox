(function () {
  'use strict';

  const CONTENT_PATH = 'content/landing-pages.json';

  function contentUrl() {
    return new URL(CONTENT_PATH, window.location.href).toString();
  }

  function setText(selector, value, root) {
    if (value === undefined || value === null) return;
    const el = (root || document).querySelector(selector);
    if (el) el.textContent = String(value);
  }

  function setPlaceholder(selector, value) {
    if (value === undefined || value === null) return;
    const el = document.querySelector(selector);
    if (el) el.setAttribute('placeholder', String(value));
  }

  function setTextPreservingIcon(selector, value) {
    if (value === undefined || value === null) return;
    const el = document.querySelector(selector);
    if (!el) return;
    const icon = el.querySelector('svg,span');
    el.textContent = '';
    if (icon) el.appendChild(icon);
    el.appendChild(document.createTextNode(String(value)));
  }

  function applyExamples(examples) {
    if (!Array.isArray(examples)) return;
    const rows = Array.from(document.querySelectorAll('#connect-instant-title + div > div'));
    examples.forEach((example, index) => {
      const row = rows[index];
      if (!row) return;
      const spans = row.querySelectorAll('span');
      if (spans[0]) spans[0].textContent = example.label || '';
      if (spans[1]) spans[1].textContent = example.copy || '';
    });
  }

  function applyPills(pills) {
    if (!Array.isArray(pills)) return;
    const els = Array.from(document.querySelectorAll('#connect-feature-pills span'));
    pills.forEach((pill, index) => {
      const el = els[index];
      if (el) el.textContent = pill;
    });
  }

  function applyScoutFrontDoor(content) {
    if (!content) return;
    if (content.meta?.title) document.title = content.meta.title;

    const auth = content.auth || {};
    setText('#scout-welcome-title', auth.welcomeTitle);
    setText('#scout-welcome-subtitle', auth.subtitle);
    setTextPreservingIcon('#scout-google-btn', auth.googleCta);
    setTextPreservingIcon('#scout-apple-btn', auth.appleCta);
    setText('#scout-auth-divider', auth.divider);
    setText('#scout-guest-link', auth.guestCta);

    const connect = content.connect || {};
    setText('#connect-heading', connect.heading);
    setText('#connect-subtitle', connect.subtitle);
    setText('#tab-sleeper', connect.sleeperTab);
    setText('#tab-espn', connect.espnTab);
    setText('#tab-mfl', connect.mflTab);
    setText('#tab-yahoo', connect.yahooTab);
    setPlaceholder('#u-input', connect.sleeperPlaceholder);
    setText('#conn-btn', connect.sleeperCta);
    setPlaceholder('#espn-league-id', connect.espnPlaceholder);
    setTextPreservingIcon('#form-espn summary', connect.espnPrivateSummary);
    setText('#form-espn details div div', connect.espnPrivateHelp);
    setPlaceholder('#espn-s2', connect.espnS2Placeholder);
    setPlaceholder('#espn-swid', connect.espnSwidPlaceholder);
    setText('#espn-conn-btn', connect.espnCta);
    setPlaceholder('#mfl-league-id', connect.mflLeaguePlaceholder);
    setPlaceholder('#mfl-year', connect.mflYearPlaceholder);
    setTextPreservingIcon('#form-mfl summary', connect.mflPrivateSummary);
    setText('#form-mfl details div div', connect.mflPrivateHelp);
    setPlaceholder('#mfl-api-key', connect.mflApiPlaceholder);
    setText('#mfl-conn-btn', connect.mflCta);
    setText('#form-yahoo p', connect.yahooCopy);
    setText('#yahoo-conn-btn', connect.yahooCta);
    setText('#yahoo-league-key-section > div', connect.yahooLeagueHint);
    setPlaceholder('#yahoo-league-key', connect.yahooLeaguePlaceholder);
    setText('#yahoo-league-key-section .btn', connect.yahooManualCta);
    setText('#form-yahoo > button:last-child', connect.yahooToggle);
    setText('#connect-trust-line', connect.trustLine);
    setText('#connect-instant-title', connect.instantTitle);
    applyExamples(connect.instantExamples);
    applyPills(connect.featurePills);
    setText('#connect-after-title', connect.afterTitle);
    setText('#connect-after-copy', connect.afterCopy);
  }

  async function initLandingContent() {
    try {
      const res = await fetch(contentUrl(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      applyScoutFrontDoor(data.pages?.scoutFrontDoor);
    } catch (err) {
      console.warn('[landing-content] using built-in Scout copy', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLandingContent);
  } else {
    initLandingContent();
  }

  window.DHQLandingContent = {
    applyScoutFrontDoor,
  };
})();
