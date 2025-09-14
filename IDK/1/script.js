/* script.js - local JS for animations, parallax, particles, and interactions */
(() => {
  // helper
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // Set year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Smooth scroll for internal links
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(href === '#') return;
      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
      }
    });
  });

  // simple mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  menuToggle && menuToggle.addEventListener('click', () => {
    const nav = document.querySelector('.nav');
    if(!nav) return;
    nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
  });

  // 3D tilt effect for cards (mouse)
  const cards = $$('.card');
  cards.forEach(card => {
    const inner = card.querySelector('.card-inner');
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      inner.style.transform = `rotateX(${(-y * 10).toFixed(2)}deg) rotateY(${(x * 12).toFixed(2)}deg) translateZ(18px)`;
    });
    card.addEventListener('mouseleave', () => {
      inner.style.transform = '';
    });
    // keyboard-friendly: on focus add slight rotation
    card.addEventListener('focus', () => inner.style.transform = 'rotateX(6deg) rotateY(-12deg) translateZ(18px)');
    card.addEventListener('blur', () => inner.style.transform = '');
  });

  // process step flip on hover/focus
  $$('.step').forEach(step => {
    const card = step.querySelector('.step-card');
    step.addEventListener('mouseenter', () => card.style.transform = 'rotateY(12deg) translateY(-8px)');
    step.addEventListener('mouseleave', () => card.style.transform = '');
    step.addEventListener('focus', () => card.style.transform = 'rotateY(12deg) translateY(-8px)');
    step.addEventListener('blur', () => card.style.transform = '');
  });

  // Parallax floating cube - follow mouse subtly
  const floatingCube = document.getElementById('floatingCube');
  if (floatingCube) {
    document.addEventListener('mousemove', (e) => {
      const w = window.innerWidth, h = window.innerHeight;
      const rx = (e.clientY / h - 0.5) * 20;
      const ry = (e.clientX / w - 0.5) * 30;
      floatingCube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  }

  // Intersection Observer to animate in sections
  const obsOptions = {root: null, rootMargin: '0px 0px -80px 0px', threshold: 0.12};
  const observer = new IntersectionObserver((entries) => {
    for(const ent of entries){
      if(ent.isIntersecting){
        ent.target.classList.add('inview');
      } else {
        ent.target.classList.remove('inview');
      }
    }
  }, obsOptions);

  document.querySelectorAll('.section').forEach(s => observer.observe(s));

  /* Particle background — lightweight canvas animation */
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function rand(min, max){ return Math.random() * (max - min) + min; }

  function makeParticles(count = 70) {
    particles = [];
    for(let i=0;i<count;i++){
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: rand(-0.2,0.6),
        vy: rand(-0.2,0.2),
        r: rand(0.6,2.6),
        life: rand(40,200),
        hue: rand(180,200)
      });
    }
  }
  makeParticles(Math.round((canvas.width+canvas.height)/25));

  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // subtle gradient overlay for depth
    const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    g.addColorStop(0, 'rgba(0,32,64,0.56)');
    g.addColorStop(1, 'rgba(0,16,32,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw particles
    for(const p of particles){
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.3;
      if(p.x > canvas.width + 20) p.x = -20;
      if(p.x < -20) p.x = canvas.width + 20;
      if(p.y > canvas.height + 20) p.y = -20;
      if(p.y < -20) p.y = canvas.height + 20;
      if(p.life < 0){ p.life = rand(60,220); p.x = Math.random()*canvas.width; p.y = -10; }

      ctx.beginPath();
      ctx.globalAlpha = 0.75 * Math.min(1, p.r/2);
      // glow
      ctx.fillStyle = `rgba(0,212,255,${0.12 * (p.r/2)})`;
      ctx.shadowBlur = p.r * 8;
      ctx.shadowColor = 'rgba(0,212,255,0.9)';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.closePath();
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    requestAnimationFrame(draw);
  }
  draw();

  // Accessibility: make sure focusable elements have visible focus
  document.addEventListener('keydown', (e) => {
    if(e.key === 'Tab') document.body.classList.add('show-focus');
  });

  // Preload sample images (cards) to avoid layout jumps — they are local assets
  const sampleImgs = ['images/photographer.jpg','images/cafe.jpg','images/coach.jpg'];
  sampleImgs.forEach(s => { const i = new Image(); i.src = s; });

  // small tilt effect using device orientation if available (mobile)
  if(window.DeviceOrientationEvent){
    window.addEventListener('deviceorientation', (ev) => {
      const x = ev.beta || 0; // -180 to 180
      const y = ev.gamma || 0; // -90 to 90
      cards.forEach(card => {
        const inner = card.querySelector('.card-inner');
        const rx = Math.max(-10, Math.min(10, x / 4));
        const ry = Math.max(-12, Math.min(12, y / 3));
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateZ(10px)`;
      });
    });
  }

  // Small entrance animation for hero 3D text
  const heroText = document.querySelector('.three-d-text');
  if (heroText) {
    setTimeout(() => heroText.style.transform = 'translateZ(12px) rotateX(0.5deg)', 700);
  }

})();
