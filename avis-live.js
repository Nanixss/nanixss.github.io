/* Avis ajoutés depuis Discord par le bot Nanixss Hub (fichier /avis.json).
   - accueil : bandeau .reviews (avis sur le bot)
   - /elite : lignes #avis .rv-track (avis sur le bot)
   - /formation : lignes #avis .rv-track (avis sur la formation)
   Un avis du fichier remplace la carte écrite à la main du même membre. */
(function () {
  const path = location.pathname.replace(/\/index\.html$/, '/');
  const page = path.startsWith('/formation') ? 'formation' : path.startsWith('/elite') ? 'elite' : (path === '/' ? 'index' : null);
  if (!page) return;
  const kind = page === 'formation' ? 'formation' : 'bot';
  const lang = () => (document.documentElement.lang || 'fr').slice(0, 2);
  const PLAN = {
    en: { 'Abonné Elite': 'Elite subscriber', 'Abonné Starter': 'Starter subscriber', 'Élève Formation Avancée': 'Advanced course student', 'Élève Formation Starter': 'Starter course student', 'avis vérifié': 'verified review' },
    es: { 'Abonné Elite': 'Suscriptor Elite', 'Abonné Starter': 'Suscriptor Starter', 'Élève Formation Avancée': 'Alumno de la Formación Avanzada', 'Élève Formation Starter': 'Alumno de la Formación Starter', 'avis vérifié': 'opinión verificada' },
    it: { 'Abonné Elite': 'Abbonato Elite', 'Abonné Starter': 'Abbonato Starter', 'Élève Formation Avancée': 'Studente del Corso Avanzato', 'Élève Formation Starter': 'Studente del Corso Starter', 'avis vérifié': 'recensione verificata' },
  };
  const tr = (s) => (PLAN[lang()] && PLAN[lang()][s]) || s;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const quote = (t) => (lang() === 'en' ? `“${t}”` : `« ${t} »`);
  const textOf = (a) => (a.text && (a.text[lang()] || a.text.fr)) || '';
  const norm = (s) => String(s).trim().toLowerCase();

  function card(a) {
    const el = document.createElement(page === 'index' ? 'div' : 'figure');
    el.setAttribute('data-i18n-skip', '');
    el.dataset.live = a.id;
    const name = esc(a.name), ini = esc((a.name || '?').trim().charAt(0).toUpperCase());
    let t = textOf(a);
    if (page === 'index') {
      if (t.length > 170) t = t.slice(0, 165).replace(/\s+\S*$/, '') + '…';
      el.className = 'rv';
      el.innerHTML = `<div class="rv-h"><span class="rv-a">${ini}</span>${name}<span class="rv-s" aria-label="5/5">★★★★★</span></div>` +
        `<p>${esc(quote(t))}</p><div class="rv-f">✓ ${esc(tr(a.plan))} · ${esc(tr('avis vérifié'))}</div>`;
    } else {
      el.className = 'dcard';
      const cap = kind === 'formation' ? esc(a.date) : `✅ ${esc(tr(a.plan))} · ${esc(tr('avis vérifié'))} · ${esc(a.date)}`;
      el.innerHTML = `<div class="dc-h"><span class="dc-av">${ini}</span><b>${name}</b></div>` +
        `<p class="dc-st" aria-label="5/5"><span aria-hidden="true">⭐⭐⭐⭐⭐</span>5/5</p>` +
        `<blockquote>${esc(quote(t)).replace(/\n/g, '<br>')}</blockquote><figcaption>${cap}</figcaption>`;
    }
    return el;
  }

  function inject(list) {
    const tracks = page === 'index' ? [...document.querySelectorAll('.reviews .track')] : [...document.querySelectorAll('#avis .rv-track')];
    if (!tracks.length || !list.length) return;
    const names = new Set(list.map((a) => norm(a.name)));
    // retirer les cartes écrites à la main du même membre
    tracks.forEach((tr) => [...tr.children].forEach((c) => {
      const n = page === 'index'
        ? norm(((c.querySelector('.rv-h') || {}).childNodes || [])[1] ? c.querySelector('.rv-h').childNodes[1].textContent : '')
        : norm((c.querySelector('.dc-h b') || {}).textContent || '');
      if (names.has(n)) c.remove();
    }));
    // répartir les nouveaux avis entre les lignes, en tête, dans chaque copie de la série
    list.forEach((a, i) => {
      const tr = tracks[i % tracks.length];
      const kids = [...tr.children];
      const per = kids.filter((c) => !c.hasAttribute('aria-hidden')).length || kids.length;
      const copies = Math.max(1, Math.round(kids.length / per));
      for (let k = copies - 1; k >= 0; k--) {
        const c = card(a);
        if (k > 0) c.setAttribute('aria-hidden', 'true');
        const ref = kids[k * per] || null;
        tr.insertBefore(c, ref);
      }
    });
  }

  window.__avisLive = fetch('/avis.json', { cache: 'no-cache' })
    .then((r) => (r.ok ? r.json() : { avis: [] }))
    .then((d) => {
      const list = (d.avis || []).filter((a) => a.kind === kind).slice(0, 12);
      const run = () => inject(list);
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true }); else run();
    })
    .catch(() => {});
})();
