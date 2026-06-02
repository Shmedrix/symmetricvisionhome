(() => {
  const video = document.querySelector("[data-hero-video]");
  if (!video) {
    return;
  }

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;

  const tryPlay = () => {
    if (document.visibilityState === "hidden") {
      return;
    }

    const playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(() => {});
    }
  };

  if (video.readyState >= 2) {
    tryPlay();
  }

  video.addEventListener("canplay", tryPlay);
  window.addEventListener("pageshow", tryPlay);
  document.addEventListener("visibilitychange", tryPlay);
  window.addEventListener("pointerdown", tryPlay, { once: true, passive: true });
  window.addEventListener("touchstart", tryPlay, { once: true, passive: true });
})();
