/* ===========================================================
   Agencia JC — interacciones
   =========================================================== */

(function () {
  'use strict';

  var PHONE = '34666225457';
  var EMAIL = 'hola@jagcweb.es';

  /* ---------- Nav pegajosa + WhatsApp flotante ---------- */
  var nav = document.getElementById('nav');
  var wa = document.querySelector('.wa');

  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-stuck', y > 30);
    wa.classList.toggle('is-visible', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

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

  /* ---------- Año del footer ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
