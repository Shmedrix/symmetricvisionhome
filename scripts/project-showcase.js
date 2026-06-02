(function () {
  const DATA_URL = "data/video-carousels.json";
  const roots = Array.from(document.querySelectorAll("[data-project-showcase]"));

  if (!roots.length) {
    return;
  }

  fetch(DATA_URL, { cache: "no-store" })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Project data request failed: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      roots.forEach((root) => renderShowcase(root, data.projects));
    })
    .catch((error) => {
      roots.forEach((root) => {
        root.className = "carousel-error";
        root.textContent = "Projects could not be loaded.";
      });
      console.error(error);
    });

  function renderShowcase(root, projects) {
    if (!projects || !Array.isArray(projects.items) || projects.items.length === 0) {
      root.remove();
      return;
    }

    const wrapper = document.createElement("div");
    wrapper.className = "project-showcase";

    const stage = document.createElement("div");
    stage.className = "project-showcase__stage";
    stage.setAttribute("aria-live", "polite");

    const nav = document.createElement("div");
    nav.className = "project-selector";
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", projects.label || "Larger projects");

    let activeIndex = 0;
    const buttons = projects.items.map((item, index) => {
      const button = createProjectButton(item, index);
      button.addEventListener("click", () => {
        activeIndex = index;
        renderActive(stage, projects.items[activeIndex], activeIndex);
        updateButtons(buttons, activeIndex);
      });
      nav.append(button);
      return button;
    });

    const controls = document.createElement("div");
    controls.className = "project-showcase__controls";
    const previous = createControlButton("<", "Previous project");
    const next = createControlButton(">", "Next project");
    controls.append(previous, next);

    previous.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + projects.items.length) % projects.items.length;
      renderActive(stage, projects.items[activeIndex], activeIndex);
      updateButtons(buttons, activeIndex);
    });

    next.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % projects.items.length;
      renderActive(stage, projects.items[activeIndex], activeIndex);
      updateButtons(buttons, activeIndex);
    });

    renderActive(stage, projects.items[activeIndex], activeIndex);
    updateButtons(buttons, activeIndex);
    wrapper.append(stage, controls, nav);
    root.replaceChildren(wrapper);
  }

  function renderActive(stage, item, index) {
    const media = document.createElement("div");
    media.className = "project-showcase__media";

    const iframe = createEmbed(item);
    if (iframe) {
      media.append(iframe);
    } else {
      const image = document.createElement("img");
      image.alt = "";
      image.src = getSafeMediaSrc(item.thumbnail, getDefaultThumbnail(item));
      media.append(image);
    }

    if (item.warning) {
      const warning = document.createElement("span");
      warning.className = "video-card__warning";
      warning.textContent = item.warning;
      media.append(warning);
    }

    const content = document.createElement("article");
    content.className = "project-showcase__content";

    const eyebrow = document.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = item.platformLabel || platformLabel(item.platform);
    content.append(eyebrow);

    const title = document.createElement("h2");
    title.textContent = item.title;
    content.append(title);

    const summary = document.createElement("p");
    summary.className = "project-showcase__summary";
    summary.textContent = item.description;
    content.append(summary);

    const details = Array.isArray(item.details) ? item.details : [];
    details.forEach((detail) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = detail;
      content.append(paragraph);
    });

    const link = document.createElement("a");
    link.className = "button-link button-link--quiet";
    link.href = getSafeHref(item.url, getDefaultUrl(item));
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Learn More";
    content.append(link);

    stage.replaceChildren(media, content);
    stage.dataset.projectIndex = String(index);
  }

  function createEmbed(item) {
    const src = getEmbedSrc(item);
    if (!src) {
      return null;
    }

    const iframe = document.createElement("iframe");
    iframe.title = item.title;
    iframe.loading = "lazy";
    iframe.allow = "encrypted-media; fullscreen; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
    iframe.src = src;
    return iframe;
  }

  function getEmbedSrc(item) {
    if (item.platform === "youtube" && item.videoId) {
      const encodedId = encodeURIComponent(item.videoId);
      const params = new URLSearchParams({
        controls: "1",
        modestbranding: "1",
        playsinline: "1",
        rel: "0"
      });
      return `https://www.youtube-nocookie.com/embed/${encodedId}?${params.toString()}`;
    }

    if (item.platform === "vimeo" && item.vimeoId) {
      const encodedId = encodeURIComponent(item.vimeoId);
      const params = new URLSearchParams({
        autopause: "0",
        byline: "0",
        portrait: "0",
        title: "0"
      });
      return `https://player.vimeo.com/video/${encodedId}?${params.toString()}`;
    }

    return "";
  }

  function createProjectButton(item, index) {
    const button = document.createElement("button");
    button.className = "project-selector__button";
    button.type = "button";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-label", item.title);

    const number = document.createElement("span");
    number.textContent = String(index + 1).padStart(2, "0");
    button.append(number);

    const title = document.createElement("strong");
    title.textContent = item.title;
    button.append(title);

    const meta = document.createElement("em");
    meta.textContent = item.platformLabel || platformLabel(item.platform);
    button.append(meta);

    return button;
  }

  function updateButtons(buttons, activeIndex) {
    buttons.forEach((button, index) => {
      const isActive = index === activeIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
      button.tabIndex = isActive ? 0 : -1;
    });
  }

  function createControlButton(label, title) {
    const button = document.createElement("button");
    button.className = "carousel-button";
    button.type = "button";
    button.textContent = label;
    button.title = title;
    button.setAttribute("aria-label", title);
    return button;
  }

  function getDefaultUrl(item) {
    if (item.platform === "youtube" && item.videoId) {
      return `https://www.youtube.com/watch?v=${encodeURIComponent(item.videoId)}`;
    }
    if (item.platform === "vimeo" && item.vimeoId) {
      return `https://vimeo.com/${encodeURIComponent(item.vimeoId)}`;
    }
    return "links.html";
  }

  function getDefaultThumbnail(item) {
    if (item.platform === "youtube" && item.videoId) {
      return `https://i.ytimg.com/vi/${encodeURIComponent(item.videoId)}/hqdefault.jpg`;
    }
    return item.thumbnail || "RGBDistortLogo.png";
  }

  function getSafeHref(value, fallback) {
    return getSafeUrl(value) || getSafeUrl(fallback) || "links.html";
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

  function platformLabel(platform) {
    if (platform === "youtube") {
      return "YouTube";
    }
    if (platform === "vimeo") {
      return "Vimeo";
    }
    return "Project";
  }
}());
