/* Nanixss · Black Friday 2026 (code BF2026, -20 %)
   Tout s'éteint seul le 01/12/2026 à 23:59:59 (heure de Paris), même page ouverte :
   bandeau retiré, prix d'origine remis, liens Stripe sans le code.
   Dans les pages : data-bf="nouveau prix" (ancien prix barré + nouveau, + « 1er mois » si data-bf-first),
   data-bf-replace="ancien=nouveau;…" (remplacement dans le texte),
   data-bf-note (petite étiquette « 1er mois » sous le prix). Le code s'applique déjà côté Stripe jusqu'à la même heure. */
(() => {
  const END = Date.UTC(2026, 11, 1, 22, 59, 59); // 01/12/2026 23:59:59 à Paris (UTC+1)
  const CODE = 'BF2026';
  // liens de paiement concernés par le code (Elite, Starter, Formation Starter, Formation Avancée)
  const LINKS = ['28EfZigv15TG06mbtN8g001', 'bJecN6gv15TG2eubtN8g002', 'dRm14o4Mj81OcT88hB8g006', 'dRmeVe92z0zmcT80P98g005'];
  if (Date.now() >= END) return;
  // Code V-Tools du Black Friday : N50 (-50 %) jusqu'au 30/11/2026 inclus, puis retour à N10 tout seul
  const VT_END = Date.UTC(2026, 10, 30, 22, 59, 59); // 30/11/2026 23:59:59 à Paris
  const VT_CODE = 'N50';
  const vtUndo = [];

  const T = {
    fr: { t: 'Black Friday', d: '-20 % sur le bot (1er mois) et les formations avec le code', end: 'Fin dans', copy: 'Copier', ok: 'Copié !', first: '1er mois', j: 'j' },
    en: { t: 'Black Friday', d: '20% off the bot (first month) and the courses with code', end: 'Ends in', copy: 'Copy', ok: 'Copied!', first: 'first month', j: 'd' },
    es: { t: 'Black Friday', d: '-20 % en el bot (1.er mes) y las formaciones con el código', end: 'Termina en', copy: 'Copiar', ok: '¡Copiado!', first: '1.er mes', j: 'd' },
    it: { t: 'Black Friday', d: '-20 % sul bot (1° mese) e sui corsi con il codice', end: 'Finisce tra', copy: 'Copia', ok: 'Copiato!', first: '1° mese', j: 'g' },
  };
  const L = T[(document.documentElement.lang || 'fr').slice(0, 2)] || T.fr;

  const css = `
  .bf-bar{position:relative;z-index:30;background:#000;color:#fff;border-bottom:1px solid rgba(3,210,182,.45);font:500 13.5px/1.35 Poppins,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
  .bf-bar .bf-in{max-width:1100px;margin:0 auto;padding:9px 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px 14px;text-align:center}
  .bf-bar .bf-t{font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#03EBCA}
  .bf-bar .bf-code{all:unset;cursor:pointer;font-weight:700;letter-spacing:.06em;color:#04131A;background:#03D2B6;border-radius:8px;padding:3px 10px}
  .bf-bar .bf-code:hover{background:#03EBCA}
  .bf-bar .bf-end{color:#9CC4C4;font-variant-numeric:tabular-nums}
  .bf-bar .bf-end b{color:#fff;font-weight:600}
  .price .bf-old{display:block;font-size:.5em;line-height:1.1;margin-bottom:2px}
  @media (max-width:480px){.btn-price .bf-old{display:none}}
  .bf-old{opacity:.55;font-weight:500;font-size:.72em;margin-right:.35em;text-decoration-thickness:2px}
  .bf-tag{display:inline-block;margin-top:6px;font:700 11.5px/1 Poppins,system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:#04131A;background:#03D2B6;border-radius:7px;padding:5px 8px}`;

  const undo = [];
  let bar, timer;

  function fmt(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return (d ? `${d} ${L.j} ` : '') + `${p(h)} h ${p(m)} min ${p(sec)} s`;
  }

  function on() {
    const style = document.createElement('style');
    style.textContent = css; document.head.appendChild(style); undo.push(() => style.remove());

    bar = document.createElement('div');
    bar.className = 'bf-bar'; bar.setAttribute('data-i18n-skip', ''); bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Black Friday');
    bar.innerHTML = `<div class="bf-in"><span class="bf-t">🖤 ${L.t}</span><span>${L.d}</span>`
      + `<button class="bf-code" type="button" title="${L.copy}">${CODE}</button>`
      + `<span class="bf-end">${L.end} <b></b></span></div>`;
    document.body.prepend(bar); undo.push(() => bar.remove());
    const btn = bar.querySelector('.bf-code');
    btn.addEventListener('click', () => {
      const done = () => { btn.textContent = L.ok; setTimeout(() => { btn.textContent = CODE; }, 1400); };
      if (navigator.clipboard) navigator.clipboard.writeText(CODE).then(done, done); else done();
    });

    document.querySelectorAll('[data-bf]').forEach((el) => {
      const html = el.innerHTML;
      el.innerHTML = `<s class="bf-old">${html}</s>${el.dataset.bf}` + (el.hasAttribute('data-bf-first') ? ` ${L.first}` : '');
      el.setAttribute('data-i18n-skip', '');
      undo.push(() => { el.innerHTML = html; el.removeAttribute('data-i18n-skip'); });
    });
    document.querySelectorAll('[data-bf-replace]').forEach((el) => {
      const html = el.innerHTML;
      let out = html;
      el.dataset.bfReplace.split(';').forEach((pair) => { const [a, b] = pair.split('='); out = out.split(a).join(b); });
      el.innerHTML = out; el.setAttribute('data-i18n-skip', '');
      undo.push(() => { el.innerHTML = html; el.removeAttribute('data-i18n-skip'); });
    });
    document.querySelectorAll('[data-bf-note]').forEach((el) => {
      const tag = document.createElement('div');
      tag.innerHTML = `<span class="bf-tag" data-i18n-skip>${el.dataset.bfNote || `-20 % · ${L.first}`}</span>`;
      el.after(tag); undo.push(() => tag.remove());
    });
    // prix dans un texte (traduit ou non) : « 24,99 €/mois », « €24.99/month »… → ancien barré + nouveau
    document.querySelectorAll('[data-bf-swap]').forEach((el) => {
      const [oldP, newP, first] = el.dataset.bfSwap.split('|');
      const num = oldP.replace(/[.,]/, '[.,]');
      const re = new RegExp(`(€\\s?${num}|${num}(?:&nbsp;|\\s| )?€)(\\/[^\\s<·]+)?`);
      const html = el.innerHTML;
      const out = html.replace(re, (m) => {
        const dot = /\d\.\d/.test(m);
        const n = dot ? newP.replace(',', '.') : newP;
        const price = m.trim().startsWith('€') ? `€${n}` : `${n}&nbsp;€`;
        return `<s class="bf-old">${m}</s> ${price}` + (first ? ` ${L.first}` : '');
      });
      if (out === html) return;
      el.innerHTML = out; el.setAttribute('data-i18n-skip', '');
      undo.push(() => { el.innerHTML = html; el.removeAttribute('data-i18n-skip'); });
    });
    document.querySelectorAll('a[href*="buy.stripe.com/"]').forEach((a) => {
      if (!LINKS.some((id) => a.href.includes(id))) return;
      const href = a.getAttribute('href');
      const u = new URL(a.href); u.searchParams.set('prefilled_promo_code', CODE);
      a.setAttribute('href', u.toString());
      undo.push(() => a.setAttribute('href', href));
    });

    if (Date.now() < VT_END) {
      document.querySelectorAll('[data-vt-text]').forEach((el) => {
        const html = el.innerHTML;
        el.textContent = '−50 % · Black Friday'; el.setAttribute('data-i18n-skip', '');
        vtUndo.push(() => { el.innerHTML = html; el.removeAttribute('data-i18n-skip'); });
      });
      document.querySelectorAll('[data-vt-href]').forEach((el) => {
        const href = el.getAttribute('href');
        el.setAttribute('href', el.dataset.vtHref);
        vtUndo.push(() => el.setAttribute('href', href));
      });
      document.querySelectorAll('[data-vt-code]').forEach((el) => {
        const text = el.textContent, code = el.dataset.code;
        el.textContent = VT_CODE; el.dataset.code = VT_CODE; el.setAttribute('data-i18n-skip', '');
        vtUndo.push(() => { el.textContent = text; el.dataset.code = code; el.removeAttribute('data-i18n-skip'); });
      });
    }

    tick();
    timer = setInterval(tick, 1000);
  }

  function tick() {
    if (vtUndo.length && Date.now() >= VT_END) while (vtUndo.length) { try { vtUndo.pop()(); } catch (e) {} }
    const left = END - Date.now();
    if (left <= 0) return off();
    const b = bar && bar.querySelector('.bf-end b');
    if (b) b.textContent = fmt(left);
  }

  function off() {
    clearInterval(timer);
    while (undo.length) { try { undo.pop()(); } catch (e) {} }
    while (vtUndo.length) { try { vtUndo.pop()(); } catch (e) {} }
  }

  // attendre que la traduction du site (i18n.js) ait fini, pour ne pas se faire écraser
  function start() {
    const t0 = Date.now();
    (function wait() {
      if (document.getElementById('nx-i18n-wait') && Date.now() - t0 < 3000) return setTimeout(wait, 80);
      on();
    })();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
