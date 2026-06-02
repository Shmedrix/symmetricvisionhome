(function () {
  const embeds = Array.from(document.querySelectorAll("[data-youtube-on-screen]"));

  if (!embeds.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    embeds.forEach(loadEmbed);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
        loadEmbed(entry.target);
      } else {
        unloadEmbed(entry.target);
      }
    });
  }, {
    threshold: [0, 0.35, 0.7]
  });

  embeds.forEach((embed) => observer.observe(embed));

  function loadEmbed(embed) {
    if (embed.querySelector("iframe")) {
      return;
    }

    const videoId = embed.dataset.videoId;
    if (!videoId) {
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.title = embed.dataset.videoTitle || "YouTube video";
    iframe.loading = "eager";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-presentation");
    iframe.src = getYoutubeEmbedUrl(videoId);
    embed.append(iframe);
  }

  function unloadEmbed(embed) {
    const iframe = embed.querySelector("iframe");
    if (iframe) {
      iframe.remove();
    }
  }

  function getYoutubeEmbedUrl(videoId) {
    const encodedId = encodeURIComponent(videoId);
    const params = new URLSearchParams({
      autoplay: "1",
      controls: "1",
      loop: "1",
      modestbranding: "1",
      mute: "1",
      playsinline: "1",
      rel: "0",
      playlist: videoId
    });

    return `https://www.youtube-nocookie.com/embed/${encodedId}?${params.toString()}`;
  }
}());
