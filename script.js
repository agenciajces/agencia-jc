/* ===========================================================
   Agencia JC — interacciones
   =========================================================== */

(function () {
  'use strict';

  var PHONE = '34666225457';
  var EMAIL = 'contacto@agenciajc.es';

  /* ---------- Nav pegajosa + WhatsApp flotante ---------- */
  var nav = document.getElementById('nav');
  var wa = document.querySelector('.wa');

  // El scroll dispara decenas de eventos por segundo. Lo agrupamos en un
  // rAF y solo tocamos el DOM cuando el estado cambia de verdad: escribir
  // clases en cada evento forzaba un recalculo de estilos continuo.
  var ticking = false;
  var stuck = null;
  var waShown = null;

  function apply() {
    ticking = false;
    var y = window.scrollY;

    var nowStuck = y > 30;
    if (nowStuck !== stuck) {
      stuck = nowStuck;
      nav.classList.toggle('is-stuck', nowStuck);
    }

    var nowWa = y > 420;
    if (nowWa !== waShown) {
      waShown = nowWa;
      wa.classList.toggle('is-visible', nowWa);
    }
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(apply);
  }, { passive: true });

  apply();

  /* ---------- Modo claro / oscuro ----------
     El tema inicial ya lo aplica el script en línea del <head>, para que no
     haya fogonazo blanco al cargar en oscuro. Aquí solo va el interruptor. */
  var themeBtn = document.getElementById('themeBtn');
  var themeMeta = document.querySelector('meta[name="theme-color"]');

  function paintMeta() {
    if (themeMeta) {
      themeMeta.content = document.documentElement.dataset.theme === 'dark' ? '#0e1018' : '#ffffff';
    }
  }
  paintMeta();

  themeBtn.addEventListener('click', function () {
    var dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    paintMeta();
    try { localStorage.setItem('ajc.theme', dark ? 'dark' : 'light'); } catch (e) { }
  });

  // Si el visitante no ha elegido tema, seguimos al sistema si lo cambia.
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      var chosen = null;
      try { chosen = localStorage.getItem('ajc.theme'); } catch (err) { }
      if (chosen) return;
      document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
      paintMeta();
    });
  }

  /* ---------- Menú móvil ---------- */
  var burger = document.getElementById('navBurger');
  var links = document.getElementById('navLinks');

  burger.addEventListener('click', function () {
    var open = links.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });

  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ---------- Animación al entrar en pantalla ---------- */
  var items = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry, i) {
        if (!entry.isIntersecting) return;
        setTimeout(function () { entry.target.classList.add('is-in'); }, i * 70);
        io.unobserve(entry.target);
      });
    }, { threshold: .1, rootMargin: '0px 0px -50px 0px' });

    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Botones de plan -> preseleccionan en el formulario ---------- */
  var planSelect = document.getElementById('f-plan');

  document.querySelectorAll('[data-plan]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var wanted = btn.getAttribute('data-plan');
      for (var i = 0; i < planSelect.options.length; i++) {
        if (planSelect.options[i].text === wanted) {
          planSelect.selectedIndex = i;
          break;
        }
      }
    });
  });

  /* ---------- Formulario -> WhatsApp o email ----------
     La web es estática (GitHub Pages), así que no hay servidor que reciba
     el formulario: componemos el mensaje y lo abrimos en WhatsApp o en el
     cliente de correo del visitante. */
  var form = document.getElementById('form');

  function getField(id) { return document.getElementById(id); }

  function validate() {
    var ok = true;
    ['f-nombre', 'f-negocio'].forEach(function (id) {
      var el = getField(id);
      var empty = !el.value.trim();
      el.classList.toggle('is-error', empty);
      if (empty && ok) { el.focus(); ok = false; }
    });
    return ok;
  }

  function buildMessage() {
    var lines = [
      'Hola, me interesa una web para mi negocio.',
      '',
      'Nombre: ' + getField('f-nombre').value.trim(),
      'Negocio: ' + getField('f-negocio').value.trim()
    ];

    var tipo = getField('f-tipo').value.trim();
    if (tipo) lines.push('Sector: ' + tipo);

    lines.push('Plan: ' + planSelect.value);

    var msg = getField('f-mensaje').value.trim();
    if (msg) { lines.push('', msg); }

    return lines.join('\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate()) return;
    window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(buildMessage()), '_blank');
  });

  document.getElementById('byMail').addEventListener('click', function () {
    if (!validate()) return;
    var subject = 'Presupuesto web · ' + getField('f-negocio').value.trim();
    window.location.href = 'mailto:' + EMAIL +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(buildMessage());
  });

  // Quitar el marcado de error al escribir
  form.querySelectorAll('input, textarea').forEach(function (el) {
    el.addEventListener('input', function () { el.classList.remove('is-error'); });
  });

  /* ---------- Trabajos ----------
     Se leen de trabajos.json, que genera scripts/sync-trabajos.ps1 a partir
     de data/leads.json. Si un lead tiene Pages activo enlazamos la web; si
     no, el repositorio. */
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pintarTrabajos(lista) {
    var grid = document.getElementById('workGrid');
    var seccion = document.getElementById('trabajos');
    if (!grid) return;

    if (!lista || !lista.length) {
      // Sin trabajos que enseñar, mejor ocultar la sección que dejarla vacía.
      if (seccion) seccion.hidden = true;
      return;
    }

    grid.innerHTML = lista.map(function (t) {
      var esRepo = t.tipo === 'repo';
      return '<a class="wcard reveal' + (esRepo ? ' wcard--repo' : '') + '"' +
        ' href="' + esc(t.url) + '" target="_blank" rel="noopener">' +
        '<h3>' + esc(t.nombre) + '</h3>' +
        (t.sector ? '<p>' + esc(t.sector) + '</p>' : '<p></p>') +
        '<span class="wcard__go">' + (esRepo ? 'Ver el código' : 'Ver la web') + ARROW + '</span>' +
        '</a>';
    }).join('');

    // Las tarjetas nacen después del observer inicial, hay que observarlas.
    grid.querySelectorAll('.reveal').forEach(function (el) {
      if (io) { io.observe(el); } else { el.classList.add('is-in'); }
    });
  }

  fetch('trabajos.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) { pintarTrabajos(data && data.trabajos); })
    .catch(function () { pintarTrabajos(null); });

  /* ---------- Año del footer ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
