(() => {
  const root = document.documentElement;
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const readViewport = () => {
    const vv = window.visualViewport;
    const width = vv?.width || window.innerWidth || root.clientWidth || 0;
    const height = vv?.height || window.innerHeight || root.clientHeight || 0;

    const safeTop = Math.max(0, vv?.offsetTop || 0);
    const safeLeft = Math.max(0, vv?.offsetLeft || 0);
    const safeRight = Math.max(0, (window.innerWidth || width) - width - safeLeft);
    const safeBottom = Math.max(0, (window.innerHeight || height) - height - safeTop);

    return {
      width,
      height,
      safeTop,
      safeRight,
      safeBottom,
      safeLeft,
    };
  };

  const applyLayoutVars = () => {
    rafId = 0;
    const viewport = readViewport();

    const availWidth = Math.max(1, viewport.width - viewport.safeLeft - viewport.safeRight);
    const availHeight = Math.max(1, viewport.height - viewport.safeTop - viewport.safeBottom);
    const widthScale = availWidth / 1440;
    const heightScale = availHeight / 900;
    const scale = clamp(Math.min(widthScale, heightScale), 0.72, 1.18);

    root.style.setProperty('--safe-top', `${viewport.safeTop}px`);
    root.style.setProperty('--safe-right', `${viewport.safeRight}px`);
    root.style.setProperty('--safe-bottom', `${viewport.safeBottom}px`);
    root.style.setProperty('--safe-left', `${viewport.safeLeft}px`);
    root.style.setProperty('--ui-scale', scale.toFixed(4));
    root.style.setProperty('--layout-hud-zone', `clamp(68px, calc(84px * ${scale.toFixed(4)}), 120px)`);
    root.style.setProperty('--layout-controls-zone', `clamp(112px, calc(168px * ${scale.toFixed(4)}), 240px)`);
  };

  const scheduleLayoutUpdate = () => {
    if (rafId) return;
    rafId = window.requestAnimationFrame(applyLayoutVars);
  };

  window.initResponsiveLayout = () => {
    scheduleLayoutUpdate();

    window.addEventListener('resize', scheduleLayoutUpdate, { passive: true });
    window.addEventListener('orientationchange', scheduleLayoutUpdate, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleLayoutUpdate, { passive: true });
    }
  };
})();
