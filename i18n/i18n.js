/* Nanixss · traduction du site (FR de base, EN / ES / IT)
   - Le français est écrit dans les pages. Les autres langues viennent de /i18n/<page>.<lang>.json + common.<lang>.json.
   - Clé = texte français d'un bloc (paragraphe, titre, bouton…), balises remplacées par <iN>…</iN> et <xN/>.
   - Les textes ajoutés plus tard par les scripts de la page (démo Discord, vitrine…) sont traduits à la volée. */
(() => {
  const LANGS = {
    fr: { label: 'Français', flag: '<svg viewBox="0 0 3 2"><path fill="#002395" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#ED2939" d="M2 0h1v2H2z"/></svg>' },
    en: { label: 'English', flag: '<svg viewBox="0 0 60 30"><clipPath id="nxuk"><path d="M0 0v30h60V0z"/></clipPath><clipPath id="nxuk2"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath><g clip-path="url(#nxuk)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#nxuk2)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg>' },
    es: { label: 'Español', flag: '<svg viewBox="0 0 3 2"><path fill="#AA151B" d="M0 0h3v2H0z"/><path fill="#F1BF00" d="M0 .5h3v1H0z"/></svg>' },
    it: { label: 'Italiano', flag: '<svg viewBox="0 0 3 2"><path fill="#009246" d="M0 0h1v2H0z"/><path fill="#fff" d="M1 0h1v2H1z"/><path fill="#CE2B37" d="M2 0h1v2H2z"/></svg>' },
  };
  const KEY = 'nx-lang';
  const me = document.currentScript;
  const PAGE = (me && me.dataset.page) || 'index';
  const BASE = me ? me.src.replace(/[^/]*$/, '') : '/i18n/';
  const params = new URLSearchParams(location.search);
  const EXTRACT = params.get('i18n') === 'extract';
  const store = { get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }, set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} } };

  let lang = (params.get('lang') || '').toLowerCase();
  if (LANGS[lang]) store.set(lang);
  else {
    lang = store.get();
    if (!LANGS[lang]) {
      const nav = (navigator.languages || [navigator.language || 'fr']).map(l => String(l).slice(0, 2).toLowerCase());
      lang = nav.find(l => LANGS[l]) || 'fr';
    }
  }
  if (EXTRACT) lang = 'fr';
  const root = document.documentElement;
  root.lang = lang;

  // ---------- découpage du texte en blocs ----------
  const INLINE = new Set(['A', 'B', 'STRONG', 'I', 'EM', 'SPAN', 'CODE', 'SMALL', 'SUP', 'SUB', 'U', 'MARK', 'TIME', 'ABBR', 'S', 'Q', 'BR', 'IMG', 'WBR', 'LABEL', 'BDI', 'CITE', 'KBD', 'DFN', 'DATA', 'svg']);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'TEXTAREA', 'CANVAS', 'IFRAME', 'VIDEO', 'svg']);
  const isAtomic = (n) => n.nodeName === 'svg' || n.nodeName === 'IMG' || n.nodeName === 'BR' || n.nodeName === 'WBR' || (n.dataset && (n.dataset.stat !== undefined || n.dataset.i18nSkip !== undefined));
  const isInline = (n) => INLINE.has(n.nodeName);
  const skipped = (el) => !!el.closest('[data-i18n-skip],.nx-lang');
  const norm = (s) => s.replace(/[\s  ]+/g, ' ').trim();
  const hasBlockInside = (el) => { for (const c of el.children) { if (isAtomic(c)) continue; if (!isInline(c) || hasBlockInside(c)) return true; } return false; };
  const hasText = (el) => /[A-Za-zÀ-ÿ]/.test(el.textContent || '');

  function tokenize(el) {
    const refs = []; let out = '';
    const walk = (node) => {
      for (const c of node.childNodes) {
        if (c.nodeType === 3) out += c.nodeValue.replace(/[<>]/g, ' ');
        else if (c.nodeType === 1) {
          const i = refs.length; refs.push(c);
          if (isAtomic(c)) out += `<x${i}/>`;
          else { out += `<i${i}>`; walk(c); out += `</i${i}>`; }
        }
      }
    };
    walk(el);
    return { key: norm(out).replace(/\s*(<x\d+\/>)\s*/g, (m, t) => m.replace(/\s+/g, ' ')), refs };
  }
  function rebuild(el, refs, str) {
    const frag = document.createDocumentFragment(); const stack = [frag];
    const re = /<(\/?)([ix])(\d+)(\/?)>/g; let last = 0, m;
    const text = (t) => { if (t) stack[stack.length - 1].appendChild(document.createTextNode(t)); };
    while ((m = re.exec(str))) {
      text(str.slice(last, m.index)); last = re.lastIndex;
      const node = refs[+m[3]]; if (!node) continue;
      if (m[2] === 'x') stack[stack.length - 1].appendChild(node);
      else if (m[1]) { if (stack.length > 1) stack.pop(); }
      else { while (node.firstChild) node.removeChild(node.firstChild); stack[stack.length - 1].appendChild(node); stack.push(node); }
    }
    text(str.slice(last));
    while (el.firstChild) el.removeChild(el.firstChild);
    el.appendChild(frag);
  }

  // Unités traduisibles sous un élément
  function units(start, acc = []) {
    if (start.nodeType !== 1 || SKIP.has(start.nodeName) || skipped(start)) return acc;
    if (!hasBlockInside(start)) { if (hasText(start)) acc.push(start); return acc; }
    for (const c of start.childNodes) {
      if (c.nodeType === 3) { if (/[A-Za-zÀ-ÿ]/.test(c.nodeValue)) acc.push(c); }
      else if (c.nodeType === 1) units(c, acc);
    }
    return acc;
  }

  // ---------- dictionnaire ----------
  let T = {}, P = [];
  const keys = new Set();
  const done = new WeakMap();
  const missing = new Set();
  const lookup = (k) => {
    if (Object.prototype.hasOwnProperty.call(T, k)) return T[k];
    for (const [re, rep] of P) if (re.test(k)) return k.replace(re, rep);
    return null;
  };
  function translateUnit(u) {
    if (u.nodeType === 3) {
      const k = norm(u.nodeValue); if (!k) return;
      if (EXTRACT) { keys.add(k); return; }
      if (done.get(u) === k) return;
      const t = lookup(k); if (t == null) { missing.add(k); return; }
      const lead = /^\s/.test(u.nodeValue) ? ' ' : '', trail = /\s$/.test(u.nodeValue) ? ' ' : '';
      u.nodeValue = lead + t + trail; done.set(u, norm(u.nodeValue));
      return;
    }
    const { key, refs } = tokenize(u); if (!key) return;
    if (EXTRACT) { keys.add(key); return; }
    if (done.get(u) === key) return;
    const t = lookup(key); if (t == null) { missing.add(key); return; }
    if (t !== key) { if (!refs.length) u.textContent = t; else rebuild(u, refs, t); }
    done.set(u, tokenize(u).key);
  }
  const ATTRS = ['alt', 'title', 'aria-label', 'placeholder'];
  function translateAttrs(scope) {
    const els = scope.nodeType === 1 ? [scope, ...scope.querySelectorAll('[alt],[title],[aria-label],[placeholder]')] : [];
    for (const el of els) {
      if (el.closest && el.closest('.nx-lang')) continue;
      for (const a of ATTRS) {
        const v = el.getAttribute && el.getAttribute(a); if (!v || !/[A-Za-zÀ-ÿ]/.test(v)) continue;
        const k = norm(v);
        if (EXTRACT) { keys.add(k); continue; }
        const t = lookup(k); if (t == null) { missing.add(k); continue; }
        if (t !== v) el.setAttribute(a, t);
      }
    }
  }
  function translateHead() {
    const metas = document.querySelectorAll('meta[name="description"],meta[property="og:title"],meta[property="og:description"]');
    for (const m of metas) { const k = norm(m.content || ''); if (!k) continue; if (EXTRACT) keys.add(k); else { const t = lookup(k); if (t != null) m.content = t; else missing.add(k); } }
    const k = norm(document.title);
    if (EXTRACT) keys.add(k); else if (k) { const t = lookup(k); if (t != null) document.title = t; else missing.add(k); }
  }
  function translateScope(scope) {
    if (!scope) return;
    if (scope.nodeType === 3) scope = scope.parentNode;
    if (!scope || scope.nodeType !== 1) return;
    // si le changement est à l'intérieur d'un bloc, on retraduit le bloc entier
    let u = scope;
    while (u.parentElement && u.parentElement !== document.body && !hasBlockInside(u.parentElement) && u.parentElement.nodeName !== 'BODY') u = u.parentElement;
    if (skipped(u)) return;
    units(u).forEach(translateUnit);
    translateAttrs(u);
  }

  // ---------- menu de langue ----------
  function menu() {
    const css = `.nx-lang{position:relative;flex:0 0 auto;font-family:Poppins,system-ui,sans-serif;z-index:60}
.nx-lang.fixed{position:fixed;top:calc(14px + env(safe-area-inset-top,0px));right:14px}
.nx-lang>button{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px;border-radius:12px;border:1.5px solid rgba(3,210,182,.34);background:rgba(6,34,41,.85);color:#EAF7F5;font:600 13.5px/1 Poppins,system-ui,sans-serif;cursor:pointer;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.nx-lang>button:hover,.nx-lang>button[aria-expanded="true"]{border-color:#03D2B6}
.nx-lang .fl{display:block;width:22px;height:15px;border-radius:3px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.18)}
.nx-lang .fl svg{display:block;width:100%;height:100%}
.nx-lang .chev{width:10px;height:10px;opacity:.7;transition:transform .2s}
.nx-lang>button[aria-expanded="true"] .chev{transform:rotate(180deg)}
.nx-lang ul{position:absolute;right:0;top:calc(100% + 8px);min-width:196px;margin:0;padding:8px;list-style:none;border-radius:16px;border:1px solid rgba(3,210,182,.34);background:#062229;box-shadow:0 24px 60px -20px rgba(0,0,0,.85);opacity:0;transform:translateY(-6px);pointer-events:none;transition:opacity .18s,transform .18s}
.nx-lang.open ul{opacity:1;transform:none;pointer-events:auto}
.nx-lang li a{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:10px;color:#EAF7F5;font:500 15px/1.2 Poppins,system-ui,sans-serif;text-decoration:none}
.nx-lang li a:hover,.nx-lang li a:focus-visible{background:rgba(3,210,182,.12);outline:none}
.nx-lang li a[aria-current="true"]{color:#03EBCA;font-weight:600}
.nx-lang .ok{margin-left:auto;width:16px;height:16px;color:#03D2B6}
.nx-lang .cap{padding:6px 12px 8px;color:rgba(234,247,245,.55);font:500 12.5px/1.2 Poppins,system-ui,sans-serif}
@media (max-width:560px){.nx-lang>button{padding:0 10px;gap:6px}.nx-lang .code{display:none}
.nav-in .nx-lang>button{width:40px;padding:0;justify-content:center}.nav-in .nx-lang .chev{display:none}}
.nx-lang.out{position:absolute;right:20px;top:50%;transform:translateY(-50%)}.nx-lang.out .code{display:none}
.nav-in.nx-c1{gap:14px}.nav-in.nx-c1 .nav-links{gap:14px}.nav-in.nx-c1 .nx-lang .code{display:none}
.nav-in.nx-tight .nav-links{display:none}.nav-in.nx-tight .nav-x{margin-left:auto}
.nav-in.nx-tight2 .nav-x{display:none}.nav-in.nx-tight2 .nav-x + .btn-s{margin-left:auto}
.nx-fr-note{display:flex;align-items:center;gap:10px;width:fit-content;max-width:calc(100% - 32px);margin:14px auto 0;padding:10px 16px;border-radius:999px;border:1px solid rgba(3,210,182,.34);background:rgba(6,34,41,.8);color:#EAF7F5;font:500 14px/1.35 Poppins,system-ui,sans-serif}
.nx-fr-note .fl{flex:0 0 auto;width:20px;height:14px;border-radius:3px;overflow:hidden}.nx-fr-note .fl svg{display:block;width:100%;height:100%}`;
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const capTxt = { fr: 'Langue du site', en: 'Site language', es: 'Idioma del sitio', it: 'Lingua del sito' }[lang];
    const box = document.createElement('div'); box.className = 'nx-lang'; box.setAttribute('data-i18n-skip', '');
    box.innerHTML = `<button type="button" aria-haspopup="true" aria-expanded="false" aria-label="${capTxt}"><span class="fl">${LANGS[lang].flag}</span><span class="code">${lang.toUpperCase()}</span><svg class="chev" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 3.5 5 6.5 8 3.5"/></svg></button>
<ul role="menu"><li class="cap">${capTxt}</li>${Object.entries(LANGS).map(([k, v]) => `<li role="none"><a role="menuitem" href="?lang=${k}" lang="${k}" data-l="${k}"${k === lang ? ' aria-current="true"' : ''}><span class="fl">${v.flag}</span>${v.label}${k === lang ? '<svg class="ok" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8.5 6.5 12 13 4.5"/></svg>' : ''}</a></li>`).join('')}</ul>`;
    const btn = box.querySelector('button');
    const close = () => { box.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
    btn.addEventListener('click', (e) => { e.stopPropagation(); const o = !box.classList.contains('open'); box.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); });
    document.addEventListener('click', (e) => { if (!box.contains(e.target)) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
    box.querySelectorAll('a[data-l]').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault(); const l = a.dataset.l; store.set(l);
      const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.toString();
    }));
    const navIn = document.querySelector('.nav-in');
    const head = document.querySelector('body > header .wrap');
    if (navIn) {
      const bar = navIn.closest('header') || navIn.parentElement;
      // grand écran : le menu se met dans la marge à droite, hors de la barre ; sinon dans la barre
      const over = () => navIn.scrollWidth > navIn.clientWidth + 1 || [...navIn.children].some(c => c.offsetParent && c.scrollWidth > c.clientWidth + 1);
      const fit = () => {
        const out = innerWidth >= 1340;
        box.classList.toggle('out', out);
        if (out && box.parentElement !== bar) bar.appendChild(box);
        if (!out && box.parentElement !== navIn) navIn.appendChild(box);
        navIn.classList.remove('nx-c1', 'nx-tight', 'nx-tight2');
        // si la barre déborde (textes plus longs) : plus serré, puis sans les liens de sections, puis sans le 2e bouton
        for (const c of ['nx-c1', 'nx-tight', 'nx-tight2']) { if (!over()) break; navIn.classList.add(c); }
      };
      fit(); addEventListener('resize', fit); document.fonts && document.fonts.ready.then(fit); setTimeout(fit, 300);
      window.__nxFit = fit;
    }
    else if (head) { box.style.marginLeft = 'auto'; head.style.display = 'flex'; head.style.alignItems = 'center'; head.appendChild(box); }
    else { box.classList.add('fixed'); document.body.appendChild(box); }
    // Formation : le contenu reste en français
    if (PAGE === 'formation' && lang !== 'fr') {
      const note = { en: 'The course itself is in French.', es: 'La formación en sí está en francés.', it: 'Il corso è in francese.' }[lang];
      const hero = document.querySelector('main h1');
      if (hero) { const n = document.createElement('p'); n.className = 'nx-fr-note'; n.setAttribute('data-i18n-skip', ''); n.innerHTML = `<span class="fl">${LANGS.fr.flag}</span>${note}`; hero.insertAdjacentElement('afterend', n); }
    }
  }

  // ---------- démarrage ----------
  const ready = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
  const getJSON = (url) => fetch(url, { cache: 'no-cache' }).then(r => r.ok ? r.json() : {}).catch(() => ({}));
  if (lang !== 'fr') {
    const hide = document.createElement('style'); hide.id = 'nx-i18n-wait'; hide.textContent = 'body{visibility:hidden}';
    document.head.appendChild(hide);
    setTimeout(() => hide.remove(), 1500);
  }
  const dict = lang === 'fr' ? Promise.resolve([{}, {}]) : Promise.all([getJSON(`${BASE}common.${lang}.json`), getJSON(`${BASE}${PAGE}.${lang}.json`)]);

  ready(() => dict.then(([c, p]) => {
    T = Object.assign({}, c.t || {}, p.t || {});
    P = [...(p.p || []), ...(c.p || [])].map(([r, s]) => [new RegExp(r), s]);
    if (!EXTRACT) menu();
    if (lang !== 'fr' || EXTRACT) {
      translateHead();
      units(document.body).forEach(translateUnit);
      translateAttrs(document.body);
      new MutationObserver((ms) => {
        const roots = new Set();
        for (const m of ms) {
          if (m.type === 'characterData') roots.add(m.target.parentNode);
          else if (m.type === 'attributes') { if (!EXTRACT) translateAttrs(m.target); else translateAttrs(m.target); }
          else m.addedNodes.forEach(n => roots.add(n.nodeType === 3 ? n.parentNode : n));
        }
        roots.forEach(r => r && r.isConnected && translateScope(r));
        if (document.title) translateHead();
      }).observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }
    if (window.__nxFit) window.__nxFit();
    const w = document.getElementById('nx-i18n-wait'); if (w) w.remove();
  }));

  window.__i18n = { lang, page: PAGE, keys, missing };
})();
