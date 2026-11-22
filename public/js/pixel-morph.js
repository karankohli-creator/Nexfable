/**
 * PIXEL-MORPH CANVAS ENGINE
 * Smooth particle/pixel morphing animation:
 * 1. Rocket (Launch & Growth)
 * 2. Globe (Digital Reach & Connectivity)
 * 3. Smartphone (Digital Experiences)
 * 4. Handshake (Collaboration & Partnerships)
 */

(function () {
  'use strict';

  const canvas = document.getElementById('pixel-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const labelEl = document.getElementById('pixel-shape-label');
  const dots = document.querySelectorAll('.pixel-dot-indicator');

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width || 420;
    height = rect.height || 420;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Neon Palette
  const PALETTE = ['#CCFF00', '#D91E85', '#818CF8', '#FF55AD', '#52F1FF'];

  // SHAPE GENERATORS (returns array of {x, y, color})
  // Coords normalized in range [-14, 14]

  function getRocketPoints() {
    const pts = [];
    // Nosecone
    for (let y = -12; y <= -7; y++) {
      const span = Math.floor((y - (-13)) * 0.7);
      for (let x = -span; x <= span; x++) {
        pts.push({ x, y, c: '#CCFF00' });
      }
    }
    // Main Body
    for (let y = -6; y <= 5; y++) {
      for (let x = -4; x <= 4; x++) {
        // Porthole window cutout
        if (Math.abs(x) <= 1 && y >= -2 && y <= 0) {
          if (x === 0 && y === -1) pts.push({ x, y, c: '#52F1FF' });
        } else {
          pts.push({ x, y, c: '#FFFFFF' });
        }
      }
    }
    // Fins Left & Right
    for (let y = 1; y <= 7; y++) {
      const finSpan = y - 1;
      for (let s = 0; s <= finSpan; s++) {
        pts.push({ x: -4 - s, y, c: '#D91E85' });
        pts.push({ x: 4 + s, y, c: '#D91E85' });
      }
    }
    // Thruster base
    for (let x = -2; x <= 2; x++) {
      pts.push({ x, y: 6, c: '#818CF8' });
    }
    // Flame
    const flame = [
      { x: 0, y: 7, c: '#FF55AD' },
      { x: -1, y: 8, c: '#FF55AD' }, { x: 0, y: 8, c: '#CCFF00' }, { x: 1, y: 8, c: '#FF55AD' },
      { x: -2, y: 9, c: '#FF55AD' }, { x: 0, y: 9, c: '#CCFF00' }, { x: 2, y: 9, c: '#FF55AD' },
      { x: -1, y: 10, c: '#CCFF00' }, { x: 0, y: 10, c: '#CCFF00' }, { x: 1, y: 10, c: '#CCFF00' },
      { x: 0, y: 11, c: '#CCFF00' }, { x: 0, y: 12, c: '#CCFF00' }
    ];
    flame.forEach(p => pts.push(p));
    return pts;
  }

  function getGlobePoints() {
    const pts = [];
    const R = 11;
    for (let y = -R; y <= R; y++) {
      for (let x = -R; x <= R; x++) {
        const d2 = x * x + y * y;
        // Outer ring
        if (d2 <= R * R && d2 >= (R - 1.5) * (R - 1.5)) {
          pts.push({ x, y, c: '#818CF8' });
        }
        // Equator line
        else if (y === 0 && Math.abs(x) < R - 1) {
          pts.push({ x, y, c: '#52F1FF' });
        }
        // Tropics
        else if ((y === 5 || y === -5) && Math.abs(x) < R - 2 && (x % 2 === 0)) {
          pts.push({ x, y, c: '#52F1FF' });
        }
        // Prime Meridian ellipse
        else if (Math.abs(x * 2.2) <= Math.sqrt(Math.max(0, R * R - y * y)) && Math.abs(x) <= 2) {
          pts.push({ x, y, c: '#818CF8' });
        }
        // Continents / landmass dots
        else if (
          (x >= -7 && x <= -2 && y >= -7 && y <= -1) || // North America
          (x >= -5 && x <= -1 && y >= 1 && y <= 7) ||  // South America
          (x >= 1 && x <= 7 && y >= -8 && y <= 0) ||   // Eurasia
          (x >= 1 && x <= 6 && y >= 1 && y <= 6)       // Africa / Aus
        ) {
          if ((x + y) % 2 === 0) {
            pts.push({ x, y, c: '#CCFF00' });
          }
        }
      }
    }
    return pts;
  }

  function getPhonePoints() {
    const pts = [];
    // Outer phone border (width 16, height 24)
    for (let y = -12; y <= 12; y++) {
      for (let x = -7; x <= 7; x++) {
        const isCorner = (Math.abs(x) === 7 && Math.abs(y) === 12);
        if (isCorner) continue;

        const isBorder = Math.abs(x) === 7 || Math.abs(y) === 12;
        if (isBorder) {
          pts.push({ x, y, c: '#D91E85' });
        }
        // Dynamic Island / Speaker
        else if (y === -10 && Math.abs(x) <= 2) {
          pts.push({ x, y, c: '#52F1FF' });
        }
        // Home indicator bar
        else if (y === 10 && Math.abs(x) <= 3) {
          pts.push({ x, y, c: '#CCFF00' });
        }
        // App icons matrix
        else if (y >= -7 && y <= 7) {
          const inIconCol = (x === -4 || x === -3 || x === 3 || x === 4 || x === -1 || x === 0);
          const inIconRow = (y === -6 || y === -5 || y === -2 || y === -1 || y === 2 || y === 3 || y === 6 || y === 7);
          if (inIconCol && inIconRow) {
            const iconColor = (x < 0) ? '#CCFF00' : (x === 0 ? '#52F1FF' : '#FF55AD');
            pts.push({ x, y, c: iconColor });
          }
        }
      }
    }
    return pts;
  }

  function getHandshakePoints() {
    const pts = [];
    // Left sleeve
    for (let x = -13; x <= -8; x++) {
      for (let y = 1; y <= 5; y++) {
        pts.push({ x, y, c: '#818CF8' });
      }
    }
    // Right sleeve
    for (let x = 8; x <= 13; x++) {
      for (let y = -4; y <= 0; y++) {
        pts.push({ x, y, c: '#818CF8' });
      }
    }
    // Left hand entering diagonally
    for (let i = 0; i <= 6; i++) {
      pts.push({ x: -7 + i, y: 3 - Math.floor(i * 0.5), c: '#CCFF00' });
      pts.push({ x: -7 + i, y: 4 - Math.floor(i * 0.5), c: '#CCFF00' });
    }
    // Right hand entering diagonally
    for (let i = 0; i <= 6; i++) {
      pts.push({ x: 7 - i, y: -2 + Math.floor(i * 0.5), c: '#D91E85' });
      pts.push({ x: 7 - i, y: -1 + Math.floor(i * 0.5), c: '#D91E85' });
    }
    // Clasping fingers center
    for (let y = -2; y <= 3; y++) {
      for (let x = -2; x <= 2; x++) {
        if ((x + y) % 2 === 0) {
          pts.push({ x, y, c: '#FFFFFF' });
        } else {
          pts.push({ x, y, c: '#52F1FF' });
        }
      }
    }
    // Thumbs locking
    pts.push({ x: -1, y: -3, c: '#CCFF00' });
    pts.push({ x: 0, y: -3, c: '#CCFF00' });
    pts.push({ x: 1, y: 4, c: '#D91E85' });
    pts.push({ x: 0, y: 4, c: '#D91E85' });

    return pts;
  }

  const SHAPES = [
    { name: '01 / LAUNCH & ACCELERATION', generator: getRocketPoints },
    { name: '02 / GLOBAL DIGITAL REACH', generator: getGlobePoints },
    { name: '03 / CONNECTED EXPERIENCES', generator: getPhonePoints },
    { name: '04 / STRATEGIC PARTNERSHIPS', generator: getHandshakePoints }
  ];

  const TOTAL_PARTICLES = 220;
  const particles = [];

  // Initialize particles with random scatter
  for (let i = 0; i < TOTAL_PARTICLES; i++) {
    particles.push({
      x: (Math.random() - 0.5) * 300,
      y: (Math.random() - 0.5) * 300,
      targetX: 0,
      targetY: 0,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: 4 + (i % 3),
      color: PALETTE[i % PALETTE.length],
      targetColor: PALETTE[i % PALETTE.length],
      alpha: 0.8
    });
  }

  let currentShapeIndex = 0;
  let phase = 'hold'; // 'hold', 'disperse', 'assemble'
  let phaseTimer = 0;
  const HOLD_DURATION = 160;   // ~2.6s at 60fps
  const DISPERSE_DURATION = 35; // ~0.6s
  let isVisible = true;

  function applyShape(shapeIdx) {
    const rawPoints = SHAPES[shapeIdx].generator();
    const scale = Math.min(width, height) / 36;

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const p = particles[i];
      if (i < rawPoints.length) {
        const pt = rawPoints[i];
        p.targetX = pt.x * scale;
        p.targetY = pt.y * scale;
        p.targetColor = pt.c;
      } else {
        // Extra particles become subtle ambient orbiters
        const angle = (i / TOTAL_PARTICLES) * Math.PI * 2;
        const rad = scale * 15;
        p.targetX = Math.cos(angle) * rad;
        p.targetY = Math.sin(angle) * rad;
        p.targetColor = 'rgba(255, 255, 255, 0.15)';
      }
    }

    if (labelEl) {
      labelEl.textContent = SHAPES[shapeIdx].name;
    }
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === shapeIdx);
    });
  }

  applyShape(0);

  // Pause when offscreen
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.1 });
    observer.observe(canvas);
  }

  function loop() {
    if (!isVisible || prefersReducedMotion) {
      requestAnimationFrame(loop);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    phaseTimer++;

    if (phase === 'hold') {
      if (phaseTimer > HOLD_DURATION) {
        phase = 'disperse';
        phaseTimer = 0;
        // Kick particles out with velocity
        particles.forEach(p => {
          const ang = Math.random() * Math.PI * 2;
          const force = 3 + Math.random() * 7;
          p.vx = Math.cos(ang) * force;
          p.vy = Math.sin(ang) * force;
        });
      }
    } else if (phase === 'disperse') {
      if (phaseTimer > DISPERSE_DURATION) {
        phase = 'assemble';
        phaseTimer = 0;
        currentShapeIndex = (currentShapeIndex + 1) % SHAPES.length;
        applyShape(currentShapeIndex);
      }
    } else if (phase === 'assemble') {
      if (phaseTimer > 50) {
        phase = 'hold';
        phaseTimer = 0;
      }
    }

    // Update and draw particles
    const spring = phase === 'disperse' ? 0.02 : 0.09;
    const damping = phase === 'disperse' ? 0.94 : 0.78;

    for (let i = 0; i < TOTAL_PARTICLES; i++) {
      const p = particles[i];

      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;

      p.vx += dx * spring;
      p.vy += dy * spring;

      p.vx *= damping;
      p.vy *= damping;

      p.x += p.vx;
      p.y += p.vy;

      // Small floating breathing wiggle during hold
      let drawX = cx + p.x;
      let drawY = cy + p.y;
      if (phase === 'hold') {
        drawX += Math.sin((phaseTimer + i * 5) * 0.04) * 0.7;
        drawY += Math.cos((phaseTimer + i * 7) * 0.04) * 0.7;
      }

      ctx.save();
      ctx.fillStyle = p.targetColor || p.color;
      ctx.shadowColor = p.targetColor || p.color;
      ctx.shadowBlur = 8;
      ctx.fillRect(drawX - p.size / 2, drawY - p.size / 2, p.size, p.size);
      ctx.restore();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
