/* ═══════════════════════════════════════════════════════════════
   NOE.vet — script.js (sin librerías externas)
   Cada módulo está aislado con safe(): si uno falla, la página sigue.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var root = document.documentElement;
  // Marca que el JS arrancó: el CSS solo oculta contenido para animarlo si hay JS.
  root.classList.add('js-on');

  /* ───────── CONFIGURACIÓN ─────────
     Número de WhatsApp de NOE.vet (52 + 10 dígitos). Es el ÚNICO lugar donde vive.
     Si se deja vacío, los botones de WhatsApp y el envío se ocultan solos. */
  var WHATSAPP_NUMERO = '524621837321';
  var CLAVE_PEDIDO = 'noevet-pedido-v1';

  /* ───────── Utilidades ───────── */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var money = function (n) { return '$' + Number(n).toLocaleString('es-MX'); };
  // Rango de marcas de acento (U+0300 a U+036F), armado con códigos para evitar ambigüedades
  var ACENTOS = new RegExp('[' + String.fromCharCode(768) + '-' + String.fromCharCode(879) + ']', 'g');
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(ACENTOS, ''); };

  function safe(fn) {
    try { fn(); } catch (e) { /* un módulo no debe romper a los demás */ }
  }

  function el(tag, cls, txt) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (txt !== undefined) n.textContent = txt;
    return n;
  }

  /* ───────── WhatsApp ───────── */
  var waBase = WHATSAPP_NUMERO ? 'https://wa.me/' + WHATSAPP_NUMERO : '';
  function waUrl(texto) {
    if (!waBase) return '';
    return waBase + (texto ? '?text=' + encodeURIComponent(texto) : '');
  }
  var MSG_BASE = 'Hola Noé, vi la página de NOE.vet y quiero hacer una consulta.';

  function hidratarWhatsApp() {
    $$('[data-wa]').forEach(function (a) {
      if (!waBase) { a.hidden = true; return; }
      a.href = waUrl(a.getAttribute('data-wa-msg') || MSG_BASE);
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    });
    if (!waBase) {
      $$('[data-wa-cart]').forEach(function (a) { a.hidden = true; });
      var envio = $('#form-contacto button[type="submit"]');
      if (envio) envio.hidden = true;
    }
  }

  /* ───────── Imágenes con aparición suave ───────── */
  function imagenes() {
    $$('.pimg img').forEach(function (img) {
      var listo = function () { img.classList.add('is-ready'); };
      if (img.complete) listo();
      else {
        img.addEventListener('load', listo, { once: true });
        img.addEventListener('error', listo, { once: true });
      }
    });
  }

  /* ───────── Cargador ───────── */
  function cargador() {
    var c = $('#cargador');
    if (!c) return;
    var pct = $('[data-load-pct]', c);
    var t0 = performance.now();
    var MIN = reduce ? 0 : 1150;
    var MAX = 1500;
    var cargada = document.readyState === 'complete';
    var terminado = false;
    window.addEventListener('load', function () { cargada = true; });

    function salir() {
      c.classList.add('is-out');
      document.body.classList.add('is-ready');
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 800);
    }

    function cuadro(ahora) {
      var t = ahora - t0;
      if (!terminado && ((cargada && t >= MIN) || t >= MAX)) {
        terminado = true;
        if (pct) pct.textContent = '100';
        setTimeout(salir, 200);
        return;
      }
      if (pct) pct.textContent = String(Math.round(clamp(t / (MIN || 1), 0, 1) * 92));
      requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
  }

  /* ───────── Encabezado, menú y secciones activas ───────── */
  function cabecera() {
    var burger = $('#burger');
    var menu = $('#menu-movil');
    if (burger && menu) {
      var estado = function (abierto) {
        menu.classList.toggle('is-open', abierto);
        menu.setAttribute('aria-hidden', String(!abierto));
        burger.setAttribute('aria-expanded', String(abierto));
        burger.setAttribute('aria-label', abierto ? 'Cerrar menú' : 'Abrir menú');
        document.body.classList.toggle('no-scroll', abierto);
      };
      burger.addEventListener('click', function () { estado(!menu.classList.contains('is-open')); });
      $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { estado(false); }); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-open')) estado(false);
      });
      window.addEventListener('resize', function () {
        if (window.innerWidth >= 900 && menu.classList.contains('is-open')) estado(false);
      });
    }

    if ('IntersectionObserver' in window) {
      var enlaces = $$('.nav a');
      var io = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (en) {
          if (!en.isIntersecting) return;
          enlaces.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id);
          });
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      ['lineas', 'catalogo', 'como', 'promos', 'porque', 'contacto'].forEach(function (id) {
        var s = document.getElementById(id);
        if (s) io.observe(s);
      });
    }
  }

  /* ───────── Entradas con scroll ───────── */
  function reveals() {
    var items = $$('[data-reveal]');
    if (!items.length || reduce) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (n) { n.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = en.target;
        n.classList.add('is-in');
        io.unobserve(n);
        var d = parseFloat(getComputedStyle(n).transitionDelay) || 0;
        // Al terminar la entrada se libera el atributo para no estorbar a los hover
        setTimeout(function () {
          n.removeAttribute('data-reveal');
          n.classList.remove('is-in');
        }, 1200 + d * 1000);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    items.forEach(function (n) { io.observe(n); });
  }

  /* ───────── Frase del manifiesto, palabra por palabra ───────── */
  function palabras() {
    var h = $('[data-words]');
    if (!h) return [];
    var txt = h.textContent.replace(/\s+/g, ' ').trim();
    h.setAttribute('aria-label', txt);
    h.textContent = '';
    return txt.split(' ').map(function (p) {
      var s = el('span', 'w', p + ' ');
      s.setAttribute('aria-hidden', 'true');
      h.appendChild(s);
      return s;
    });
  }

  /* ───────── Motor de scroll: progreso, hero, portal, tarjetas apiladas ───────── */
  function motor(ws) {
    var top = $('#top');
    var hero = $('#inicio');
    var portal = $('#promesa');
    var stk = $$('.stk');
    var ultimoN = -1;
    var pendiente = false;
    var topes = [];

    function medirTopes() {
      topes = stk.map(function (c) { return parseFloat(getComputedStyle(c).top) || 0; });
    }
    medirTopes();

    var easeIO = function (t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };

    function paso() {
      pendiente = false;
      var y = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;
      var max = root.scrollHeight - vh;
      root.style.setProperty('--sp', max > 0 ? (y / max).toFixed(4) : '0');
      if (top) top.classList.toggle('is-stuck', y > 24);

      if (hero && !reduce) {
        var hh = hero.offsetHeight || vh;
        if (y < hh * 1.1) hero.style.setProperty('--hp', clamp(y / (hh * 0.9), 0, 1).toFixed(3));
      }

      if (portal && !reduce) {
        var r = portal.getBoundingClientRect();
        var total = r.height - vh;
        var p = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
        var maxR = Math.hypot(window.innerWidth, vh) / 2 * 1.06;
        var abrir = clamp(p / 0.4, 0, 1);
        var e = easeIO(abrir);
        portal.style.setProperty('--r', (e * maxR).toFixed(1) + 'px');
        portal.style.setProperty('--ps', (1 + e * 0.8).toFixed(3));
        portal.style.setProperty('--po', (1 - clamp((abrir - 0.5) / 0.5, 0, 1)).toFixed(3));
        if (ws.length) {
          var n = Math.round(clamp((p - 0.3) / 0.55, 0, 1) * ws.length);
          if (n !== ultimoN) {
            ws.forEach(function (w, i) { w.classList.toggle('on', i < n); });
            ultimoN = n;
          }
        }
      }

      if (!reduce && stk.length > 1) {
        stk.forEach(function (c, i) {
          var sig = stk[i + 1];
          if (!sig) return;
          var rc = c.getBoundingClientRect();
          var rs = sig.getBoundingClientRect();
          var d = clamp((rc.bottom - rs.top) / (rc.height || 1), 0, 1);
          c.style.setProperty('--sc', (1 - d * 0.06).toFixed(4));
          c.style.setProperty('--dim', (1 - d * 0.55).toFixed(3));
        });
      }
    }

    function pedir() {
      if (!pendiente) {
        pendiente = true;
        requestAnimationFrame(paso);
      }
    }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', function () { medirTopes(); pedir(); });
    paso();
  }

  /* ───────── Botones magnéticos ───────── */
  function magneticos() {
    if (!fine || reduce) return;
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.22;
        var y = (e.clientY - r.top - r.height / 2) * 0.32;
        b.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ═══════════ TIENDA: catálogo + carrito + detalle + promos ═══════════ */
  var productos = {};

  function tienda() {
    var grid = $('#grid');
    if (!grid) return;
    var cards = $$('.pcard', grid);
    var cuenta = $('#cat-count');
    var vacio = $('#cat-empty');
    var buscador = $('#buscar');
    var toastEl = $('#toast');
    var toastT = 0;
    var cart = {};

    /* --- Lee los productos desde el HTML (una sola fuente de verdad) --- */
    cards.forEach(function (c, i) {
      var d = c.dataset;
      productos[d.id] = {
        id: d.id,
        nombre: d.nombre,
        pres: d.pres || '',
        precio: d.precio ? Number(d.precio) : 0,
        marca: d.marca || '',
        sp: d.sp,
        etiqueta: ($('.pc-tag', c) || {}).textContent || '',
        desc: ($('.pc-desc', c) || {}).textContent || '',
        usos: $$('.pc-usos li', c).map(function (li) { return li.textContent; }),
        pimg: $('.pimg', c)
      };
      if (!reduce) {
        c.setAttribute('data-reveal', '');
        c.style.setProperty('--d', ((i % 4) * 70) + 'ms');
      }
    });

    function avisar(msg) {
      if (!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('is-on');
      clearTimeout(toastT);
      toastT = setTimeout(function () { toastEl.classList.remove('is-on'); }, 2600);
    }

    /* --- Filtros y búsqueda --- */
    var filtro = 'todos';
    var consulta = '';
    function aplicar(animar) {
      var n = 0;
      cards.forEach(function (c) {
        var okSp = filtro === 'todos' || c.dataset.sp.split(' ').indexOf(filtro) !== -1;
        var texto = norm(c.dataset.nombre + ' ' + c.dataset.marca + ' ' + c.dataset.q + ' ' + c.dataset.sp);
        var okQ = !consulta || consulta.split(' ').every(function (t) { return texto.indexOf(t) !== -1; });
        var ver = okSp && okQ;
        c.classList.toggle('is-hidden', !ver);
        if (ver) {
          c.style.setProperty('--n', String(n));
          if (animar && !c.hasAttribute('data-reveal')) {
            c.classList.remove('is-pop');
            void c.offsetWidth;
            c.classList.add('is-pop');
          }
          n += 1;
        }
      });
      if (cuenta) cuenta.textContent = n === 1 ? '1 producto' : n + ' productos';
      if (vacio) vacio.hidden = n !== 0;
    }
    function setFiltro(f) {
      filtro = f;
      $$('.tab').forEach(function (t) {
        var on = t.getAttribute('data-tab') === f;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-pressed', String(on));
      });
      aplicar(true);
    }
    $$('.tab').forEach(function (t) {
      t.addEventListener('click', function () { setFiltro(t.getAttribute('data-tab')); });
    });
    $$('[data-filter]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (buscador) { buscador.value = ''; consulta = ''; }
        setFiltro(a.getAttribute('data-filter'));
      });
    });
    if (buscador) {
      buscador.addEventListener('input', function () {
        consulta = norm(buscador.value).trim().replace(/\s+/g, ' ');
        aplicar(true);
      });
    }
    aplicar(false);

    /* --- Brillo que sigue al puntero en las tarjetas --- */
    if (fine) {
      grid.addEventListener('pointermove', function (e) {
        var c = e.target.closest ? e.target.closest('.pcard') : null;
        if (!c) return;
        var r = c.getBoundingClientRect();
        c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
        c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
      });
    }

    /* ═════ Carrito ═════ */
    var drawer = $('#cart');
    var back = $('#cart-backdrop');
    var lista = $('#cart-list');
    var vacioCart = $('#cart-empty');
    var pie = $('#cart-foot');
    var totalEl = $('#cart-total');
    var enviar = $('#cart-send');
    var pill = $('#cart-pill');
    var btnCart = $('.cart-btn');
    var inNombre = $('#cart-nombre');
    var inNotas = $('#cart-notas');

    function cargarPedido() {
      try {
        var o = JSON.parse(localStorage.getItem(CLAVE_PEDIDO) || '{}');
        Object.keys(o).forEach(function (id) {
          if (productos[id] && o[id] > 0) cart[id] = Math.min(99, o[id] | 0);
        });
      } catch (e) { /* almacenamiento no disponible */ }
    }
    function guardarPedido() {
      try { localStorage.setItem(CLAVE_PEDIDO, JSON.stringify(cart)); } catch (e) { /* sin almacenamiento */ }
    }
    function totalPiezas() {
      return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0);
    }
    function totalPrecio() {
      return Object.keys(cart).reduce(function (s, id) { return s + productos[id].precio * cart[id]; }, 0);
    }

    function mensajePedido() {
      var nombre = inNombre ? inNombre.value.trim() : '';
      var notas = inNotas ? inNotas.value.trim() : '';
      var sinPrecio = false;
      var lineas = Object.keys(cart).map(function (id) {
        var p = productos[id];
        if (!p.precio) sinPrecio = true;
        return '• ' + cart[id] + ' × ' + p.nombre + (p.pres ? ' (' + p.pres + ')' : '');
      });
      var t = 'Hola Noé 👋' + (nombre ? ' Soy ' + nombre + '.' : '') + ' Vi tu catálogo en la página de NOE.vet y quiero hacer este pedido:\n\n' + lineas.join('\n') + '\n\n';
      var tot = totalPrecio();
      if (tot > 0) t += 'Total de referencia: ' + money(tot) + ' MXN\n';
      if (sinPrecio) t += '(Hay productos sin precio publicado: ¿me los cotizas?)\n';
      if (notas) t += 'Notas: ' + notas + '\n';
      t += '¿Me confirmas disponibilidad y mi precio amigo? 🙌';
      return t;
    }

    function pintarCarrito() {
      var ids = Object.keys(cart);
      var piezas = totalPiezas();
      $$('[data-cart-count]').forEach(function (n) { n.textContent = String(piezas); });
      if (btnCart) btnCart.classList.toggle('has-items', piezas > 0);
      if (pill) pill.hidden = piezas === 0;
      if (vacioCart) vacioCart.hidden = ids.length > 0;
      if (pie) pie.hidden = ids.length === 0;
      if (!lista) return;
      lista.textContent = '';
      ids.forEach(function (id) {
        var p = productos[id];
        var li = el('li', 'ci-row');
        if (p.pimg) {
          var mini = p.pimg.cloneNode(true);
          var im = mini.querySelector('img');
          if (im) { im.classList.add('is-ready'); im.setAttribute('loading', 'eager'); }
          li.appendChild(mini);
        }
        var info = el('div', 'ci-info');
        info.appendChild(el('b', '', p.nombre));
        info.appendChild(el('small', '', p.pres));
        var qty = el('div', 'qty');
        qty.setAttribute('role', 'group');
        qty.setAttribute('aria-label', 'Cantidad de ' + p.nombre);
        var menos = el('button', '', '−');
        menos.type = 'button';
        menos.setAttribute('aria-label', 'Quitar una pieza de ' + p.nombre);
        var out = el('output', '', String(cart[id]));
        var mas = el('button', '', '+');
        mas.type = 'button';
        mas.setAttribute('aria-label', 'Agregar una pieza de ' + p.nombre);
        menos.addEventListener('click', function () { cambiarCantidad(id, cart[id] - 1); });
        mas.addEventListener('click', function () { cambiarCantidad(id, cart[id] + 1); });
        qty.appendChild(menos);
        qty.appendChild(out);
        qty.appendChild(mas);
        info.appendChild(qty);
        li.appendChild(info);
        var lado = el('div', 'ci-side');
        lado.appendChild(el('span', 'ci-price', p.precio ? money(p.precio * cart[id]) : 'Por cotizar'));
        var quitar = el('button', 'ci-rm', 'Quitar');
        quitar.type = 'button';
        quitar.addEventListener('click', function () { cambiarCantidad(id, 0); });
        lado.appendChild(quitar);
        li.appendChild(lado);
        lista.appendChild(li);
      });
      if (totalEl) totalEl.textContent = money(totalPrecio());
      actualizarEnlace();
    }

    function actualizarEnlace() {
      if (enviar && waBase && Object.keys(cart).length) enviar.href = waUrl(mensajePedido());
    }

    function cambiarCantidad(id, n) {
      if (n <= 0) delete cart[id];
      else cart[id] = Math.min(99, n);
      guardarPedido();
      pintarCarrito();
    }

    function volar(origen) {
      if (reduce || !origen || !btnCart || !origen.getBoundingClientRect || !origen.animate) return;
      var a = origen.getBoundingClientRect();
      var b = btnCart.getBoundingClientRect();
      if (!b.width) return;
      var f = el('div', 'fly');
      f.style.left = (a.left + a.width / 2 - 22) + 'px';
      f.style.top = (a.top + a.height / 2 - 22) + 'px';
      document.body.appendChild(f);
      var dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      var dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      var an = f.animate([
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (dx * 0.5) + 'px,' + (dy - 90) + 'px) scale(0.8)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.2)', opacity: 0.3 }
      ], { duration: 760, easing: 'cubic-bezier(.5,0,.3,1)' });
      an.onfinish = function () { if (f.parentNode) f.parentNode.removeChild(f); };
    }

    function agregar(id, n, origen) {
      var p = productos[id];
      if (!p) return;
      cart[id] = Math.min(99, (cart[id] || 0) + (n || 1));
      guardarPedido();
      pintarCarrito();
      volar(origen);
      avisar('✓ ' + p.nombre + ' agregado a tu pedido');
      if (btnCart) {
        btnCart.classList.remove('is-bump');
        void btnCart.offsetWidth;
        btnCart.classList.add('is-bump');
      }
    }

    function abrirCarrito() {
      if (!drawer) return;
      drawer.removeAttribute('inert');
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
      if (back) {
        back.hidden = false;
        requestAnimationFrame(function () { back.classList.add('is-open'); });
      }
      document.body.classList.add('no-scroll');
      var x = $('[data-close-cart]', drawer);
      if (x) setTimeout(function () { x.focus(); }, 300);
    }
    function cerrarCarrito() {
      if (!drawer) return;
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
      drawer.setAttribute('inert', '');
      if (back) {
        back.classList.remove('is-open');
        setTimeout(function () { back.hidden = true; }, 400);
      }
      document.body.classList.remove('no-scroll');
    }
    $$('[data-open-cart]').forEach(function (b) { b.addEventListener('click', abrirCarrito); });
    $$('[data-close-cart]').forEach(function (b) { b.addEventListener('click', cerrarCarrito); });
    if (back) back.addEventListener('click', cerrarCarrito);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer && drawer.classList.contains('is-open')) cerrarCarrito();
    });
    var limpiar = $('#cart-clear');
    if (limpiar) {
      limpiar.addEventListener('click', function () {
        cart = {};
        guardarPedido();
        pintarCarrito();
      });
    }
    if (inNombre) inNombre.addEventListener('input', actualizarEnlace);
    if (inNotas) inNotas.addEventListener('input', actualizarEnlace);
    if (enviar) {
      enviar.addEventListener('click', function () {
        actualizarEnlace();
        avisar('Abriendo WhatsApp con tu pedido…');
      });
    }

    /* ═════ Detalle de producto ═════ */
    var dlg = $('#pmodal');
    var actual = null;
    var cantidad = 1;
    var pmQty = $('#pm-qty');

    function abrirDetalle(id) {
      var p = productos[id];
      if (!p || !dlg) return;
      actual = p;
      cantidad = 1;
      var media = $('#pm-media');
      media.textContent = '';
      var clon = p.pimg.cloneNode(true);
      var im = clon.querySelector('img');
      if (im) { im.classList.add('is-ready'); im.setAttribute('loading', 'eager'); }
      media.appendChild(clon);
      $('#pm-tag').textContent = p.etiqueta || 'NOE.vet';
      $('#pm-title').textContent = p.nombre;
      $('#pm-meta').textContent = [p.marca, p.pres].filter(Boolean).join(' · ');
      $('#pm-desc').textContent = p.desc;
      var ul = $('#pm-usos');
      ul.textContent = '';
      p.usos.forEach(function (u) { ul.appendChild(el('li', '', u)); });
      var precio = $('#pm-price');
      precio.textContent = '';
      if (p.precio) {
        precio.appendChild(el('small', '', 'Ref.'));
        precio.appendChild(document.createTextNode(' ' + money(p.precio)));
      } else {
        precio.textContent = 'Pregunta por su precio';
      }
      pmQty.textContent = '1';
      var ask = $('#pm-ask');
      if (ask && waBase) ask.href = waUrl('Hola Noé, quiero información de: ' + p.nombre + (p.pres ? ' (' + p.pres + ')' : '') + '.');
      document.body.classList.add('no-scroll');
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    }
    function cerrarDialogo(d) {
      if (d.open && typeof d.close === 'function') d.close();
      else d.removeAttribute('open');
      document.body.classList.remove('no-scroll');
    }

    if (dlg) {
      dlg.addEventListener('close', function () { document.body.classList.remove('no-scroll'); });
      dlg.addEventListener('click', function (e) { if (e.target === dlg) cerrarDialogo(dlg); });
      $$('[data-close]', dlg).forEach(function (b) { b.addEventListener('click', function () { cerrarDialogo(dlg); }); });
      $('#pm-minus').addEventListener('click', function () { cantidad = Math.max(1, cantidad - 1); pmQty.textContent = String(cantidad); });
      $('#pm-plus').addEventListener('click', function () { cantidad = Math.min(99, cantidad + 1); pmQty.textContent = String(cantidad); });
      $('#pm-add').addEventListener('click', function () {
        if (!actual) return;
        agregar(actual.id, cantidad, $('#pm-add'));
        cerrarDialogo(dlg);
      });
    }

    cards.forEach(function (c) {
      c.addEventListener('click', function (e) {
        var id = c.dataset.id;
        if (e.target.closest('[data-add]')) {
          agregar(id, 1, e.target.closest('[data-add]'));
          return;
        }
        if (e.target.closest('.pc-media') || e.target.closest('.pc-name') || e.target.closest('.pc-desc')) abrirDetalle(id);
      });
    });

    /* ═════ Promos en grande (lightbox) ═════ */
    var lb = $('#lightbox');
    var promos = $$('.flyer:not([aria-hidden="true"])').map(function (b) {
      var im = $('img', b);
      return {
        id: b.getAttribute('data-flyer'),
        nombre: b.getAttribute('data-nombre'),
        src: im.getAttribute('src'),
        alt: im.getAttribute('alt') || '',
        w: im.getAttribute('width'),
        h: im.getAttribute('height')
      };
    });
    var indice = 0;
    function mostrarPromo(i) {
      if (!promos.length) return;
      indice = (i + promos.length) % promos.length;
      var p = promos[indice];
      var img = $('#lb-img');
      img.src = p.src;
      img.alt = p.alt;
      if (p.w) img.setAttribute('width', p.w);
      if (p.h) img.setAttribute('height', p.h);
      $('#lb-cap').textContent = p.nombre + ' · Promoción publicada en nuestras redes. Las vigencias cambian: pregunta por la promo actual.';
      var ask = $('#lb-ask');
      if (ask && waBase) ask.href = waUrl('Hola Noé, vi la promo de ' + p.nombre + ' en la página y quiero saber si sigue vigente.');
      var add = $('#lb-add');
      if (add) add.hidden = !productos[p.id];
    }
    if (lb) {
      $$('.flyer').forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-flyer');
          var i = promos.findIndex(function (p) { return p.id === id; });
          mostrarPromo(i < 0 ? 0 : i);
          document.body.classList.add('no-scroll');
          if (typeof lb.showModal === 'function') lb.showModal();
          else lb.setAttribute('open', '');
        });
      });
      lb.addEventListener('close', function () { document.body.classList.remove('no-scroll'); });
      lb.addEventListener('click', function (e) { if (e.target === lb) cerrarDialogo(lb); });
      $$('[data-close]', lb).forEach(function (b) { b.addEventListener('click', function () { cerrarDialogo(lb); }); });
      $('#lb-prev').addEventListener('click', function () { mostrarPromo(indice - 1); });
      $('#lb-next').addEventListener('click', function () { mostrarPromo(indice + 1); });
      $('#lb-add').addEventListener('click', function () {
        var p = promos[indice];
        if (p && productos[p.id]) {
          agregar(p.id, 1, $('#lb-add'));
          cerrarDialogo(lb);
        }
      });
      lb.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft') mostrarPromo(indice - 1);
        if (e.key === 'ArrowRight') mostrarPromo(indice + 1);
      });
    }

    cargarPedido();
    pintarCarrito();
  }

  /* ───────── Cómo pedir: teléfono animado en bucle ───────── */
  function telefono() {
    var ph = $('#phone');
    if (!ph) return;
    var pantallas = $$('.ph-screen', ph);
    var pasos = $$('.step');
    var i = 0;
    var timer = 0;
    var visible = false;

    function ir(n) {
      i = n;
      pantallas.forEach(function (s, k) { s.classList.toggle('on', k === n); });
      pasos.forEach(function (s, k) { s.classList.toggle('is-on', k === n); });
    }
    function arrancar() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { if (visible && !document.hidden) ir((i + 1) % pantallas.length); }, 4200);
    }
    pasos.forEach(function (s, k) {
      s.addEventListener('click', function () { ir(k); arrancar(); });
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.25 }).observe(ph);
    } else {
      visible = true;
    }
    ir(0);
    arrancar();
  }

  /* ───────── Formulario de contacto → WhatsApp ───────── */
  function formulario() {
    var f = $('#form-contacto');
    if (!f) return;
    var err = $('#form-error');
    function fallo(msg, campo) {
      if (err) { err.textContent = msg; err.hidden = false; }
      if (campo) campo.focus();
    }
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var nombre = f.elements.nombre.value.trim();
      var especie = f.elements.especie.value;
      var mensaje = f.elements.mensaje.value.trim();
      if (err) err.hidden = true;
      if (nombre.length < 2) { fallo('Dinos tu nombre para saludarte.', f.elements.nombre); return; }
      if (mensaje.length < 5) { fallo('Cuéntanos un poco qué necesitas.', f.elements.mensaje); return; }
      if (!waBase) { fallo('Por ahora escríbenos por Facebook; el chat de WhatsApp no está disponible.', null); return; }
      var txt = 'Hola Noé 👋 Soy ' + nombre + '. Te escribo desde la página de NOE.vet.\nPara: ' + especie + '\nNecesito: ' + mensaje;
      var w = window.open(waUrl(txt), '_blank');
      if (w) {
        try { w.opener = null; } catch (err2) { /* navegador sin acceso al opener */ }
      } else {
        // Si el navegador bloquea la ventana emergente, se abre en la misma pestaña
        window.location.href = waUrl(txt);
      }
    });
  }

  /* ───────── Año del pie ───────── */
  function anio() {
    var a = $('#anio');
    if (a) a.textContent = String(new Date().getFullYear());
  }

  /* ───────── Arranque ───────── */
  safe(imagenes);
  safe(hidratarWhatsApp);
  safe(cargador);
  safe(cabecera);
  safe(tienda);
  safe(telefono);
  safe(formulario);
  safe(anio);
  var ws = [];
  safe(function () { ws = palabras(); });
  safe(reveals);
  safe(magneticos);
  safe(function () { motor(ws); });
})();
