/**
 * GROWTH ORBIT MARKETING — ANTIGRAVITY & SPACE-TECH ENGINE
 * 1. Space-Tech Orbital Canvas System (Planetary physics, stars, glowing orbital rings)
 * 2. 3D Antigravity Levitating Dashboard Tilt Controller (Spring damping, depth parallax)
 */

class SpaceCanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.stars = [];
    this.mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, isHovering: false };
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.animId = null;
    this.time = 0;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.init();
  }

  init() {
    this.resize();
    this.createStars();
    this.createParticles();
    this.bindEvents();
    if (!this.reducedMotion) {
      this.loop();
    } else {
      this.renderStatic();
    }
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
  }

  createStars() {
    this.stars = [];
    const count = Math.min(Math.floor((this.width * this.height) / 7000), 160);
    for (let i = 0; i < count; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.7 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }
  }

  createParticles() {
    this.particles = [];
    const count = Math.min(Math.floor(this.width / 35), 45);
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? 'rgba(0, 229, 255, ' : 'rgba(99, 102, 241, ',
        alpha: Math.random() * 0.5 + 0.2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createStars();
      this.createParticles();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
      this.mouse.isHovering = true;
    }, { passive: true });

    document.addEventListener('mouseleave', () => {
      this.mouse.isHovering = false;
    });
  }

  loop() {
    this.time += 0.016;

    // Smooth mouse lerp
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.08;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.08;

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw Twinkling Stars
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      const brightness = s.alpha + Math.sin(this.time * s.twinkleSpeed * 60 + s.twinklePhase) * 0.25;
      this.ctx.fillStyle = `rgba(248, 250, 252, ${Math.max(0.1, Math.min(1, brightness))})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Ambient Orbital Ring Center (Hero Background Anchor)
    const centerX = this.width > 1080 ? this.width * 0.72 : this.width * 0.5;
    const centerY = this.height * 0.42;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(this.time * 0.05);

    // Large Cyan Orbit
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 260, 100, -Math.PI / 6, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(0, 229, 255, 0.09)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([8, 14]);
    this.ctx.stroke();

    // Medium Indigo Orbit
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 340, 130, Math.PI / 4, 0, Math.PI * 2);
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.07)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 10]);
    this.ctx.stroke();

    this.ctx.restore();

    // Draw Antigravity Zero-G Particles with Mouse Gravity
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Natural Drift
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around bounds
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;

      // Mouse Gravitational Attraction
      if (this.mouse.isHovering) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 20) {
          const force = (180 - dist) / 180 * 0.008;
          p.x += dx * force;
          p.y += dy * force;
        }
      }

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color + p.alpha + ')';
      this.ctx.shadowColor = p.color + '0.8)';
      this.ctx.shadowBlur = 10;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.animId = requestAnimationFrame(() => this.loop());
  }

  renderStatic() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (let i = 0; i < this.stars.length; i++) {
      const s = this.stars[i];
      this.ctx.fillStyle = `rgba(248, 250, 252, ${s.alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

/**
 * 3D Antigravity Levitating Dashboard Tilt Controller
 * Smoothly angles the hero card based on cursor coordinates,
 * with spring dampening and multi-layer parallax for satellites.
 */
class Hero3DAntigravityTilt {
  constructor() {
    this.wrapper = document.querySelector('.hero-mockup-wrapper');
    this.card = document.querySelector('.hero-3d-card');
    this.satellites = document.querySelectorAll('.satellite-badge');
    
    if (!this.wrapper || !this.card) return;

    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.isHovering = false;
    this.lerpFactor = 0.09;
    this.rafId = null;

    this.init();
  }

  init() {
    this.bindEvents();
    this.loop();
  }

  bindEvents() {
    // Window-level mouse movement for organic continuous response
    window.addEventListener('mousemove', (e) => {
      const rect = this.wrapper.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      const cardCenterY = rect.top + rect.height / 2;

      // Distance normalized from center (-1 to 1)
      const normX = (e.clientX - cardCenterX) / (window.innerWidth / 2);
      const normY = (e.clientY - cardCenterY) / (window.innerHeight / 2);

      // Pitch (X-rotation) and Roll (Y-rotation) in degrees
      this.targetX = Math.max(-14, Math.min(14, -normY * 12));
      this.targetY = Math.max(-18, Math.min(18, normX * 16));
    }, { passive: true });

    // When directly hovering the card, increase sensitivity slightly
    this.wrapper.addEventListener('mouseenter', () => {
      this.isHovering = true;
      this.lerpFactor = 0.12;
    });

    this.wrapper.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this.lerpFactor = 0.06;
    });

    // Touch Support for mobile device gestures
    let touchStartX = 0;
    let touchStartY = 0;

    this.wrapper.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.wrapper.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const deltaX = (e.touches[0].clientX - touchStartX) / 10;
        const deltaY = (e.touches[0].clientY - touchStartY) / 10;
        this.targetY = Math.max(-15, Math.min(15, deltaX));
        this.targetX = Math.max(-12, Math.min(12, -deltaY));
      }
    }, { passive: true });

    this.wrapper.addEventListener('touchend', () => {
      this.targetX = 0;
      this.targetY = 0;
    }, { passive: true });
  }

  loop() {
    // Spring damped linear interpolation
    this.currentX += (this.targetX - this.currentX) * this.lerpFactor;
    this.currentY += (this.targetY - this.currentY) * this.lerpFactor;

    // Apply 3D transform with subtle z-elevation
    const elevateZ = this.isHovering ? 25 : 10;
    this.card.style.transform = `perspective(1000px) rotateX(${this.currentX.toFixed(2)}deg) rotateY(${this.currentY.toFixed(2)}deg) translateZ(${elevateZ}px)`;

    // Parallax depth shift on satellite badges
    this.satellites.forEach((sat, idx) => {
      const depthMultiplier = idx % 2 === 0 ? 1.6 : -1.3;
      const shiftX = (this.currentY * depthMultiplier).toFixed(2);
      const shiftY = (-this.currentX * depthMultiplier).toFixed(2);
      sat.style.transform = `translate3d(${shiftX}px, ${shiftY}px, ${30 + idx * 15}px)`;
    });

    this.rafId = requestAnimationFrame(() => this.loop());
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new SpaceCanvasEngine('space-canvas');
  new Hero3DAntigravityTilt();
});
