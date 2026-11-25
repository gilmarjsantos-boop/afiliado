/* Ofertas ML SPGVALE — vitrine de afiliados (sem bibliotecas) */
(function () {
  'use strict';

  var PRODUCTS_URL = 'products.json';
  var FAV_KEY = 'spgvale_favoritos';
  var PER_SECTION = 10; // quantos produtos aparecem por categoria na página inicial

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };

  var data = { categorias: [], produtos: [], atualizado_em: '' };
  var state = { q: '', cat: '', price: '', sort: 'rank', fav: false, expanded: {} };
  var favs = loadFavs();

  /* ---------- utilidades ---------- */
  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  function brl(v) {
    return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }
  function ddmm(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] : '';
  }
  function safeUrl(u) {
    return /^https:\/\//i.test(String(u || '')) ? String(u) : '';
  }
  function safeImg(u) {
    u = String(u || '');
    return /^https:\/\//i.test(u) || /^[\w./-]+$/.test(u) ? u : '';
  }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else n.setAttribute(k, v === true ? '' : v);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function icon(id, cls) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('class', 'ic' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS(ns, 'use');
    u.setAttribute('href', '#i-' + id);
    s.appendChild(u);
    return s;
  }
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.classList.remove('is-on'); }, 2200);
  }

  /* ---------- favoritos (navegador do visitante) ---------- */
  function loadFavs() {
    try { return JSON.parse(localStorage.getItem(FAV_KEY)) || []; } catch (e) { return []; }
  }
  function saveFavs() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) { /* modo privado */ }
  }
  function isFav(id) { return favs.indexOf(id) !== -1; }
  function toggleFav(id) {
    if (isFav(id)) favs = favs.filter(function (x) { return x !== id; });
    else favs.push(id);
    saveFavs();
    updateFavCount();
    return isFav(id);
  }
  function updateFavCount() {
    var n = favs.filter(function (id) { return byId[id]; }).length;
    var b = $('#favCount');
    b.textContent = n;
    b.hidden = n === 0;
  }

  /* ---------- ícone automático da categoria ---------- */
  var ICON_RULES = [
    [/celular|telefon|smartphone/, 'phone'],
    [/informatica|computador|notebook|tablet/, 'laptop'],
    [/audio|fone|som/, 'headphones'],
    [/eletronico|tv|video|camera/, 'tv'],
    [/cozinha|eletrodomestic/, 'kitchen'],
    [/casa|move|decora|jardim|lar/, 'home'],
    [/ferrament|construc|industria/, 'tools'],
    [/beleza|cuidado|perfum|cosmetic/, 'beauty'],
    [/carro|moto|auto|veicul|acessorios para v/, 'car'],
    [/game|console|videogame|brinquedo|hobb/, 'game'],
    [/roupa|calcad|moda|bolsa|joia|relogio/, 'shirt'],
    [/bebe|infantil/, 'baby'],
    [/esporte|fitness|academia/, 'sport'],
    [/livro|revista|papelaria/, 'book'],
    [/animal|pet/, 'pet'],
    [/saude|farmacia|suplemento/, 'health']
  ];
  function catIcon(c) {
    if (c.icone) return c.icone;
    var n = norm(c.nome);
    for (var i = 0; i < ICON_RULES.length; i++) if (ICON_RULES[i][0].test(n)) return ICON_RULES[i][1];
    return 'tag';
  }

  /* ---------- dados ---------- */
  var byId = {}, catById = {};
  function prepare(json) {
    data.atualizado_em = json.atualizado_em || '';
    data.categorias = (json.categorias || []).filter(function (c) { return c && c.id && c.nome; });
    data.categorias.forEach(function (c) { catById[c.id] = c; });
    data.produtos = (json.produtos || []).filter(function (p) {
      var ok = p && p.id && p.nome && safeUrl(p.link_afiliado) && catById[p.categoria] && isFinite(p.preco);
      if (!ok && window.console) console.warn('Produto ignorado (dados incompletos):', p);
      return ok;
    });
    data.produtos.forEach(function (p) {
      p._search = norm(p.nome + ' ' + catById[p.categoria].nome);
      p.preco = Number(p.preco);
      p.ranking = Number(p.ranking) || 999;
      byId[p.id] = p;
    });
  }

  /* ---------- filtros ---------- */
  function priceMatch(p) {
    if (!state.price) return true;
    var r = state.price.split('-');
    var min = r[0] ? Number(r[0]) : 0, max = r[1] ? Number(r[1]) : Infinity;
    return p.preco >= min && p.preco <= max;
  }
  function filtered() {
    var words = norm(state.q).split(/\s+/).filter(Boolean);
    var list = data.produtos.filter(function (p) {
      if (state.cat && p.categoria !== state.cat) return false;
      if (state.fav && !isFav(p.id)) return false;
      if (!priceMatch(p)) return false;
      for (var i = 0; i < words.length; i++) if (p._search.indexOf(words[i]) === -1) return false;
      return true;
    });
    return sortList(list);
  }
  function sortList(list) {
    var catOrder = {};
    data.categorias.forEach(function (c, i) { catOrder[c.id] = i; });
    return list.slice().sort(function (a, b) {
      if (state.sort === 'price-asc') return a.preco - b.preco;
      if (state.sort === 'price-desc') return b.preco - a.preco;
      return a.ranking - b.ranking || catOrder[a.categoria] - catOrder[b.categoria];
    });
  }
  function isFiltering() { return !!(state.q || state.cat || state.price || state.fav); }
  function activeFilterCount() {
    return (state.cat ? 1 : 0) + (state.price ? 1 : 0) + (state.fav ? 1 : 0) + (state.sort !== 'rank' ? 1 : 0);
  }

  /* ---------- card ---------- */
  function card(p) {
    var cat = catById[p.categoria];
    var link = safeUrl(p.link_afiliado);
    var linkAttrs = { href: link, target: '_blank', rel: 'sponsored nofollow noopener' };
    function a(cls, label, kids) {
      var o = Object.assign({ class: cls }, linkAttrs);
      if (label) o['aria-label'] = label;
      return el('a', o, kids);
    }

    var img = el('img', {
      src: safeImg(p.imagem), alt: p.nome, loading: 'lazy', decoding: 'async', width: 300, height: 300
    });
    img.addEventListener('error', function () { img.remove(); imgLink.classList.add('is-broken'); }, { once: true });
    var imgLink = a('card__img', p.nome + ' — ver no Mercado Livre', [img]);

    var fav = el('button', {
      class: 'card__fav', type: 'button', 'aria-pressed': String(isFav(p.id)),
      'aria-label': 'Salvar nos favoritos: ' + p.nome, 'data-id': p.id
    }, [icon('heart')]);

    var share = el('a', {
      class: 'card__share',
      href: 'https://wa.me/?text=' + encodeURIComponent(p.nome + ' no Mercado Livre: ' + link),
      target: '_blank', rel: 'nofollow noopener', 'aria-label': 'Compartilhar no WhatsApp', title: 'Compartilhar no WhatsApp'
    }, [icon('chat')]);

    var date = ddmm(p.consultado_em || data.atualizado_em);

    return el('article', { class: 'card' }, [
      el('span', { class: 'card__rank' + (p.ranking <= 3 ? ' card__rank--top' : ''), text: p.ranking + 'º mais vendido', title: p.ranking + 'º mais vendido em ' + cat.nome + ' no Mercado Livre' }),
      fav,
      imgLink,
      el('div', { class: 'card__cat', text: cat.nome }),
      a('card__name', null, [p.nome]),
      el('div', { class: 'card__price', text: brl(p.preco) }),
      date ? el('div', { class: 'card__date', text: 'Preço consultado em ' + date }) : null,
      a('card__check', null, ['Ver preço atual no Mercado Livre ', icon('external')]),
      el('div', { class: 'card__actions' }, [
        a('btn btn--yellow card__buy', null, ['Ver no Mercado Livre']),
        share
      ])
    ]);
  }

  /* ---------- render ---------- */
  function render() {
    var results = $('#results');
    results.textContent = '';
    var list = filtered();
    var status = $('#status');
    status.textContent = '';
    status.classList.remove('has-msg');

    if (!data.produtos.length) {
      results.appendChild(el('div', { class: 'empty' }, [
        el('h2', { text: 'Nenhum produto cadastrado ainda' }),
        el('p', { text: 'Adicione produtos no arquivo products.json (veja o README).' })
      ]));
      $('#countMobile').textContent = '';
      return;
    }

    $('#countMobile').textContent = list.length + (list.length === 1 ? ' produto' : ' produtos');

    if (isFiltering() || state.sort !== 'rank') {
      // Resultado único (busca/filtros ativos)
      var title = state.fav ? 'Meus favoritos' : state.q ? 'Resultados para “' + state.q + '”' : state.cat ? catById[state.cat].nome : 'Produtos';
      status.appendChild(el('strong', { text: list.length + (list.length === 1 ? ' produto encontrado' : ' produtos encontrados') }));
      status.appendChild(document.createTextNode(' · '));
      var clear = el('button', { type: 'button', text: 'limpar filtros' });
      clear.addEventListener('click', clearFilters);
      status.appendChild(clear);

      if (!list.length) {
        var btn = el('button', { class: 'btn btn--yellow', type: 'button', text: 'Limpar filtros' });
        btn.addEventListener('click', clearFilters);
        results.appendChild(el('div', { class: 'empty' }, [
          el('h2', { text: state.fav && !favs.length ? 'Você ainda não salvou favoritos' : 'Nenhum produto encontrado' }),
          el('p', { text: state.fav && !favs.length ? 'Toque no coração de um produto para salvar aqui.' : 'Tente outra palavra ou remova algum filtro.' }),
          btn
        ]));
        return;
      }
      results.appendChild(section(title, state.cat ? catIcon(catById[state.cat]) : 'search', list, null));
      return;
    }

    // Página inicial: uma seção por categoria, na ordem do Mercado Livre
    data.categorias.forEach(function (c) {
      var items = list.filter(function (p) { return p.categoria === c.id; });
      if (!items.length) return;
      results.appendChild(section('Mais vendidos em ' + c.nome, catIcon(c), items, c));
    });
  }

  function section(title, ic, items, cat) {
    var expanded = cat && state.expanded[cat.id];
    var shown = cat && !expanded ? items.slice(0, PER_SECTION) : items;
    var head = el('div', { class: 'section__head' }, [
      el('div', null, [
        el('h2', null, [icon(ic), title]),
        el('div', { class: 'section__meta', text: 'Fonte: Mais vendidos do Mercado Livre' + (data.atualizado_em ? ' · Atualizado em ' + ddmm(data.atualizado_em) : '') })
      ])
    ]);
    if (cat && items.length > PER_SECTION) {
      var more = el('button', { class: 'section__more', type: 'button' }, [expanded ? 'Ver menos' : 'Ver todos (' + items.length + ')', icon(expanded ? 'up' : 'right')]);
      more.addEventListener('click', function () { state.expanded[cat.id] = !expanded; render(); });
      head.appendChild(more);
    }
    var grid = el('div', { class: 'grid' }, shown.map(card));
    var s = el('section', { class: 'section', 'aria-label': title }, [head, grid]);
    if (cat) s.id = 'cat-' + cat.id;
    return s;
  }

  function renderCats() {
    var box = $('#cats'), drawer = $('#drawerCats'), select = $('#fCat');
    box.textContent = ''; drawer.textContent = '';
    var counts = {};
    data.produtos.forEach(function (p) { counts[p.categoria] = (counts[p.categoria] || 0) + 1; });
    var cats = data.categorias.filter(function (c) { return counts[c.id]; });

    function catBtn(c, ic, label) {
      var b = el('button', { class: 'cat', type: 'button', 'aria-pressed': String(state.cat === (c ? c.id : '')), 'data-cat': c ? c.id : '' }, [
        el('span', { class: 'cat__ic' }, [icon(ic)]), el('span', { text: label })
      ]);
      b.addEventListener('click', function () { setCat(c ? c.id : ''); scrollToProducts(); });
      return b;
    }
    cats.forEach(function (c) { box.appendChild(catBtn(c, catIcon(c), c.nome)); });
    box.appendChild(catBtn(null, 'grid', 'Todas as Categorias'));

    cats.forEach(function (c) {
      var a = el('a', { href: '#produtos' }, [icon(catIcon(c)), c.nome]);
      a.addEventListener('click', function (e) { e.preventDefault(); closeDrawer(); setCat(c.id); scrollToProducts(); });
      drawer.appendChild(a);
    });

    while (select.options.length > 1) select.remove(1);
    cats.forEach(function (c) { select.appendChild(el('option', { value: c.id, text: c.nome + ' (' + counts[c.id] + ')' })); });
  }

  function renderRanking() {
    var ol = $('#rankingList');
    ol.textContent = '';
    data.categorias.forEach(function (c) {
      var top = sortList(data.produtos.filter(function (p) { return p.categoria === c.id; }))[0];
      if (!top) return;
      var img = el('img', { src: safeImg(top.imagem), alt: top.nome, loading: 'lazy', decoding: 'async', width: 56, height: 56 });
      img.addEventListener('error', function () { img.style.visibility = 'hidden'; }, { once: true });
      ol.appendChild(el('li', null, [
        el('a', { class: 'r-item', href: safeUrl(top.link_afiliado), target: '_blank', rel: 'sponsored nofollow noopener' }, [
          img,
          el('div', null, [
            el('div', { class: 'r-item__cat', text: c.nome }),
            el('div', { class: 'r-item__name', text: top.nome }),
            el('div', { class: 'r-item__price', text: brl(top.preco) })
          ])
        ])
      ]));
    });
    $('#ranking').hidden = !ol.children.length;
  }

  function syncControls() {
    $('#q').value = state.q;
    $('#fCat').value = state.cat;
    $$('input[name=price]').forEach(function (r) { r.checked = r.value === state.price; });
    $('#fSort').value = state.sort;
    $('#fFav').checked = state.fav;
    $$('.cat').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-cat') === state.cat)); });
    $('#btnFavs').setAttribute('aria-pressed', String(state.fav));
    var n = activeFilterCount(), fc = $('#filterCount');
    fc.textContent = n; fc.hidden = n === 0;
  }
  function update() { syncControls(); render(); }

  function setCat(id) { state.cat = id; update(); }
  function clearFilters() {
    state.q = ''; state.cat = ''; state.price = ''; state.sort = 'rank'; state.fav = false;
    update();
  }
  function scrollToProducts() {
    var t = $('#produtos');
    var top = t.getBoundingClientRect().top + window.pageYOffset - ($('.topbar').offsetHeight + 8);
    window.scrollTo({ top: top, behavior: 'smooth' });
  }

  /* ---------- gaveta e painel de filtros ---------- */
  var overlay = $('#overlay');
  function openPanel(panel, btn) {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }
  function closePanels() {
    [$('#drawer'), $('#filters')].forEach(function (p) {
      p.classList.remove('is-open');
    });
    $('#drawer').setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.style.overflow = '';
    $('#btnMenu').setAttribute('aria-expanded', 'false');
  }
  function closeDrawer() { closePanels(); }

  /* ---------- eventos ---------- */
  function bind() {
    var qTimer;
    $('#q').addEventListener('input', function (e) {
      clearTimeout(qTimer);
      var v = e.target.value;
      qTimer = setTimeout(function () { state.q = v.trim(); render(); syncFilterBadge(); }, 120);
    });
    $('#searchForm').addEventListener('submit', function (e) {
      e.preventDefault();
      state.q = $('#q').value.trim();
      $('#q').blur();
      render();
      scrollToProducts();
    });
    $('#fCat').addEventListener('change', function (e) { setCat(e.target.value); });
    $$('input[name=price]').forEach(function (r) {
      r.addEventListener('change', function () { state.price = r.value; update(); });
    });
    $('#fSort').addEventListener('change', function (e) { state.sort = e.target.value; update(); });
    $('#fFav').addEventListener('change', function (e) { state.fav = e.target.checked; update(); });
    $('#btnClear').addEventListener('click', clearFilters);

    function showFavs(e) {
      if (e) e.preventDefault();
      state.fav = !state.fav || (e && e.currentTarget.tagName === 'A');
      closePanels();
      update();
      scrollToProducts();
    }
    $('#btnFavs').addEventListener('click', showFavs);
    $$('[data-action=favs]').forEach(function (a) { a.addEventListener('click', showFavs); });

    // favoritos nos cards (delegação)
    $('#results').addEventListener('click', function (e) {
      var b = e.target.closest('.card__fav');
      if (!b) return;
      var on = toggleFav(b.getAttribute('data-id'));
      b.setAttribute('aria-pressed', String(on));
      toast(on ? 'Salvo nos favoritos' : 'Removido dos favoritos');
      if (state.fav && !on) render();
    });

    $('#btnMenu').addEventListener('click', function () { openPanel($('#drawer'), this); });
    $('#btnFilter').addEventListener('click', function () { openPanel($('#filters')); });
    $$('[data-close]').forEach(function (b) { b.addEventListener('click', closePanels); });
    $$('[data-close-filters]').forEach(function (b) {
      b.addEventListener('click', function () { closePanels(); if (b.id === 'btnApply') scrollToProducts(); });
    });
    overlay.addEventListener('click', closePanels);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePanels(); });

    var toTop = $('#toTop');
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { toTop.hidden = window.pageYOffset < 600; ticking = false; });
    }, { passive: true });
    toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }
  function syncFilterBadge() { $('#countMobile').textContent = filtered().length + ' produtos'; }

  /* ---------- rodapé e redes ---------- */
  function footer() {
    $('#year').textContent = new Date().getFullYear();
    $('#footerUpdated').textContent = data.atualizado_em ? 'Atualizado em ' + ddmm(data.atualizado_em) : '—';
    $$('.social a').forEach(function (a) { if (!a.getAttribute('href')) a.hidden = true; });
    var social = $('.footer__social');
    if (social && !$$('.social a').some(function (a) { return !a.hidden; })) social.hidden = true;
  }

  /* ---------- início ---------- */
  bind();
  fetch(PRODUCTS_URL, { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (json) {
      prepare(json);
      updateFavCount();
      renderCats();
      renderRanking();
      footer();
      update();
    })
    .catch(function (err) {
      footer();
      $('#ranking').hidden = true;
      $('#results').appendChild(el('div', { class: 'empty' }, [
        el('h2', { text: 'Não foi possível carregar os produtos' }),
        el('p', { text: location.protocol === 'file:' ?
          'Abra o site por um servidor (por exemplo, depois de subir na hospedagem). Navegadores bloqueiam a leitura do products.json direto do computador.' :
          'Confira se o arquivo products.json está na mesma pasta do index.html e se o conteúdo é um JSON válido. (' + err.message + ')' })
      ]));
    });
})();
