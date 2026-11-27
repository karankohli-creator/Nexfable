/**
 * Nex Fable - Pre-footer Sculptural Organic 3D Terrain
 * Renders undulating organic landscape hills with purple (#24143D, #743CC8), warm orange (#F28B45), and lavender (#EEE7F8)
 */
(function() {
  'use strict';

  function initTerrain() {
    const canvas = document.getElementById('terrain-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationFrameId = null;
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

    // 5 sculptural terrain layers with perspective depth
    const layers = [
      { speed: 0.004, amp: 28, freq: 0.003, yOffset: 0.45, colorStart: '#2A1646', colorEnd: '#18151E', stroke: 'rgba(242, 139, 69, 0.45)' },
      { speed: 0.006, amp: 38, freq: 0.0045, yOffset: 0.55, colorStart: '#3A1B63', colorEnd: '#201235', stroke: 'rgba(159, 95, 232, 0.5)' },
      { speed: 0.008, amp: 48, freq: 0.006, yOffset: 0.65, colorStart: '#4C2482', colorEnd: '#24143D', stroke: 'rgba(238, 231, 248, 0.4)' },
      { speed: 0.010, amp: 58, freq: 0.0075, yOffset: 0.78, colorStart: '#5E2CA3', colorEnd: '#1F1033', stroke: 'rgba(242, 139, 69, 0.6)' },
      { speed: 0.012, amp: 68, freq: 0.009, yOffset: 0.88, colorStart: '#743CC8', colorEnd: '#18151E', stroke: 'rgba(255, 235, 220, 0.7)' }
    ];

    function draw() {
      time += 1;
      ctx.clearRect(0, 0, width, height);

      // Sky / Horizon gradient with warm orange sun glow
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#100D16');
      skyGrad.addColorStop(0.4, '#1C132B');
      skyGrad.addColorStop(0.75, '#2D1540');
      skyGrad.addColorStop(1, '#3D1B48');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Warm glowing horizon orb / sun behind hills
      const sunX = width * 0.5;
      const sunY = height * 0.42;
      const sunRadius = Math.min(width, height) * 0.35;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, sunRadius);
      sunGrad.addColorStop(0, 'rgba(255, 210, 160, 0.85)');
      sunGrad.addColorStop(0.2, 'rgba(242, 139, 69, 0.55)');
      sunGrad.addColorStop(0.6, 'rgba(116, 60, 200, 0.25)');
      sunGrad.addColorStop(1, 'rgba(16, 13, 22, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Render terrain waves
      layers.forEach((layer, idx) => {
        ctx.save();
        ctx.beginPath();
        const baseLine = height * layer.yOffset;
        ctx.moveTo(0, height);
        ctx.lineTo(0, baseLine);

        const step = 8;
        for (let x = 0; x <= width; x += step) {
          const t = time * layer.speed;
          const y = baseLine +
            Math.sin(x * layer.freq + t) * layer.amp +
            Math.cos(x * layer.freq * 0.5 - t * 0.8) * (layer.amp * 0.4) +
            Math.sin(x * layer.freq * 1.5 + t * 1.2) * (layer.amp * 0.25);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        // Fill with rich gradient
        const fillGrad = ctx.createLinearGradient(0, baseLine - layer.amp, 0, height);
        fillGrad.addColorStop(0, layer.colorStart);
        fillGrad.addColorStop(1, layer.colorEnd);
        ctx.fillStyle = fillGrad;
        ctx.fill();

        // Contour ridge line with highlight
        ctx.strokeStyle = layer.stroke;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Perspective grid lines on terrain
        if (idx >= 2) {
          ctx.beginPath();
          for (let gx = 0; gx < width; gx += 45) {
            const t = time * layer.speed;
            const gy = baseLine + Math.sin(gx * layer.freq + t) * layer.amp;
            ctx.moveTo(gx, gy);
            ctx.lineTo(gx + (gx - width / 2) * 0.35, height);
          }
          ctx.strokeStyle = 'rgba(238, 231, 248, 0.08)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(draw);
    }

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
    document.addEventListener('DOMContentLoaded', initTerrain);
  } else {
    initTerrain();
  }
})();
