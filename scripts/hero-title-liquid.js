const vertexShaderSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = (aPosition + 1.0) * 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D uText;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uPointerStrength;
  uniform float uTime;
  varying vec2 vUv;

  vec2 lens(vec2 uv, float x, float y, float radius, float driftX, float driftY, float strength, float speed, float phaseOffset) {
    float phase = phaseOffset + uTime * speed;
    float aspect = uResolution.x / uResolution.y;
    vec2 center = vec2(
      x + sin(phase * 0.58) * driftX,
      y + cos(phase * 0.52) * driftY
    );
    vec2 delta = vec2((uv.x - center.x) * aspect, uv.y - center.y) / radius;
    float dist2 = dot(delta, delta);
    float falloff = exp(-dist2 * 1.1);
    float roundedWave = sin(dist2 * 2.05 - phase * 1.22);
    float orbital = cos((delta.x - delta.y) * 1.1 + phase);
    return vec2(
      delta.x * strength * roundedWave - delta.y * strength * 0.3 * orbital,
      delta.y * strength * 0.34 * roundedWave + delta.x * strength * 0.18 * orbital
    ) * falloff;
  }

  vec2 displacement(vec2 uv) {
    vec2 px = vec2(
      sin(uv.y * 19.0 + uTime * 1.42) * 0.65,
      cos(uv.x * 23.0 - uTime * 1.18) * 0.36
    );

    px += lens(uv, 0.12, 0.49, 0.43, 0.055, 0.075, 7.4, 1.04, 0.2);
    px += lens(uv, 0.26, 0.52, 0.5, 0.052, 0.06, -8.2, 0.88, 1.5);
    px += lens(uv, 0.4, 0.47, 0.45, 0.058, 0.08, 6.8, 1.18, 2.9);
    px += lens(uv, 0.55, 0.53, 0.53, 0.048, 0.07, -7.1, 0.96, 4.1);
    px += lens(uv, 0.7, 0.49, 0.46, 0.065, 0.075, 7.8, 1.1, 5.4);
    px += lens(uv, 0.86, 0.51, 0.48, 0.05, 0.06, -6.8, 1.26, 6.6);
    px += lens(uv, 0.48, 0.5, 0.72, 0.04, 0.055, 3.6, 0.72, 8.1);

    float aspect = uResolution.x / uResolution.y;
    vec2 pointerDelta = vec2((uv.x - uPointer.x) * aspect, uv.y - uPointer.y);
    float pointerDist2 = dot(pointerDelta, pointerDelta);
    float pointerFalloff = exp(-pointerDist2 * 9.0);
    float pointerWave = sin(pointerDist2 * 16.0 - uTime * 4.6);
    vec2 pointerOrbital = vec2(-pointerDelta.y, pointerDelta.x);
    px += (pointerDelta * pointerWave * 19.0 + pointerOrbital * 7.0) * pointerFalloff * uPointerStrength;

    return px;
  }

  void main() {
    vec2 shift = displacement(vUv) / uResolution;
    vec2 sourceUv = vUv - shift;
    float white = texture2D(uText, sourceUv).a;
    float red = texture2D(uText, sourceUv + vec2(1.55, 0.42) / uResolution).a * 0.34;
    float cyan = texture2D(uText, sourceUv - vec2(1.85, 0.52) / uResolution).a * 0.38;
    float alpha = clamp(white + red * 0.34 + cyan * 0.38, 0.0, 1.0);

    if (alpha < 0.015) {
      discard;
    }

    vec3 premul = vec3(white);
    premul += vec3(0.46, 0.02, 0.03) * red;
    premul += vec3(0.0, 0.34, 0.43) * cyan;
    vec3 color = clamp(premul / alpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

(() => {
  const title = document.querySelector("[data-liquid-title]");
  if (!title) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    return;
  }

  const textElement = title.querySelector(".hero-title__text");
  const canvas = title.querySelector(".hero-title__canvas");
  if (!textElement || !canvas) {
    return;
  }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    stencil: false
  });

  if (!gl) {
    return;
  }

  const source = document.createElement("canvas");
  const sourceCtx = source.getContext("2d");
  const program = createProgram(gl, vertexShaderSource, fragmentShaderSource);
  if (!program) {
    return;
  }

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  const resolutionLocation = gl.getUniformLocation(program, "uResolution");
  const pointerLocation = gl.getUniformLocation(program, "uPointer");
  const pointerStrengthLocation = gl.getUniformLocation(program, "uPointerStrength");
  const timeLocation = gl.getUniformLocation(program, "uTime");
  const textureLocation = gl.getUniformLocation(program, "uText");
  const positionBuffer = gl.createBuffer();
  const texture = gl.createTexture();
  const state = {
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1,
    frame: 0,
    visible: true,
    startedAt: performance.now(),
    pointerX: 0.5,
    pointerY: 0.5,
    pointerStrength: 0,
    pointerTarget: 0
  };

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.uniform1i(textureLocation, 0);

  function scheduleLayout() {
    cancelAnimationFrame(state.frame);
    layout();
    state.frame = requestAnimationFrame(render);
  }

  function layout() {
    const rect = title.getBoundingClientRect();
    const style = window.getComputedStyle(title);
    const fontSize = parseFloat(style.fontSize) || 64;
    const lineHeight = parseFloat(style.lineHeight) || fontSize;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const padX = Math.max(36, fontSize * 0.78);
    const padY = Math.max(24, fontSize * 0.72);
    const cssWidth = Math.ceil(rect.width + padX * 2);
    const cssHeight = Math.ceil(rect.height + padY * 2);

    state.cssWidth = cssWidth;
    state.cssHeight = cssHeight;
    state.dpr = dpr;

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;
    canvas.width = Math.ceil(cssWidth * dpr);
    canvas.height = Math.ceil(cssHeight * dpr);
    source.width = canvas.width;
    source.height = canvas.height;

    const font = `${style.fontStyle} ${style.fontWeight} ${fontSize * dpr}px ${style.fontFamily}`;
    const lines = buildLines(title.dataset.liquidTitle || textElement.textContent.trim(), rect.width, font, dpr);
    const lineHeightPx = lineHeight * dpr;
    const centerX = source.width / 2;
    const centerY = source.height / 2;
    const startY = centerY - ((lines.length - 1) * lineHeightPx) / 2;

    sourceCtx.clearRect(0, 0, source.width, source.height);
    sourceCtx.font = font;
    sourceCtx.textAlign = "center";
    sourceCtx.textBaseline = "middle";
    sourceCtx.shadowColor = "transparent";
    sourceCtx.shadowBlur = 0;
    sourceCtx.shadowOffsetY = 0;
    sourceCtx.fillStyle = "#fff";

    lines.forEach((line, index) => {
      sourceCtx.fillText(line, centerX, startY + index * lineHeightPx);
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    title.classList.add("is-liquid-ready");
  }

  function buildLines(text, maxWidth, font, dpr) {
    sourceCtx.font = font;
    const words = text.split(/\s+/);
    const lines = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (current && sourceCtx.measureText(candidate).width / dpr > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) {
      lines.push(current);
    }

    return lines;
  }

  function render(now) {
    if (!state.visible) {
      state.frame = requestAnimationFrame(render);
      return;
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    state.pointerStrength += (state.pointerTarget - state.pointerStrength) * 0.12;
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform2f(pointerLocation, state.pointerX, state.pointerY);
    gl.uniform1f(pointerStrengthLocation, state.pointerStrength);
    gl.uniform1f(timeLocation, (now - state.startedAt) / 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    state.frame = requestAnimationFrame(render);
  }

  function createProgram(context, vertexSource, fragmentSource) {
    const vertexShader = createShader(context, context.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(context, context.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const shaderProgram = context.createProgram();
    context.attachShader(shaderProgram, vertexShader);
    context.attachShader(shaderProgram, fragmentShader);
    context.linkProgram(shaderProgram);

    if (!context.getProgramParameter(shaderProgram, context.LINK_STATUS)) {
      console.warn("Hero title shader failed to link:", context.getProgramInfoLog(shaderProgram));
      context.deleteProgram(shaderProgram);
      return null;
    }

    return shaderProgram;
  }

  function createShader(context, type, sourceCode) {
    const shader = context.createShader(type);
    context.shaderSource(shader, sourceCode);
    context.compileShader(shader);

    if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
      console.warn("Hero title shader failed to compile:", context.getShaderInfoLog(shader));
      context.deleteShader(shader);
      return null;
    }

    return shader;
  }

  const observer = new IntersectionObserver((entries) => {
    state.visible = entries.some((entry) => entry.isIntersecting);
  });
  observer.observe(title);

  const pointerSurface = title.closest(".hero") || title;
  pointerSurface.addEventListener("pointermove", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = 1 - (event.clientY - rect.top) / rect.height;
    const nearText = x > -0.16 && x < 1.16 && y > -0.58 && y < 1.58;

    state.pointerX += (x - state.pointerX) * 0.52;
    state.pointerY += (y - state.pointerY) * 0.52;
    state.pointerTarget = nearText ? 1 : 0;
  }, { passive: true });

  pointerSurface.addEventListener("pointerleave", () => {
    state.pointerTarget = 0;
  });

  window.addEventListener("resize", scheduleLayout);
  window.addEventListener("pageshow", scheduleLayout);
  document.fonts?.ready.then(scheduleLayout).catch(() => {});
  layout();
  state.frame = requestAnimationFrame(render);
})();
