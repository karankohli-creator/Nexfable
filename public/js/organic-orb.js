/**
 * Nex Fable - 3D Organic Fluid Orb
 * Inspired by found.co.uk fluid sphere
 * Rendered using lightweight WebGL / 2D Canvas with organic Perlin/Simplex harmonic displacement
 * Brand Colors: Deep Purple (#24143D, #743CC8) & Warm Orange (#F28B45) with Lavender accents (#EEE7F8)
 */
(function() {
  'use strict';

  function initOrb() {
    const canvas = document.getElementById('hero-orb-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = null;
    let mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    let time = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    }

    window.addEventListener('resize', resize, { passive: true });
    resize();

    window.addEventListener('mousemove', function(e) {
      const rect = canvas.getBoundingClientRect();
      if (rect.top <= window.innerHeight && rect.bottom >= 0) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        mouse.targetX = (e.clientX - cx) / (rect.width / 2);
        mouse.targetY = (e.clientY - cy) / (rect.height / 2);
      }
    }, { passive: true });

    // Multi-octave organic noise simulation for fluid boundary
    function getRadius(baseRadius, angle, t, mx, my) {
      const n1 = Math.sin(angle * 3 + t * 1.2) * 18;
      const n2 = Math.cos(angle * 2 - t * 0.9) * 14;
      const n3 = Math.sin(angle * 5 + t * 1.8 + mx * 2) * 10;
      const n4 = Math.cos(angle * 7 - t * 2.2 + my * 2) * 6;
      const interaction = (Math.cos(angle - Math.atan2(my, mx)) * 12) * Math.min(Math.hypot(mx, my), 1.2);
      return baseRadius + n1 + n2 + n3 + n4 + interaction;
    }

    function draw() {
      time += 0.015;
      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2 + mouse.x * 20;
      const cy = height / 2 + mouse.y * 20;
      const baseRadius = Math.min(width, height) * 0.32;

      // Draw background ambient glow
      const glowGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.2, cx, cy, baseRadius * 1.8);
      glowGrad.addColorStop(0, 'rgba(116, 60, 200, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(242, 139, 69, 0.15)');
      glowGrad.addColorStop(1, 'rgba(250, 249, 247, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Outer Layer: Flowing secondary aura
      ctx.save();
      ctx.beginPath();
      const points = 72;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = getRadius(baseRadius * 1.08, angle, time * 0.8, mouse.x, mouse.y);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const auraGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.3, cy - baseRadius * 0.3, baseRadius * 0.1,
        cx, cy, baseRadius * 1.2
      );
      auraGrad.addColorStop(0, 'rgba(242, 139, 69, 0.4)');
      auraGrad.addColorStop(0.6, 'rgba(116, 60, 200, 0.3)');
      auraGrad.addColorStop(1, 'rgba(36, 20, 61, 0.05)');
      ctx.fillStyle = auraGrad;
      ctx.fill();
      ctx.restore();

      // Primary Orb Body: 3D fluid morphing shape
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = getRadius(baseRadius, angle, time, mouse.x, mouse.y);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Sophisticated fluid 3D shading with purple base & warm glowing orange highlights
      const lightX = cx - baseRadius * 0.4 + mouse.x * 30;
      const lightY = cy - baseRadius * 0.4 + mouse.y * 30;
      const orbGrad = ctx.createRadialGradient(
        lightX, lightY, baseRadius * 0.05,
        cx, cy, baseRadius * 1.15
      );
      orbGrad.addColorStop(0, '#FFE8D6');      // soft warm specular highlight
      orbGrad.addColorStop(0.15, '#F28B45');   // brand vibrant warm orange
      orbGrad.addColorStop(0.45, '#9F5FE8');   // transitional rich lavender/violet
      orbGrad.addColorStop(0.75, '#743CC8');   // brand core purple
      orbGrad.addColorStop(1, '#24143D');      // deep luxury night purple
      ctx.fillStyle = orbGrad;
      ctx.shadowColor = 'rgba(116, 60, 200, 0.35)';
      ctx.shadowBlur = 35;
      ctx.fill();
      ctx.restore();

      // Internal fluid core wave reflection
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const r = getRadius(baseRadius * 0.65, angle + 1.2, time * 1.4, -mouse.x, -mouse.y);
        const x = cx - baseRadius * 0.15 + Math.cos(angle) * r;
        const y = cy - baseRadius * 0.15 + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const innerGrad = ctx.createRadialGradient(
        cx - baseRadius * 0.2, cy - baseRadius * 0.2, 5,
        cx, cy, baseRadius * 0.7
      );
      innerGrad.addColorStop(0, 'rgba(255, 235, 220, 0.65)');
      innerGrad.addColorStop(0.5, 'rgba(242, 139, 69, 0.3)');
      innerGrad.addColorStop(1, 'rgba(116, 60, 200, 0)');
      ctx.fillStyle = innerGrad;
      ctx.fill();
      ctx.restore();

      // Specular rim light sheen
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(lightX, lightY, baseRadius * 0.25, baseRadius * 0.14, Math.PI / 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.filter = 'blur(6px)';
      ctx.fill();
      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    }

    // Only animate when visible in viewport
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isVisible = entry.isIntersecting;
        if (isVisible && !animationFrameId) {
          animationFrameId = requestAnimationFrame(draw);
        } else if (!isVisible && animationFrameId) {
          cancelAnimationFrame(animationFrameId);
          animationFrameId = null;
        }
      });
    }, { threshold: 0.05 });

    observer.observe(canvas);
    animationFrameId = requestAnimationFrame(draw);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrb);
  } else {
    initOrb();
  }
})();
