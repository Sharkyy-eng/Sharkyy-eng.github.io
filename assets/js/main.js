// ── 1. Scroll fade-up ──────────────────────────────────────
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

// ── 2. Nav shadow on scroll ────────────────────────────────
window.addEventListener('scroll', () => {
  document.querySelector('nav').classList.toggle('scrolled', window.scrollY > 10);
});

// ── 3. Project filter ───────────────────────────────────────
// (handled together with the show-more collapse in Section 9,
// since both control the same .proj-card display state)

// ── 4. Canvas particle network ────────────────────────────
(function initParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COUNT = window.innerWidth < 600 ? 28 : 55;
  const MAX_DIST = 130;

  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
    r: Math.random() * 1.4 + 0.8
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      if (!document.hidden) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MAX_DIST) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(255,255,255,${0.1 * (1 - dist / MAX_DIST)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  draw();
})();

// ── 5. Typewriter effect ──────────────────────────────────
(function initTypewriter() {
  const el = document.getElementById('typewriter');
  if (!el) return;

  const phrases = [
    'Mechatronics & AI Systems Engineer',
    'Robotics Builder',
    'UAV Systems Designer',
    'Computer Vision Developer',
    'Hardware Prototyper'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;
  const TYPING_MS  = 65;
  const DELETE_MS  = 32;
  const PAUSE_MS   = 1800;

  function tick() {
    const current = phrases[phraseIndex];
    if (!deleting) {
      charIndex++;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === current.length) {
        deleting = true;
        setTimeout(tick, PAUSE_MS);
        return;
      }
    } else {
      charIndex--;
      el.textContent = current.slice(0, charIndex);
      if (charIndex === 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
      }
    }
    setTimeout(tick, deleting ? DELETE_MS : TYPING_MS);
  }

  tick();
})();

// ── 6. Scroll cue — hide after scrolling past hero ────────
const scrollCue = document.querySelector('.scroll-cue');
if (scrollCue) {
  window.addEventListener('scroll', () => {
    scrollCue.classList.toggle('hidden', window.scrollY > 60);
  }, { passive: true });
}

// ── 7. Staggered entrance animations ────────────────────
const staggerObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    Array.from(entry.target.children).forEach((child, i) => {
      setTimeout(() => child.classList.add('visible'), i * 65);
    });
    staggerObserver.unobserve(entry.target);
  });
}, { threshold: 0.05 });

document.querySelectorAll('[data-stagger]').forEach(el => staggerObserver.observe(el));

// ── 8. Scroll-spy active nav highlighting ─────────────────
(function initScrollSpy() {
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  if (!sections.length || !navLinks.length) return;

  const spyObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector(`.nav-link[data-section="${id}"]`);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });

  sections.forEach(sec => spyObserver.observe(sec));
})();

// ── 9. Project grid — fetch from data/projects.json, render, animate ──
// Also owns the category filter buttons and the show-more collapse,
// since both need to agree on which .proj-card elements are visible.
(function initProjects() {
  const grid = document.getElementById('proj-grid');
  if (!grid) return;

  const COLLAPSE_LIMIT = 3;
  const toggleBtn = document.getElementById('proj-toggle');
  let activeFilter = 'all';
  let expanded = false;
  let projectsById = new Map();

  fetch('data/projects.json')
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load projects.json (${res.status})`);
      return res.json();
    })
    .then(projects => {
      projectsById = new Map(projects.map(p => [p.id, p]));
      grid.removeAttribute('data-loading');
      grid.innerHTML = projects.map(renderProjectCard).join('');
      initProjectCardObserver(grid);
      initProjectModal(grid, projectsById);
      applyVisibility();
    })
    .catch(err => {
      grid.innerHTML = `<p class="proj-loading">Couldn't load projects right now.</p>`;
      console.error(err);
    });

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      expanded = false;
      applyVisibility();
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      expanded = !expanded;
      applyVisibility();
      if (!expanded) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function applyVisibility() {
    const cards = Array.from(grid.querySelectorAll('.proj-card'));
    const matches = card => activeFilter === 'all' || card.dataset.category.includes(activeFilter);
    const totalMatches = cards.filter(matches).length;

    let seen = 0;
    cards.forEach(card => {
      if (!matches(card)) { card.style.display = 'none'; return; }
      seen++;
      card.style.display = (expanded || seen <= COLLAPSE_LIMIT) ? '' : 'none';
    });

    if (!toggleBtn) return;
    if (totalMatches <= COLLAPSE_LIMIT) {
      toggleBtn.style.display = 'none';
    } else {
      toggleBtn.style.display = '';
      toggleBtn.textContent = expanded ? 'Show Less ↑' : `Show More (${totalMatches - COLLAPSE_LIMIT}) ↓`;
    }
  }

  function renderProjectCard(p) {
    const statusBadge = p.status === 'in-progress'
      ? `<span class="proj-status-badge">In Progress</span>`
      : '';
    const tags = (p.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join('');
    const link = p.github
      ? `<a href="${p.github}" class="proj-link" target="_blank" rel="noopener">View on GitHub →</a>`
      : '';
    return `
      <div class="proj-card" data-category="${(p.category || []).join(' ')}" data-id="${p.id}" role="button" tabindex="0" aria-haspopup="dialog">
        <div class="proj-header">
          <div class="proj-title-row">
            <h3 class="proj-title">${p.title}</h3>
            ${statusBadge}
          </div>
          <span class="proj-tech">${(p.tech || []).join(' · ')}</span>
        </div>
        <p class="proj-desc">${p.description}</p>
        <div class="proj-tags">${tags}</div>
        ${link}
      </div>
    `;
  }

  function initProjectCardObserver(container) {
    const cards = container.querySelectorAll('.proj-card');
    const cardObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const i = Array.from(cards).indexOf(entry.target);
        setTimeout(() => entry.target.classList.add('visible'), i * 60);
        cardObserver.unobserve(entry.target);
      });
    }, { threshold: 0.1 });
    cards.forEach(card => cardObserver.observe(card));
  }

  // ── Project detail modal ──
  // Clicking (or Enter/Space-ing) a card opens a bigger view of that
  // project so visitors browsing the grid always have something to dig
  // into, even projects without a full case-study page.
  function initProjectModal(container, byId) {
    const overlay = document.getElementById('proj-modal-overlay');
    const body = document.getElementById('proj-modal-body');
    const closeBtn = document.getElementById('proj-modal-close');
    if (!overlay || !body || !closeBtn) return;

    let lastFocused = null;

    function formatDate(iso) {
      if (!iso) return null;
      const [y, m] = iso.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    function formatRange(p) {
      const start = formatDate(p.startDate);
      const end = p.status === 'in-progress' ? 'Present' : formatDate(p.endDate);
      if (start && end) return `${start} – ${end}`;
      if (start) return start;
      return null;
    }

    function open(project) {
      const statusBadge = project.status === 'in-progress'
        ? `<span class="proj-status-badge">In Progress</span>`
        : '';
      const range = formatRange(project);
      const tech = (project.tech || []).map(t => `<span class="proj-tag">${t}</span>`).join('');
      const links = [
        project.blogUrl ? `<a href="${project.blogUrl}" class="btn btn-primary proj-modal-btn">Read the full case study →</a>` : '',
        project.github ? `<a href="${project.github}" target="_blank" rel="noopener" class="btn btn-outline proj-modal-btn">View on GitHub →</a>` : '',
      ].filter(Boolean).join('');

      const image = project.image
        ? `<img class="proj-modal-img" src="${project.image}" alt="${project.title}" loading="lazy">`
        : '';

      body.innerHTML = `
        ${image}
        <div class="proj-modal-title-row">
          <h3 id="proj-modal-title" class="proj-modal-title">${project.title}</h3>
          ${statusBadge}
        </div>
        ${range ? `<div class="proj-modal-date">${range}</div>` : ''}
        <p class="proj-modal-desc">${project.description}</p>
        <div class="proj-modal-tech">${tech}</div>
        ${links ? `<div class="proj-modal-actions">${links}</div>` : ''}
      `;

      lastFocused = document.activeElement;
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      overlay.hidden = true;
      document.body.style.overflow = '';
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    container.addEventListener('click', (e) => {
      if (e.target.closest('.proj-link')) return; // let GitHub links behave normally
      const card = e.target.closest('.proj-card');
      if (!card) return;
      const project = byId.get(card.dataset.id);
      if (project) open(project);
    });

    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (e.target.closest('.proj-link')) return; // let GitHub links behave normally
      const card = e.target.closest('.proj-card');
      if (!card) return;
      e.preventDefault();
      const project = byId.get(card.dataset.id);
      if (project) open(project);
    });

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !overlay.hidden) close();
    });
  }
})();

// ── 10. Blog post like buttons — persistent count via Abacus ──
// Uses abacus.jasoncameron.dev (free, CORS-enabled, no signup — a
// maintained CountAPI replacement) to keep a global count per post.
// Abacus only supports anonymous increments (no public decrement), so
// once a visitor likes a post the heart stays filled; clicking again
// is a local no-op rather than pretending to "unlike" globally.
// Falls back to a local-only count if the API is unreachable, so the
// button never looks broken.
(function initLikeButtons() {
  const buttons = document.querySelectorAll('.like-btn');
  if (!buttons.length) return;

  const NAMESPACE = 'jupee.mebot.in';
  const API = 'https://abacus.jasoncameron.dev';
  const STORAGE_KEY = 'likedPosts';

  function getLikedSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY)) || []);
    } catch {
      return new Set();
    }
  }

  function saveLikedSet(set) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
    } catch { /* localStorage unavailable — liked state just won't persist */ }
  }

  function setButtonState(btn, count, liked) {
    btn.querySelector('.like-btn-count').textContent = count === null ? '–' : count;
    btn.querySelector('.like-btn-icon').textContent = liked ? '♥' : '♡';
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
  }

  buttons.forEach(async (btn) => {
    const postId = btn.dataset.postId;
    const liked = getLikedSet().has(postId);
    setButtonState(btn, null, liked);

    // Load current count (doesn't increment).
    try {
      const res = await fetch(`${API}/get/${NAMESPACE}/${postId}`);
      const data = await res.json();
      setButtonState(btn, typeof data.value === 'number' ? data.value : 0, liked);
    } catch {
      setButtonState(btn, liked ? 1 : 0, liked); // offline fallback
    }

    btn.addEventListener('click', async () => {
      const likedSet = getLikedSet();
      if (likedSet.has(postId)) return; // already liked — no anonymous "unlike" on Abacus

      btn.disabled = true;
      try {
        const res = await fetch(`${API}/hit/${NAMESPACE}/${postId}`);
        const data = await res.json();
        likedSet.add(postId);
        saveLikedSet(likedSet);
        setButtonState(btn, typeof data.value === 'number' ? data.value : 0, true);
      } catch {
        // Offline fallback: just toggle locally so the button still responds.
        const current = parseInt(btn.querySelector('.like-btn-count').textContent, 10) || 0;
        likedSet.add(postId);
        saveLikedSet(likedSet);
        setButtonState(btn, current + 1, true);
      } finally {
        btn.disabled = false;
      }
    });
  });
})();

// ── 11. Site visit counter — eye icon in the footer ──
// Uses the same Abacus service as the like buttons. Increments once per
// browser session (sessionStorage guard) so reloads and repeat page
// views in the same visit don't inflate the count.
(function initVisitCounter() {
  const countEl = document.getElementById('visit-count');
  if (!countEl) return;

  const NAMESPACE = 'jupee.mebot.in';
  const KEY = 'site-visits';
  const API = 'https://abacus.jasoncameron.dev';
  const SESSION_KEY = 'visitCounted';

  let alreadyCounted = false;
  try { alreadyCounted = sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* ignore */ }

  const endpoint = alreadyCounted
    ? `${API}/get/${NAMESPACE}/${KEY}`
    : `${API}/hit/${NAMESPACE}/${KEY}`;

  fetch(endpoint)
    .then(res => res.json())
    .then(data => {
      if (typeof data.value === 'number') countEl.textContent = data.value.toLocaleString();
      if (!alreadyCounted) {
        try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      }
    })
    .catch(() => { countEl.textContent = '–'; });
})();

// ── 12. Connect card — send-a-message form via Web3Forms ──
// Web3Forms maps an access key to a destination inbox server-side,
// so no email address ever needs to sit in the page source.
(function initConnectForm() {
  const form = document.getElementById('connect-form');
  const note = document.getElementById('connect-form-note');
  if (!form || !note) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.access_key.value === 'YOUR_WEB3FORMS_ACCESS_KEY') {
      note.textContent = 'Form isn\'t connected yet — add a Web3Forms access key.';
      note.className = 'connect-form-note error';
      return;
    }

    const submitBtn = form.querySelector('.connect-submit');
    submitBtn.disabled = true;
    note.textContent = '';
    note.className = 'connect-form-note';

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form),
      });
      const result = await res.json();

      if (result.success) {
        note.textContent = 'Message sent, thanks! I\'ll get back to you soon.';
        note.className = 'connect-form-note success';
        form.reset();
      } else {
        note.textContent = 'Something went wrong. Try again in a bit.';
        note.className = 'connect-form-note error';
      }
    } catch {
      note.textContent = 'Network error. Try again in a bit.';
      note.className = 'connect-form-note error';
    } finally {
      submitBtn.disabled = false;
    }
  });
})();
