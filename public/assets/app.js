/* d'Skills shared site behavior */
(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;
  if (reduce) document.documentElement.classList.add('reduce');

  /* ---------- Smooth scroll (Lenis, desktop only) ---------- */
  if (!reduce && !touch && window.Lenis) {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    if (window.ScrollTrigger) { lenis.on('scroll', ScrollTrigger.update); }
  }

  /* ---------- Scroll reveals + page-specific animation ---------- */
  function reveals() {
    var els = document.querySelectorAll('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function onView(sel, cb) {
    var el = document.querySelector(sel); if (!el) return;
    if (reduce || !('IntersectionObserver' in window)) { cb(el); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { cb(el); io.unobserve(en.target); } });
    }, { threshold: 0.3 });
    io.observe(el);
  }
  // build-line draw in the steps strip
  onView('.steps .buildline', function (el) { el.style.transition = 'width 1.3s cubic-bezier(.22,.61,.36,1)'; requestAnimationFrame(function(){ el.style.width = '100%'; }); });
  // counters count up
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')); var suffix = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1200, t0 = performance.now();
    function step(now) { var p = Math.min(1, (now - t0) / dur); el.textContent = Math.round(target * (p * (2 - p))) + suffix; if (p < 1) requestAnimationFrame(step); }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('.num[data-count]').forEach(function (el) {
    if (reduce || !('IntersectionObserver' in window)) { countUp(el); return; }
    var io = new IntersectionObserver(function (e) { e.forEach(function (x) { if (x.isIntersecting) { countUp(el); io.unobserve(el); } }); }, { threshold: 0.6 });
    io.observe(el);
  });
  // about timeline fill
  onView('.timeline', function (el) { var f = el.querySelector('.tl-fill'); if (f) { f.style.transition = 'height 1.6s cubic-bezier(.22,.61,.36,1)'; requestAnimationFrame(function(){ f.style.height = '100%'; }); } });
  // membership includes self-check
  onView('.includes', function (el) {
    var items = el.querySelectorAll('li');
    items.forEach(function (li, i) { setTimeout(function () { li.classList.add('on'); }, reduce ? 0 : i * 160); });
  });

  /* ---------- Mobile nav ---------- */
  var mm = document.getElementById('mobile-menu');
  var openMenu = document.getElementById('open-menu');
  if (openMenu && mm) {
    openMenu.addEventListener('click', function () { mm.classList.add('open'); });
    mm.addEventListener('click', function (e) { if (e.target.tagName === 'A' || e.target.classList.contains('close')) mm.classList.remove('open'); });
  }

  /* ---------- Active nav ---------- */
  var path = location.pathname.replace(/index\.html$/, '');
  document.querySelectorAll('[data-nav]').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.indexOf(href) === 0)) a.classList.add('active');
    else if (href === '/' && (path === '/' || path === '')) a.classList.add('active');
  });

  /* ---------- Toast ---------- */
  var toastEl = document.getElementById('toast');
  var toastT;
  function toast(msg) { if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 2200); }

  /* ---------- Cover mini (for cart + console) ---------- */
  function miniCover(item) {
    var c = item.accent === 'violet' ? '#8A7CFF' : '#5CE0B8';
    return '<svg viewBox="0 0 52 52"><rect width="52" height="52" fill="#0A0E14"/>' +
      '<path d="M6 6H46V46H6Z" fill="none" stroke="#1c2530"/>' +
      '<circle cx="26" cy="26" r="7" fill="none" stroke="' + c + '" stroke-width="2"/>' +
      '<circle cx="26" cy="26" r="2" fill="' + c + '"/></svg>';
  }

  /* ---------- Cart ---------- */
  var KEY = 'dskills_cart_v1';
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  var cart = load();

  function count() { return cart.length; }
  function total() { return cart.reduce(function (s, i) { return s + i.price; }, 0); }
  function money(n) { return '$' + n.toLocaleString(); }

  function catalogById(id) { return (window.DSKILLS_CATALOG || []).filter(function (x) { return x.id === id; })[0]; }

  function addToCart(id) {
    var item = catalogById(id); if (!item) return;
    if (item.type === 'membership') { cart = cart.filter(function (x) { return x.type !== 'membership'; }); } // one membership only
    if ((item.type === 'course' || item.type === 'bundle' || item.type === 'kit') && cart.some(function (x) { return x.id === id; })) { toast('Already in your cart'); openCart(); return; }
    cart.push({ id: item.id, name: item.name, type: item.type, price: item.price, priceLabel: item.priceLabel, accent: item.accent });
    save(cart); renderCart(); updateCount(); openCart(); toast('Added: ' + item.name);
  }
  window.dsAdd = addToCart;

  function removeAt(idx) { cart.splice(idx, 1); save(cart); renderCart(); updateCount(); }

  function updateCount() { document.querySelectorAll('.cart-count').forEach(function (e) { e.textContent = count(); e.style.display = count() ? 'inline-flex' : 'none'; }); }

  var drawer = document.getElementById('cart-drawer');
  var overlay = document.getElementById('cart-overlay');
  function openCart() { if (drawer) { drawer.classList.add('open'); overlay.classList.add('open'); } }
  function closeCart() { if (drawer) { drawer.classList.remove('open'); overlay.classList.remove('open'); } }
  window.dsOpenCart = openCart;

  function renderCart() {
    var box = document.getElementById('cart-items'); if (!box) return;
    if (!cart.length) { box.innerHTML = '<div class="cart-empty">Nothing in the cart yet. Every build starts with picking one project. Browse the courses and add your first.</div>'; }
    else {
      box.innerHTML = cart.map(function (it, i) {
        return '<div class="cart-item"><div class="thumb">' + miniCover(it) + '</div><div><div class="ci-name">' + it.name + '</div><div class="ci-meta">' + it.priceLabel + '</div></div><button class="rm" data-rm="' + i + '" aria-label="Remove">&times;</button></div>';
      }).join('');
    }
    var t = document.getElementById('cart-total-amt'); if (t) t.textContent = money(total());
    var co = document.getElementById('cart-checkout'); if (co) co.style.display = cart.length ? 'inline-flex' : 'none';
    box.querySelectorAll('[data-rm]').forEach(function (b) { b.addEventListener('click', function () { removeAt(parseInt(b.getAttribute('data-rm'), 10)); }); });
  }

  document.querySelectorAll('[data-open-cart]').forEach(function (b) { b.addEventListener('click', openCart); });
  var cc = document.getElementById('cart-close'); if (cc) cc.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', closeCart);

  // buy buttons anywhere
  document.querySelectorAll('[data-buy]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); addToCart(b.getAttribute('data-buy')); }); });

  renderCart(); updateCount();

  /* ---------- Cart / checkout pages ---------- */
  var cartPage = document.getElementById('cart-page-items');
  if (cartPage) {
    function renderCartPage() {
      if (!cart.length) { cartPage.innerHTML = '<div class="cart-empty">Nothing in the cart yet. Every build starts with picking one project. <a href="/courses/">Browse the courses</a> and add your first.</div>'; }
      else {
        cartPage.innerHTML = cart.map(function (it, i) {
          return '<div class="cart-item"><div class="thumb">' + miniCover(it) + '</div><div><div class="ci-name">' + it.name + '</div><div class="ci-meta">' + it.priceLabel + '</div></div><button class="rm" data-rmp="' + i + '">&times;</button></div>';
        }).join('');
      }
      var t = document.getElementById('cartpage-total'); if (t) t.textContent = money(total());
      cartPage.querySelectorAll('[data-rmp]').forEach(function (b) { b.addEventListener('click', function () { removeAt(parseInt(b.getAttribute('data-rmp'), 10)); renderCartPage(); }); });
    }
    renderCartPage();
  }

  var checkoutForm = document.getElementById('checkout-form');
  if (checkoutForm) {
    var sum = document.getElementById('checkout-summary');
    if (sum) {
      sum.innerHTML = (cart.length ? cart.map(function (it) { return '<div class="cart-total"><span>' + it.name + '</span><span>' + it.priceLabel + '</span></div>'; }).join('') : '<p class="cart-empty">Your cart is empty. <a href="/courses/">Browse courses</a>.</p>') +
        (cart.length ? '<div class="cart-total" style="border-top:1px solid var(--hair);padding-top:12px;margin-top:8px"><span>Total</span><span class="amt">' + money(total()) + '</span></div>' : '');
    }
    checkoutForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['co-name', 'co-email'].forEach(function (id) { var f = document.getElementById(id); if (!f.value.trim()) { ok = false; mark(f, false); } else mark(f, true); });
      var em = document.getElementById('co-email'); if (em.value && !/^[^@]+@[^@]+\.[^@]+$/.test(em.value)) { ok = false; mark(em, false); }
      var consent = document.getElementById('co-consent');
      var cm = document.getElementById('co-consent-msg');
      if (!consent.checked) { ok = false; if (cm) { cm.textContent = 'Please confirm you are 18 or older and agree to the Terms and Privacy Policy.'; cm.className = 'form-msg err'; } }
      else if (cm) cm.textContent = '';
      if (!cart.length) { ok = false; toast('Your cart is empty'); }
      if (!ok) return;
      try { localStorage.setItem('dskills_last_order', JSON.stringify({ items: cart, total: total() })); } catch (e2) {}
      cart = []; save(cart);
      location.href = '/order-confirmed/';
    });
  }

  var orderBox = document.getElementById('order-summary');
  if (orderBox) {
    var last = {}; try { last = JSON.parse(localStorage.getItem('dskills_last_order')) || {}; } catch (e) {}
    if (last.items && last.items.length) {
      orderBox.innerHTML = last.items.map(function (it) { return '<div class="cart-total"><span>' + it.name + '</span><span>' + it.priceLabel + '</span></div>'; }).join('') +
        '<div class="cart-total" style="border-top:1px solid var(--hair);padding-top:12px;margin-top:8px"><span>Total</span><span class="amt">$' + (last.total || 0).toLocaleString() + '</span></div>';
    } else { orderBox.innerHTML = '<p class="cart-empty">Your library is ready. <a href="/courses/">Browse more courses</a>.</p>'; }
    updateCount();
  }

  function mark(field, ok) { field.style.borderColor = ok ? 'var(--hair)' : 'var(--error)'; }

  /* ---------- SMS opt-in + contact validation ---------- */
  document.querySelectorAll('form[data-sms]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = form.querySelector('input[type=tel]');
      var c1 = form.querySelector('.sms-c1'); var c2 = form.querySelector('.sms-c2');
      var msg = form.querySelector('.form-msg');
      var digits = (phone.value || '').replace(/\D/g, '');
      if (digits.length < 10) { msg.textContent = 'Enter a valid phone number.'; msg.className = 'form-msg err'; return; }
      if (!c1.checked || !c2.checked) { msg.textContent = 'Please check both boxes to opt in.'; msg.className = 'form-msg err'; return; }
      msg.textContent = "You're on the list. Reply Y to confirm when we text you."; msg.className = 'form-msg ok';
      form.reset();
    });
  });
  var contact = document.getElementById('contact-form');
  if (contact) {
    contact.addEventListener('submit', function (e) {
      e.preventDefault(); var ok = true;
      ['ct-name', 'ct-email', 'ct-msg'].forEach(function (id) { var f = document.getElementById(id); if (!f.value.trim()) { ok = false; mark(f, false); } else mark(f, true); });
      var em = document.getElementById('ct-email'); if (em.value && !/^[^@]+@[^@]+\.[^@]+$/.test(em.value)) { ok = false; mark(em, false); }
      var m = document.getElementById('ct-msg-out');
      if (ok) { m.textContent = 'Got it. We will reply to your email.'; m.className = 'form-msg ok'; contact.reset(); }
      else { m.textContent = 'Please fill in the required fields.'; m.className = 'form-msg err'; }
    });
  }

  /* ---------- Console (Cmd+K command palette) ---------- */
  var modal = document.getElementById('console-modal');
  var input = document.getElementById('console-input');
  var results = document.getElementById('console-results');
  if (modal && input && results) {
    var catalog = window.DSKILLS_CATALOG || [];
    var actions = [
      { name: 'Browse all courses', kind: 'go', to: '/courses/' },
      { name: 'Browse Beginner courses', kind: 'go', to: '/courses/#beginner' },
      { name: 'Start membership', kind: 'go', to: '/membership/' },
      { name: 'Build your path', kind: 'go', to: '/build-your-path/' },
      { name: 'Read the story (About)', kind: 'go', to: '/about/' },
      { name: 'Read the blog', kind: 'go', to: '/blog/' },
      { name: 'Contact d\'Skills', kind: 'go', to: '/contact/' }
    ];
    var items = catalog.map(function (c) {
      return { name: c.name, kind: (c.type === 'membership' ? 'go' : 'buy'), to: c.slug, id: c.id, price: c.priceLabel, tag: c.type, level: c.level, num: c.price };
    }).concat(actions.map(function (a) { return { name: a.name, kind: 'go', to: a.to, tag: 'action' }; }));
    var fuse = window.Fuse ? new Fuse(items, { keys: ['name', 'tag', 'level'], threshold: 0.42 }) : null;
    var sel = 0, view = items;

    function underCmd(q) {
      // support "under $100" style queries
      var m = q.match(/under\s*\$?\s*(\d+)/i);
      if (m) { var cap = parseInt(m[1], 10); return items.filter(function (it) { return it.num && it.num <= cap; }); }
      return null;
    }
    function draw() {
      results.innerHTML = view.slice(0, 40).map(function (it, i) {
        return '<div class="cres" role="option" aria-selected="' + (i === sel) + '" data-i="' + i + '"><span class="t"><span class="k">' + (it.tag || it.kind) + '</span>' + it.name + '</span>' + (it.price ? '<span class="price">' + it.price + '</span>' : '<span class="price">&rarr;</span>') + '</div>';
      }).join('') || '<div class="cart-empty">No matches. Try a course name or a price.</div>';
      results.querySelectorAll('.cres').forEach(function (r) {
        r.addEventListener('click', function () { exec(view[parseInt(r.getAttribute('data-i'), 10)]); });
        r.addEventListener('mousemove', function () { sel = parseInt(r.getAttribute('data-i'), 10); highlight(); });
      });
    }
    function highlight() { results.querySelectorAll('.cres').forEach(function (r, i) { r.setAttribute('aria-selected', i === sel); if (i === sel) r.scrollIntoView({ block: 'nearest' }); }); }
    function exec(it) { if (!it) return; if (it.kind === 'buy') { closeC(); addToCart(it.id); } else { location.href = it.to; } }
    function search(q) { sel = 0; var u = underCmd(q); view = q ? (u || (fuse ? fuse.search(q).map(function (r) { return r.item; }) : items)) : items; draw(); }
    function openC(prefill) { modal.classList.add('open'); input.value = prefill || ''; search(input.value); setTimeout(function () { input.focus(); }, 20); document.addEventListener('keydown', navKeys); }
    function closeC() { modal.classList.remove('open'); document.removeEventListener('keydown', navKeys); if (lastFocus) lastFocus.focus(); }
    var lastFocus = null;
    function navKeys(e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, view.length - 1); highlight(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); highlight(); }
      else if (e.key === 'Enter') { e.preventDefault(); exec(view[sel]); }
      else if (e.key === 'Escape') { closeC(); }
    }
    input.addEventListener('input', function () { search(input.value); });
    window.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); lastFocus = document.activeElement; openC(); }
    });
    document.querySelectorAll('[data-console]').forEach(function (b) { b.addEventListener('click', function () { lastFocus = document.activeElement; openC(b.getAttribute('data-q') || ''); }); });
    modal.addEventListener('click', function (e) { if (e.target === modal) closeC(); });
    draw();
    window.dsConsole = openC;
  }

  reveals();
})();
