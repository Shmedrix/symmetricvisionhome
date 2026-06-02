(function () {
  const DATA_URL = "data/video-carousels.json";
  const AUTO_SCROLL_PX_PER_SECOND = 18;
  const AUTO_RESUME_DELAY_MS = 2600;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const carouselRoots = Array.from(document.querySelectorAll("[data-video-carousel]"));

  if (!carouselRoots.length) {
    return;
  }

  fetch(DATA_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Carousel data request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      carouselRoots.forEach((root) => renderCarousel(root, data[root.dataset.videoCarousel]));
    })
    .catch((error) => {
      carouselRoots.forEach((root) => {
        root.className = "carousel-error";
        root.textContent = "Media could not be loaded.";
      });
      console.error(error);
    });

  function renderCarousel(root, carousel) {
    if (!carousel || !Array.isArray(carousel.items) || carousel.items.length === 0) {
      root.remove();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "video-carousel";

    const toolbar = document.createElement("div");
    toolbar.className = "carousel-toolbar";

    const prevButton = createScrollButton("<", "Previous items");
    const nextButton = createScrollButton(">", "Next items");
    toolbar.append(prevButton, nextButton);

    const track = document.createElement("div");
    track.className = "video-carousel__track";
    track.setAttribute("tabindex", "0");
    track.setAttribute("aria-label", carousel.label || "Media carousel");

    carousel.items.forEach((item) => {
      track.append(createVideoCard(item));
    });

    if (carousel.items.length > 1) {
      carousel.items.forEach((item) => {
        const clone = createVideoCard(item, true);
        track.append(clone);
      });
    }

    prevButton.addEventListener("click", () => scrollTrack(track, -1));
    nextButton.addEventListener("click", () => scrollTrack(track, 1));

    wrapper.append(toolbar, track);
    root.replaceChildren(wrapper);
    startAutoScroll(wrapper, track);
  }

  function createScrollButton(label, title) {
    const button = document.createElement("button");
    button.className = "carousel-button";
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    return button;
  }

  function scrollTrack(track, direction) {
    const carousel = track.closest(".video-carousel");
    if (carousel) {
      pauseAutoScroll(carousel, AUTO_RESUME_DELAY_MS);
    }

    const firstCard = track.querySelector(".video-card");
    const amount = firstCard ? firstCard.getBoundingClientRect().width + 16 : track.clientWidth * 0.82;
    const loopWidth = getLoopWidth(track);
    let target = track.scrollLeft + amount * direction;

    if (loopWidth) {
      if (target >= loopWidth) {
        target -= loopWidth;
      } else if (target < 0) {
        target += loopWidth;
      }
    }

    track.scrollTo({ left: target, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  function createVideoCard(item, isClone) {
    const card = document.createElement("a");
    card.className = "video-card";
    card.href = getSafeHref(item.url || item.permalink, getDefaultUrl(item));
    card.target = "_blank";
    card.rel = "noopener noreferrer";
    card.style.setProperty("--card-ratio", item.aspectRatio || "16 / 9");

    if (isClone) {
      card.classList.add("video-card--clone");
      card.tabIndex = -1;
      card.setAttribute("aria-hidden", "true");
    }

    const media = document.createElement("span");
    media.className = "video-card__media";

    const image = document.createElement("img");
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.src = getSafeMediaSrc(item.thumbnail, getDefaultThumbnail(item));
    media.append(image);

    const badge = document.createElement("span");
    badge.className = "video-card__badge";
    badge.textContent = item.platformLabel || platformLabel(item.platform);
    media.append(badge);

    if (item.warning) {
      const warning = document.createElement("span");
      warning.className = "video-card__warning";
      warning.textContent = item.warning;
      media.append(warning);
    }

    if (item.platform === "youtube" && item.videoId) {
      wireYoutubePreview(card, media, item.videoId);
    } else if (item.previewVideo) {
      wireVideoPreview(card, media, item.previewVideo);
    }

    const body = document.createElement("span");
    body.className = "video-card__body";

    const title = document.createElement("h3");
    title.textContent = item.title;
    body.append(title);

    if (item.description) {
      const description = document.createElement("p");
      description.textContent = item.description;
      body.append(description);
    }

    card.append(media, body);
    return card;
  }

  function startAutoScroll(wrapper, track) {
    if (reduceMotion.matches || track.querySelectorAll(".video-card").length < 2) {
      return;
    }

    let frameId = 0;
    let lastTime = 0;
    let pauseUntil = 0;
    let autoPosition = track.scrollLeft;

    wrapper.__pauseAutoScroll = (delay) => {
      if (delay) {
        pauseUntil = Math.max(pauseUntil, performance.now() + delay);
      } else {
        pauseUntil = Number.POSITIVE_INFINITY;
      }
      lastTime = 0;
    };

    wrapper.__resumeAutoScroll = () => {
      pauseUntil = 0;
      lastTime = 0;
    };

    track.addEventListener("wheel", () => wrapper.__pauseAutoScroll(AUTO_RESUME_DELAY_MS), { passive: true });
    track.addEventListener("touchstart", () => wrapper.__pauseAutoScroll(AUTO_RESUME_DELAY_MS), { passive: true });

    const tick = (time) => {
      const userInteracting = track.matches(":hover") || track.contains(document.activeElement) || time < pauseUntil;

      if (!document.hidden && !userInteracting) {
        const elapsed = lastTime ? time - lastTime : 0;
        autoPosition += elapsed * AUTO_SCROLL_PX_PER_SECOND / 1000;
        autoPosition = normalizeLoopValue(track, autoPosition);
        track.scrollLeft = autoPosition;
      } else {
        autoPosition = track.scrollLeft;
      }

      lastTime = time;
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    reduceMotion.addEventListener("change", () => {
      if (reduceMotion.matches) {
        window.cancelAnimationFrame(frameId);
      } else {
        lastTime = 0;
        frameId = window.requestAnimationFrame(tick);
      }
    });
  }

  function pauseAutoScroll(wrapper, delay) {
    if (typeof wrapper.__pauseAutoScroll === "function") {
      wrapper.__pauseAutoScroll(delay);
    }
  }

  function normalizeLoopPosition(track) {
    const normalized = normalizeLoopValue(track, track.scrollLeft);
    track.scrollLeft = normalized;
    return normalized;
  }

  function normalizeLoopValue(track, value) {
    const loopWidth = getLoopWidth(track);
    if (!loopWidth) {
      return value;
    }

    if (value >= loopWidth) {
      return value - loopWidth;
    }
    if (value < 0) {
      return value + loopWidth;
    }

    return value;
  }

  function getLoopWidth(track) {
    const firstCard = track.querySelector(".video-card:not(.video-card--clone)");
    const firstClone = track.querySelector(".video-card--clone");
    if (!firstCard || !firstClone) {
      return 0;
    }

    return firstClone.offsetLeft - firstCard.offsetLeft;
  }

  function wireVideoPreview(card, media, src) {
    const safeSrc = getSafeMediaSrc(src, "");
    if (!safeSrc) {
      return;
    }

    const video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    media.append(video);

    card.addEventListener("pointerenter", (event) => {
      if (shouldSkipPreview(event)) {
        return;
      }

      if (!video.src) {
        video.src = safeSrc;
      }
      video.play()
        .then(() => card.classList.add("is-previewing"))
        .catch(() => {});
    });

    card.addEventListener("pointerleave", () => {
      video.pause();
      video.currentTime = 0;
      card.classList.remove("is-previewing");
    });
  }

  function wireYoutubePreview(card, media, videoId) {
    let playerHost = null;

    card.addEventListener("pointerenter", (event) => {
      if (shouldSkipPreview(event) || playerHost) {
        return;
      }

      playerHost = document.createElement("span");
      playerHost.className = "video-card__player";

      const iframe = document.createElement("iframe");
      iframe.title = "YouTube hover preview";
      iframe.loading = "eager";
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.referrerPolicy = "strict-origin-when-cross-origin";
      iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
      iframe.src = getYoutubeEmbedUrl(videoId);

      playerHost.append(iframe);
      media.append(playerHost);
      card.classList.add("is-previewing");
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-previewing");
      if (playerHost) {
        playerHost.remove();
      }
      playerHost = null;
    });
  }

  function shouldSkipPreview(event) {
    return reduceMotion.matches || event.pointerType === "touch";
  }

  function getDefaultUrl(item) {
    if (item.platform === "youtube" && item.videoId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(item.videoId)}`;
    }
    return item.permalink || "links.html";
  }

  function getDefaultThumbnail(item) {
    if (item.platform === "youtube" && item.videoId) {
      return `https://i.ytimg.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;
    }
    return item.thumbnail || "RGBDistortLogo.png";
  }

  function getSafeHref(value, fallback) {
    const safeUrl = getSafeUrl(value);
    if (safeUrl) {
      return safeUrl;
    }

    return getSafeUrl(fallback) || "links.html";
  }

  function getSafeMediaSrc(value, fallback) {
    return getSafeUrl(value) || getSafeUrl(fallback) || "";
  }

  function getSafeUrl(value) {
    if (!value || typeof value !== "string") {
      return "";
    }

    try {
      const url = new URL(value, window.location.href);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.href;
      }
    } catch (_) {
      return "";
    }

    return "";
  }

  function getYoutubeEmbedUrl(videoId) {
    const encodedId = encodeURIComponent(videoId);
    const params = new URLSearchParams({
      autoplay: "1",
      controls: "0",
      disablekb: "1",
      fs: "0",
      iv_load_policy: "3",
      loop: "1",
      modestbranding: "1",
      mute: "1",
      playsinline: "1",
      rel: "0",
      playlist: videoId
    });

    return `https://www.youtube-nocookie.com/embed/${encodedId}?${params.toString()}`;
  }

  function platformLabel(platform) {
    if (platform === "youtube") {
      return "YouTube";
    }
    if (platform === "instagram") {
      return "Instagram";
    }
    return "Media";
  }
}());
