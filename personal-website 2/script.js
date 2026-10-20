const ambientCanvas = document.querySelector("#ambient-canvas");
const ambientCtx = ambientCanvas.getContext("2d");
const processingCanvas = document.querySelector("#processing-canvas");
const processingCtx = processingCanvas?.getContext("2d") || null;
const densityControl = document.querySelector("#density-control");
const motionControl = document.querySelector("#motion-control");
const resetButton = document.querySelector("#reset-sketch");
const pauseButton = document.querySelector("#pause-sketch");
const randomizeButton = document.querySelector("#randomize-sketch");
const densityValue = document.querySelector("#density-value");
const motionValue = document.querySelector("#motion-value");
const sketchStatus = document.querySelector("#sketch-status");
const stageLoading = document.querySelector(".stage-loading");
const typewriter = document.querySelector("#typewriter");
const portfolioTabs = document.querySelectorAll(".portfolio-tab");
const portfolioPanels = document.querySelectorAll("[data-category-panel]");
const miniSketches = document.querySelectorAll(".mini-sketch");
const homeSection = document.querySelector("#home");
const sections = [...document.querySelectorAll("main > .section[id]")];
const sectionLinks = [...document.querySelectorAll('a[href^="#"]')];
const deckDots = [...document.querySelectorAll("[data-page-dot]")];
const transitionLayer = document.querySelector(".page-transition");
const transitionKicker = document.querySelector(".transition-kicker");
const transitionTitle = document.querySelector(".transition-title");
const profilePhoto = document.querySelector(".profile-photo");
const heroTitle = document.querySelector(".glitch-title");
const heroEmail = document.querySelector(".hero-email");
const contactEmailButtons = document.querySelectorAll("[data-copy-email]");
const heroOrbit = document.querySelector(".hero-orbit");
const orbitRings = document.querySelector(".orbit-rings");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

const roles = [
  "HCI Researcher",
  "UI/UX Designer",
  "Developer",
  "Generative Artist",
  "Interaction Designer",
];
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
let ambientDots = [];
let processingSeed = Math.random() * 1000;
let processingPaused = false;
let processingFrame = null;
let activeSectionId = location.hash ? location.hash.slice(1) : "home";
let transitionRunning = false;
let queuedTransition = null;
let wheelBoundaryDirection = 0;
let wheelBoundaryReady = false;
let wheelGestureEndTimer = null;
let touchStartY = 0;
let touchStartX = 0;
let touchBoundaryDirection = 0;
let touchBoundaryAt = 0;

const sectionScrollPositions = new Map();

const sectionOrder = sections.map((section) => section.id);
const sectionLabels = {
  home: "Home",
  about: "About",
  experience: "Experience",
  research: "Research",
  portfolio: "Portfolio",
  processing: "Processing",
  contact: "Contact",
};

function fitCanvas(canvas, ctx) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: rect.width, height: rect.height };
}

function createAmbient() {
  const { width, height } = fitCanvas(ambientCanvas, ambientCtx);
  ambientDots = Array.from({ length: 80 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.16,
    vy: (Math.random() - 0.5) * 0.16,
  }));
}

function drawAmbient() {
  const { width, height } = fitCanvas(ambientCanvas, ambientCtx);
  ambientCtx.clearRect(0, 0, width, height);
  ambientCtx.fillStyle = "#000";
  ambientCtx.fillRect(0, 0, width, height);
  ambientDots.forEach((dot) => {
    dot.x += dot.vx;
    dot.y += dot.vy;
    if (dot.x < 0 || dot.x > width) dot.vx *= -1;
    if (dot.y < 0 || dot.y > height) dot.vy *= -1;
    ambientCtx.fillStyle = "rgba(244,244,239,.42)";
    ambientCtx.fillRect(dot.x, dot.y, 1.3, 1.3);
  });
  requestAnimationFrame(drawAmbient);
}

function tickTypewriter() {
  const word = roles[roleIndex];
  typewriter.textContent = word.slice(0, charIndex);
  typewriter.parentElement?.style.setProperty("--typewriter-chars", String(Math.max(charIndex, 1)));
  if (!deleting && charIndex < word.length) {
    charIndex += 1;
  } else if (!deleting) {
    deleting = true;
    window.setTimeout(tickTypewriter, 1100);
    return;
  } else if (charIndex > 0) {
    charIndex -= 1;
  } else {
    deleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
  }
  window.setTimeout(tickTypewriter, deleting ? 38 : 74);
}

function setPortfolioCategory(category) {
  portfolioTabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.category === category));
  portfolioPanels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.categoryPanel === category));
}

function updateHomeState() {
  document.body.classList.toggle("is-home", activeSectionId === "home");
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getSection(id) {
  return sections.find((section) => section.id === id);
}

function getSectionDirection(nextId) {
  const currentIndex = Math.max(0, sectionOrder.indexOf(activeSectionId));
  const nextIndex = Math.max(0, sectionOrder.indexOf(nextId));
  if (nextIndex < currentIndex) return "back";
  if (nextIndex === currentIndex) return "same";
  return "forward";
}

function setActiveSection(id) {
  resetWheelBoundary();
  touchBoundaryDirection = 0;
  touchBoundaryAt = 0;
  activeSectionId = id || "home";
  if (activeSectionId !== "home") resetHeroOrbitErase();
  document.body.classList.toggle("is-processing", activeSectionId === "processing");
  sectionLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.toggle("is-active", href === `#${activeSectionId}`);
  });
  deckDots.forEach((dot) => {
    dot.classList.toggle("is-active", dot.dataset.pageDot === activeSectionId);
  });
  updateHomeState();
}

function focusSection(section) {
  if (!section) return;
  const previousTabIndex = section.getAttribute("tabindex");
  section.setAttribute("tabindex", "-1");
  section.focus({ preventScroll: true });
  if (previousTabIndex === null) {
    section.addEventListener("blur", () => section.removeAttribute("tabindex"), { once: true });
  }
}

function applyDeckState(id, direction = "forward") {
  const currentIndex = Math.max(0, sectionOrder.indexOf(id));
  sections.forEach((section, index) => {
    section.classList.remove(
      "is-current",
      "is-before",
      "is-after",
      "is-entering-forward",
      "is-entering-back",
      "is-exiting-forward",
      "is-exiting-back",
    );

    if (index === currentIndex) {
      section.classList.add("is-current", direction === "back" ? "is-entering-back" : "is-entering-forward");
      const savedScroll = sectionScrollPositions.get(section.id) || 0;
      section.scrollTop = savedScroll;
      window.setTimeout(() => section.classList.remove("is-entering-forward", "is-entering-back"), 900);
    } else if (index < currentIndex) {
      section.classList.add("is-before");
    } else {
      section.classList.add("is-after");
    }
  });
  updateHomeState();
}

function activateSection(section, direction = "forward") {
  if (!section) return;
  const current = getSection(activeSectionId);
  if (current) {
    sectionScrollPositions.set(current.id, current.scrollTop);
    current.classList.add(direction === "back" ? "is-exiting-back" : "is-exiting-forward");
  }
  applyDeckState(section.id, direction);
}

function markArriving(section) {
  if (!section || reduceMotionQuery.matches) return;
  section.classList.remove("section-arriving");
  void section.offsetWidth;
  section.classList.add("section-arriving");
  section.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
  window.setTimeout(() => section.classList.remove("section-arriving"), 900);
}

function releaseProfileStars() {
  if (!profilePhoto) return;
  const starCount = reduceMotionQuery.matches ? 8 : 22;
  const rect = profilePhoto.getBoundingClientRect();
  const starColors = ["#fff4a8", "#ffd1dc", "#bde7ff", "#d6c1ff", "#bfffd2", "#ffffff"];

  for (let index = 0; index < starCount; index += 1) {
    const star = document.createElement("span");
    const x = 10 + Math.random() * 80;
    const drift = (Math.random() - 0.5) * rect.width * 0.32;
    const fall = rect.height * (0.7 + Math.random() * 0.42);
    const size = 17 + Math.random() * 22;
    const duration = reduceMotionQuery.matches ? 720 : 1800 + Math.random() * 1440;

    star.className = "falling-star";
    star.style.setProperty("--star-color", starColors[index % starColors.length]);
    star.style.setProperty("--star-x", `${x}%`);
    star.style.setProperty("--star-drift", `${drift}px`);
    star.style.setProperty("--star-fall", `${fall}px`);
    star.style.setProperty("--star-size", `${size}px`);
    star.style.setProperty("--star-duration", `${duration}ms`);
    star.style.setProperty("--star-rotate", `${Math.random() * 260 - 130}deg`);
    star.style.animationDelay = `${index * (reduceMotionQuery.matches ? 10 : 24)}ms`;
    profilePhoto.appendChild(star);
    star.addEventListener("animationend", () => star.remove(), { once: true });
  }
}

function copyEmailToClipboard(email = heroEmail?.dataset.email) {
  if (!email) return;
  const fallbackCopy = () => {
    const textarea = document.createElement("textarea");
    textarea.value = email;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(email).catch(fallbackCopy);
  } else {
    fallbackCopy();
  }
}

function showEmailCopiedState(target = heroEmail) {
  if (!target) return;
  const status = target.querySelector("em");
  target.classList.add("is-copied");
  if (status) status.textContent = "Copied";
  window.setTimeout(() => {
    target.classList.remove("is-copied");
    if (status) status.textContent = "Click to copy";
  }, 1400);
}

function buildHeroOrbit() {
  if (!orbitRings) return;
  const rings = [
    { text: "let u=human;ux.map(f);", size: 112, font: 1.24, speed: 16, alpha: 0.3, start: 4 },
    { text: "if(ai){make();}hci.observe();", size: 136, font: 1.3, speed: 18, alpha: 0.34, start: 17 },
    { text: "render(ui);test(flow);", size: 164, font: 1.36, speed: 21, alpha: 0.38, start: 9 },
    { text: "p5.draw();motion.tick();", size: 196, font: 1.42, speed: 25, alpha: 0.43, start: 23 },
    { text: "proto.loop();feedback.sync();", size: 232, font: 1.5, speed: 30, alpha: 0.48, start: 3 },
    { text: "function empathy(c){return clarity;}", size: 272, font: 1.58, speed: 36, alpha: 0.53, start: 14 },
    { text: "while(make){code+motion+ux;}", size: 316, font: 1.66, speed: 43, alpha: 0.58, start: 27 },
    { text: "research.data.map(experience);", size: 366, font: 1.76, speed: 51, alpha: 0.64, start: 6 },
    { text: "interface.compose(system,user);", size: 424, font: 1.86, speed: 60, alpha: 0.7, start: 20 },
    { text: "creative.tech.render(portfolio);", size: 490, font: 1.98, speed: 70, alpha: 0.76, start: 11 },
    { text: "input.signal=>emotion.stage();", size: 564, font: 2.1, speed: 82, alpha: 0.82, start: 25 },
    { text: "system.visualize(memory);", size: 648, font: 2.22, speed: 95, alpha: 0.88, start: 7 },
    { text: "const page=route.next();", size: 742, font: 2.34, speed: 110, alpha: 0.92, start: 19 },
    { text: "canvas.reframe(content);", size: 848, font: 2.46, speed: 126, alpha: 0.96, start: 2 },
    { text: "terminal.run(design.system);", size: 968, font: 2.58, speed: 144, alpha: 0.98, start: 15 },
    { text: "for(work of portfolio){ship(work);}", size: 1104, font: 2.72, speed: 164, alpha: 1, start: 29 },
  ];
  const svgNs = "http://www.w3.org/2000/svg";
  orbitRings.innerHTML = "";
  rings.forEach((ring, ringIndex) => {
    const ringElement = document.createElement("div");
    const svg = document.createElementNS(svgNs, "svg");
    const defs = document.createElementNS(svgNs, "defs");
    const path = document.createElementNS(svgNs, "path");
    const text = document.createElementNS(svgNs, "text");
    const textPath = document.createElementNS(svgNs, "textPath");
    const pathId = `orbit-path-${ringIndex}`;
    const repeatedText = `${ring.text} `.repeat(Math.max(56, Math.round(ring.size / 7)));

    ringElement.className = "orbit-ring";
    ringElement.style.setProperty("--ring-size", `${ring.size}px`);
    ringElement.style.setProperty("--ring-speed", `${ring.speed}s`);
    ringElement.style.setProperty("--ring-font-size", `${ring.font}px`);
    ringElement.style.setProperty("--ring-alpha", `${ring.alpha}`);
    ringElement.style.setProperty("--ring-pulse-speed", `${1500 + ringIndex * 180}ms`);
    ringElement.style.animationDelay = `${ringIndex * -2.35}s`;

    svg.setAttribute("viewBox", "0 0 100 100");
    path.setAttribute("id", pathId);
    path.setAttribute("d", "M 50 50 m -42 0 a 42 42 0 1 1 84 0 a 42 42 0 1 1 -84 0");
    textPath.setAttribute("href", `#${pathId}`);
    textPath.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", `#${pathId}`);
    textPath.setAttribute("startOffset", `${ring.start}%`);
    textPath.textContent = repeatedText;

    defs.appendChild(path);
    text.appendChild(textPath);
    svg.appendChild(defs);
    svg.appendChild(text);
    ringElement.appendChild(svg);
    orbitRings.appendChild(ringElement);
  });
}

function resetHeroOrbitErase() {}

function releaseHomeConstellation(event, sourceElement) {
  if (!homeSection) return;
  const sectionRect = homeSection.getBoundingClientRect();
  const sourceRect = sourceElement?.getBoundingClientRect?.();
  const x = event?.clientX ?? (sourceRect ? sourceRect.left + sourceRect.width / 2 : sectionRect.width * 0.5);
  const y = event?.clientY ?? (sourceRect ? sourceRect.top + sourceRect.height / 2 : sectionRect.height * 0.5);
  const colors = ["#fff4a8", "#ffd1dc", "#bde7ff", "#d6c1ff", "#bfffd2"];
  const burstCount = reduceMotionQuery.matches ? 2 : 5;

  for (let index = 0; index < burstCount; index += 1) {
    const burst = document.createElement("span");
    const color = colors[index % colors.length];
    const size = 120 + Math.random() * 180;
    const duration = reduceMotionQuery.matches ? 520 : 1400 + Math.random() * 600;
    burst.className = "home-constellation";
    burst.style.setProperty("--constellation-x", `${x - sectionRect.left}px`);
    burst.style.setProperty("--constellation-y", `${y - sectionRect.top}px`);
    burst.style.setProperty("--constellation-size", `${size}px`);
    burst.style.setProperty("--constellation-color", color);
    burst.style.setProperty("--constellation-duration", `${duration}ms`);
    burst.style.setProperty("--constellation-rotate", `${Math.random() * 180}deg`);

    const sparkCount = reduceMotionQuery.matches ? 3 : 7;
    for (let sparkIndex = 0; sparkIndex < sparkCount; sparkIndex += 1) {
      const spark = document.createElement("i");
      const angle = Math.random() * Math.PI * 2;
      const distance = 36 + Math.random() * size * 0.42;
      spark.className = "home-spark";
      spark.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      spark.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      spark.style.setProperty("--spark-size", `${10 + Math.random() * 18}px`);
      spark.style.animationDelay = `${sparkIndex * 34}ms`;
      burst.appendChild(spark);
    }

    homeSection.appendChild(burst);
    window.setTimeout(() => burst.remove(), duration + 420);
  }
}

function setTransitionOrigin(trigger) {
  let x = 50;
  let y = 50;
  if (trigger?.getBoundingClientRect) {
    const rect = trigger.getBoundingClientRect();
    x = ((rect.left + rect.width / 2) / window.innerWidth) * 100;
    y = ((rect.top + rect.height / 2) / window.innerHeight) * 100;
  }
  const clampedX = Math.min(88, Math.max(12, x));
  const clampedY = Math.min(82, Math.max(18, y));
  document.documentElement.style.setProperty("--transition-x", `${clampedX}%`);
  document.documentElement.style.setProperty("--transition-y", `${clampedY}%`);
  transitionLayer.style.setProperty("--transition-x", `${clampedX}%`);
  transitionLayer.style.setProperty("--transition-y", `${clampedY}%`);
}

function finishTransition() {
  document.body.classList.remove("is-transitioning");
  transitionLayer.classList.remove("is-active", "is-covering", "is-revealing");
  transitionLayer.removeAttribute("data-direction");
  transitionRunning = false;
  if (queuedTransition) {
    const next = queuedTransition;
    queuedTransition = null;
    transitionToSection(next.id, next.options);
  }
}

async function runLensTransition({ label, direction, targetSection, trigger, beforeReveal }) {
  if (reduceMotionQuery.matches) {
    beforeReveal();
    markArriving(targetSection);
    return;
  }

  setTransitionOrigin(trigger);
  document.body.classList.add("is-transitioning");
  transitionLayer.dataset.direction = direction;
  transitionKicker.textContent = direction === "back" ? "Return Focus" : "Focus Shift";
  transitionTitle.textContent = label;
  transitionTitle.classList.toggle("is-long", label.length > 8);
  transitionLayer.classList.add("is-active", "is-covering");

  await wait(window.innerWidth < 900 ? 360 : 720);
  beforeReveal();
  markArriving(targetSection);

  transitionLayer.classList.remove("is-covering");
  transitionLayer.classList.add("is-revealing");
  await wait(window.innerWidth < 900 ? 420 : 820);
}

async function transitionToSection(id, options = {}) {
  const section = getSection(id);
  if (!section) return;

  if (transitionRunning) {
    queuedTransition = { id, options };
    return;
  }

  if (id === activeSectionId && !options.force) {
    section.scrollTop = 0;
    return;
  }

  transitionRunning = true;
  const direction = options.direction || getSectionDirection(id);
  const label = sectionLabels[id] || id;

  await runLensTransition({
    label,
    direction,
    targetSection: section,
    trigger: options.trigger,
    beforeReveal: () => {
      activateSection(section, direction);
      setActiveSection(id);
      if (options.push !== false) {
        history.pushState({ section: id }, "", `#${id}`);
      }
      focusSection(section);
    },
  });

  finishTransition();
}

async function transitionPortfolioCategory(category, trigger) {
  const currentTab = document.querySelector(".portfolio-tab.is-active");
  if (currentTab?.dataset.category === category) return;

  if (transitionRunning) {
    queuedTransition = { id: "portfolio", options: { force: true } };
    return;
  }

  if (trigger) {
    trigger.classList.add("is-pressed");
    window.setTimeout(() => trigger.classList.remove("is-pressed"), 180);
  }

  transitionRunning = true;
  const tabLabel = trigger?.textContent?.trim() || "Portfolio";
  await runLensTransition({
    label: tabLabel,
    direction: "forward",
    targetSection: document.querySelector("#portfolio"),
    trigger,
    beforeReveal: () => {
      setPortfolioCategory(category);
      setActiveSection("portfolio");
      history.replaceState({ section: "portfolio" }, "", "#portfolio");
      activateSection(document.querySelector("#portfolio"), "forward");
      document.querySelector(".portfolio-panels").classList.remove("is-switching");
      void document.querySelector(".portfolio-panels").offsetWidth;
      document.querySelector(".portfolio-panels").classList.add("is-switching");
      window.setTimeout(() => document.querySelector(".portfolio-panels").classList.remove("is-switching"), 720);
    },
  });
  finishTransition();
}

function updateProcessingControls() {
  densityValue.textContent = densityControl.value;
  motionValue.textContent = motionControl.value;
}

function setProcessingPaused(paused) {
  processingPaused = paused;
  pauseButton.textContent = paused ? "Play" : "Pause";
  pauseButton.setAttribute("aria-pressed", String(paused));
  sketchStatus.textContent = paused ? "Paused" : "Live";
  if (!paused && processingFrame === null) {
    processingFrame = requestAnimationFrame(drawProcessing);
  }
}

function randomizeProcessing() {
  densityControl.value = Math.floor(18 + Math.random() * 70);
  motionControl.value = Math.floor(2 + Math.random() * 10);
  processingSeed = Math.random() * 1000;
  updateProcessingControls();
  if (processingPaused) {
    drawProcessing(performance.now());
  }
}

function drawProcessing(time = 0) {
  const { width, height } = fitCanvas(processingCanvas, processingCtx);
  const density = Number(densityControl.value);
  const motion = Number(motionControl.value) * 0.0018;
  const centerX = width / 2;
  const centerY = height / 2;
  const minSide = Math.min(width, height);

  processingCtx.fillStyle = "#050505";
  processingCtx.fillRect(0, 0, width, height);
  processingCtx.strokeStyle = "rgba(244,244,239,.82)";
  processingCtx.lineWidth = 1;

  for (let i = 0; i < density; i += 1) {
    const angle = (i / density) * Math.PI * 2 + time * motion + processingSeed;
    const wobble = Math.sin(time * motion * 2 + i * 0.72 + processingSeed) * minSide * 0.07;
    const radius = minSide * (0.12 + i / density * 0.42) + wobble;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle * 1.4) * radius * 0.62;
    processingCtx.beginPath();
    processingCtx.arc(x, y, 5 + (i % 9), 0, Math.PI * 2);
    processingCtx.stroke();
    processingCtx.beginPath();
    processingCtx.moveTo(centerX, centerY);
    processingCtx.lineTo(x, y);
    processingCtx.stroke();
  }
  stageLoading?.classList.add("is-hidden");
  processingFrame = null;
  if (!processingPaused) {
    processingFrame = requestAnimationFrame(drawProcessing);
  }
}

function drawMiniSketch(canvas, index, time = 0) {
  const ctx = canvas.getContext("2d");
  const { width, height } = fitCanvas(canvas, ctx);
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(244,244,239,.82)";
  ctx.lineWidth = 1;
  const cols = index === 2 ? 12 : 32;
  for (let i = 0; i < cols; i += 1) {
    const t = i / cols;
    const x = width * t;
    const y = height * 0.5 + Math.sin(time * 0.001 + i * 0.6 + index) * height * 0.28;
    ctx.beginPath();
    if (index === 0) {
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(width * 0.35, y, width * 0.65, height - y, width - x, height);
    } else if (index === 1) {
      ctx.arc(width / 2, height / 2, 8 + i * 4 + Math.sin(time * 0.002) * 8, 0, Math.PI * 2);
    } else {
      ctx.rect((i % 4) * width / 4 + 10, Math.floor(i / 4) * height / 3 + 10, width / 4 - 20, height / 3 - 20);
    }
    ctx.stroke();
  }
  requestAnimationFrame((next) => drawMiniSketch(canvas, index, next));
}

sectionLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || hash === "#" || !hash.startsWith("#")) return;
    const id = hash.slice(1);
    if (!getSection(id)) return;
    event.preventDefault();
    transitionToSection(id, { push: true, trigger: link });
  });
});

function canScrollCurrentSection(deltaY) {
  const section = getSection(activeSectionId);
  if (!section) return false;
  const maxScroll = section.scrollHeight - section.clientHeight;
  if (maxScroll <= 4) return false;
  if (deltaY > 0) return section.scrollTop < maxScroll - 8;
  return section.scrollTop > 8;
}

function navigateDeck(direction, trigger) {
  const currentIndex = Math.max(0, sectionOrder.indexOf(activeSectionId));
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= sectionOrder.length) return;
  const nextId = sectionOrder[nextIndex];
  transitionToSection(nextId, {
    push: true,
    trigger,
    direction: direction < 0 ? "back" : "forward",
  });
}

function resetWheelBoundary() {
  wheelBoundaryDirection = 0;
  wheelBoundaryReady = false;
  if (wheelGestureEndTimer) {
    window.clearTimeout(wheelGestureEndTimer);
    wheelGestureEndTimer = null;
  }
}

window.addEventListener(
  "wheel",
  (event) => {
    if (transitionRunning) {
      event.preventDefault();
      return;
    }

    if (Math.abs(event.deltaY) < 10) return;

    if (canScrollCurrentSection(event.deltaY)) {
      resetWheelBoundary();
      return;
    }

    const direction = event.deltaY > 0 ? 1 : -1;

    event.preventDefault();

    if (wheelBoundaryDirection !== direction) {
      resetWheelBoundary();
      wheelBoundaryDirection = direction;
    }

    if (wheelBoundaryReady) {
      resetWheelBoundary();
      navigateDeck(direction, event.target);
      return;
    }

    if (wheelGestureEndTimer) window.clearTimeout(wheelGestureEndTimer);
    wheelGestureEndTimer = window.setTimeout(() => {
      wheelBoundaryReady = true;
      wheelGestureEndTimer = null;
    }, 80);
  },
  { passive: false },
);

window.addEventListener("keydown", (event) => {
  const activeElement = document.activeElement;
  const tagName = activeElement?.tagName;
  if (event.defaultPrevented) return;
  if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A", "VIDEO", "AUDIO"].includes(tagName)) return;
  if (activeElement?.classList?.contains("processing-live-canvas")) return;

  if (["ArrowDown", "PageDown", " "].includes(event.key)) {
    event.preventDefault();
    navigateDeck(1, document.activeElement);
  } else if (["ArrowUp", "PageUp"].includes(event.key)) {
    event.preventDefault();
    navigateDeck(-1, document.activeElement);
  } else if (event.key === "Home") {
    event.preventDefault();
    transitionToSection("home", { push: true, direction: "back", trigger: document.activeElement });
  } else if (event.key === "End") {
    event.preventDefault();
    transitionToSection("contact", { push: true, direction: "forward", trigger: document.activeElement });
  }
});

window.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  touchStartY = touch.clientY;
  touchStartX = touch.clientX;
}, { passive: true });

window.addEventListener("touchend", (event) => {
  const touch = event.changedTouches[0];
  const deltaY = touchStartY - touch.clientY;
  const deltaX = touchStartX - touch.clientX;
  if (Math.abs(deltaY) < 110 || Math.abs(deltaY) < Math.abs(deltaX) * 1.35) return;
  if (canScrollCurrentSection(deltaY)) {
    touchBoundaryDirection = 0;
    touchBoundaryAt = 0;
    return;
  }

  const direction = deltaY > 0 ? 1 : -1;
  const now = Date.now();
  const isFreshBoundarySwipe = touchBoundaryDirection !== direction
    || now > touchBoundaryAt + 4000;

  if (isFreshBoundarySwipe) {
    touchBoundaryDirection = direction;
    touchBoundaryAt = now;
    return;
  }

  touchBoundaryDirection = 0;
  touchBoundaryAt = 0;
  navigateDeck(direction, event.target);
}, { passive: true });

portfolioTabs.forEach((tab) => {
  tab.addEventListener("click", () => transitionPortfolioCategory(tab.dataset.category, tab));
});

document.querySelectorAll(".project-card, .media-card").forEach((card) => {
  card.addEventListener("pointerdown", () => card.classList.add("is-pressed"));
  card.addEventListener("pointerup", () => window.setTimeout(() => card.classList.remove("is-pressed"), 120));
  card.addEventListener("pointerleave", () => card.classList.remove("is-pressed"));
});

function releaseVisualAlerts(card) {
  const colors = ["#ff3b30", "#ffcc00", "#34c759", "#0a84ff", "#bf5af2", "#ff9f0a"];
  for (let i = 0; i < 34; i += 1) {
    const mark = document.createElement("span");
    mark.className = "visual-alert-mark";
    mark.textContent = "!";
    mark.style.setProperty("--alert-x", `${8 + Math.random() * 84}%`);
    mark.style.setProperty("--alert-color", colors[i % colors.length]);
    mark.style.setProperty("--alert-size", `${18 + Math.random() * 22}px`);
    mark.style.setProperty("--alert-drift", `${(Math.random() - 0.5) * 140}px`);
    mark.style.setProperty("--alert-fall", `${card.clientHeight * (0.55 + Math.random() * 0.45)}px`);
    mark.style.setProperty("--alert-rotate", `${(Math.random() - 0.5) * 260}deg`);
    mark.style.animationDelay = `${Math.random() * 220}ms`;
    card.appendChild(mark);
    window.setTimeout(() => mark.remove(), 2600);
  }
}

function setVisualCardMinimized(card, minimized) {
  card.classList.toggle("is-minimized", minimized);
  const minimize = card.querySelector(".visual-minimize");
  const expand = card.querySelector(".visual-expand");
  if (minimize) {
    minimize.setAttribute("aria-label", minimized ? "Restore card" : "Minimize card");
  }
  if (expand) {
    expand.setAttribute("aria-label", minimized ? "Restore card" : "Open project");
  }
}

function getVisualCardLink(card) {
  return card.querySelector(".visual-info-topline a");
}

function toggleVisualSection(button) {
  const key = button.dataset.visualToggle;
  const expanded = button.getAttribute("aria-expanded") !== "false";
  const nextExpanded = !expanded;
  const card = button.closest(".visual-info-card");
  if (!card || !key) return;

  button.setAttribute("aria-expanded", String(nextExpanded));
  const controlled = [];
  let node = button.nextElementSibling;
  while (node && !node.classList.contains("visual-panel-label")) {
    controlled.push(node);
    node = node.nextElementSibling;
  }
  controlled.forEach((element) => element.classList.toggle("visual-section-collapsed", !nextExpanded));
}

document.querySelectorAll(".visual-info-card").forEach((card) => {
  card.querySelector(".visual-close")?.addEventListener("click", (event) => {
    event.preventDefault();
    releaseVisualAlerts(card);
  });

  card.querySelector(".visual-minimize")?.addEventListener("click", (event) => {
    event.preventDefault();
    setVisualCardMinimized(card, !card.classList.contains("is-minimized"));
  });

  card.querySelector(".visual-expand")?.addEventListener("click", (event) => {
    event.preventDefault();
    if (card.classList.contains("is-minimized")) {
      setVisualCardMinimized(card, false);
      return;
    }
    const link = getVisualCardLink(card);
    if (link) {
      window.open(link.href, link.target || "_self", "noreferrer");
    }
  });

  card.querySelectorAll("[data-visual-toggle]").forEach((button) => {
    button.addEventListener("click", () => toggleVisualSection(button));
  });
});

document.querySelectorAll("[data-audio-toggle]").forEach((button) => {
  const audio = document.getElementById(button.dataset.audioToggle);
  if (!audio) return;

  button.addEventListener("click", async (event) => {
    event.preventDefault();
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        return;
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => {
    button.textContent = "Pause Memory Audio";
    button.setAttribute("aria-pressed", "true");
  });

  audio.addEventListener("pause", () => {
    button.textContent = "Play Memory Audio";
    button.setAttribute("aria-pressed", "false");
  });
});

const processingCanvases = Array.from(document.querySelectorAll(".processing-live-canvas"));
const processingDemoStates = new WeakMap();

function loadProcessingImage(src) {
  if (!src) return null;
  const image = new Image();
  image.src = src;
  return image;
}

function parseProcessingCsv(text) {
  const rows = text.trim().split(/\r?\n/);
  const headers = rows.shift().split(",").map((header) => header.trim());
  return rows.map((row) => {
    const values = row.split(",");
    return headers.reduce((record, header, index) => {
      record[header] = values[index]?.trim() ?? "";
      return record;
    }, {});
  });
}

function makeFallbackCarRows(count = 392) {
  const origins = ["US", "Japan", "Europe"];
  return Array.from({ length: count }, (_, index) => ({
    model: `car-${String(index + 1).padStart(3, "0")}`,
    MPG: String(12 + (index * 7) % 32),
    cylinders: String([3, 4, 5, 6, 8][index % 5]),
    horsepower: String(65 + (index * 13) % 170),
    weight: String(1800 + (index * 91) % 3400),
    year: String(70 + (index % 13)),
    origin: origins[index % origins.length]
  }));
}

function fitProcessingCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, Math.round(rect.width * dpr));
  const height = Math.max(240, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}

function updateProcessingModeLabel(canvas, state) {
  const label = canvas.closest("figure")?.querySelector("[data-processing-mode]");
  if (!label || state.demo !== "portraiture") return;
  label.textContent = ["Particle portrait", "Vector threads", "Scanline split"][state.mode] || "Particle portrait";
}

function initProcessingDemo(canvas) {
  const state = {
    demo: canvas.dataset.processingDemo,
    frame: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    active: false,
    clicked: 0,
    mode: 0,
    keys: new Set(),
    player: { x: 0.5, y: 0.82 },
    bullets: [],
    enemies: [],
    enemyBullets: [],
    ammoPickups: [],
    score: 0,
    highScore: 0,
    health: 5,
    ammo: 10,
    level: 1,
    levelTime: 30,
    levelTarget: 10,
    gameMode: "menu",
    shooterMode: "challenge",
    page: 0,
    tileSize: 20,
    csvRows: [],
    seed: Math.random() * 1000,
    image: null,
    bg: null,
    sprites: {},
    sounds: {}
  };
  const gameStatus = canvas.closest("figure")?.querySelector(".processing-game-status");
  const projectCard = canvas.closest(".processing-project-card");

  state.image = loadProcessingImage(canvas.dataset.image);
  state.bg = loadProcessingImage(canvas.dataset.bg);

  ["player", "enemy", "bullet", "enemyBullet", "ammo"].forEach((key) => {
    state.sprites[key] = loadProcessingImage(canvas.dataset[key]);
  });

  if (canvas.dataset.scoreSound) {
    state.sounds.score = new Audio(canvas.dataset.scoreSound);
  }

  if (canvas.dataset.hitSound) {
    state.sounds.hit = new Audio(canvas.dataset.hitSound);
  }

  if (canvas.dataset.csv) {
    fetch(canvas.dataset.csv)
      .then((response) => response.text())
      .then((text) => {
        state.csvRows = parseProcessingCsv(text);
      })
      .catch(() => {
        state.csvRows = makeFallbackCarRows();
      });
  } else if (state.demo === "lion-car") {
    state.csvRows = makeFallbackCarRows();
  }

  canvas.addEventListener("pointerenter", () => {
    state.active = true;
  });

  canvas.addEventListener("pointerleave", () => {
    state.active = false;
  });

  const updatePointer = (event) => {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    state.mouseY = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    if (state.demo === "assignment-shooter") {
      state.player.x = state.mouseX;
    }
  };

  canvas.addEventListener("pointermove", updatePointer);

  canvas.addEventListener("pointerdown", (event) => {
    updatePointer(event);
    canvas.focus({ preventScroll: true });
    if (state.demo === "assignment-shooter" && gameStatus) {
      gameStatus.textContent = "Keyboard active — arrows / WASD + Space";
    }
    state.clicked += 1;
    if (state.demo === "lion-car") {
      const totalPages = Math.max(1, Math.ceil((state.csvRows.length || 70) / 35));
      state.page = (state.page + 1) % totalPages;
    } else if (state.demo === "assignment-shooter") {
      handleShooterPointer(state);
    } else {
      state.mode = (state.mode + 1) % 3;
      updateProcessingModeLabel(canvas, state);
    }
    drawProcessingDemo(canvas);
  });

  canvas.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  canvas.addEventListener("keydown", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d", " "];
    if (state.demo === "portraiture" && ["1", "2", "3"].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      state.mode = Number(key) - 1;
      updateProcessingModeLabel(canvas, state);
      drawProcessingDemo(canvas);
      return;
    }
    if (gameKeys.includes(key)) {
      event.preventDefault();
      event.stopPropagation();
      state.keys.add(key);
      if (key === " " && state.demo === "assignment-shooter") {
        shooterFire(state);
      }
    }
  });

  canvas.addEventListener("keyup", (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d", " "].includes(key)) {
      event.preventDefault();
      event.stopPropagation();
    }
    state.keys.delete(key);
  });

  if (state.demo === "assignment-shooter") {
    canvas.addEventListener("focus", () => {
      if (gameStatus) gameStatus.textContent = "Keyboard active — arrows / WASD + Space";
    });
    canvas.addEventListener("blur", () => {
      state.keys.clear();
      if (gameStatus) gameStatus.textContent = "Click game to activate keyboard";
    });

    projectCard?.querySelectorAll("[data-game-start]").forEach((button) => {
      button.addEventListener("click", () => {
        state.shooterMode = button.dataset.gameStart === "score" ? "score" : "challenge";
        resetShooterGame(state);
        canvas.focus({ preventScroll: true });
        if (gameStatus) {
          gameStatus.textContent = `${state.shooterMode === "score" ? "Score" : "Challenge"} mode — controls active`;
        }
        drawProcessingDemo(canvas);
      });
    });

    projectCard?.querySelectorAll("[data-game-action]").forEach((button) => {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const action = button.dataset.gameAction;
        const step = 0.075;
        if (state.gameMode !== "play") {
          state.shooterMode = "challenge";
          resetShooterGame(state);
        }
        if (action === "left") state.player.x -= step;
        if (action === "right") state.player.x += step;
        if (action === "up") state.player.y -= step;
        if (action === "down") state.player.y += step;
        if (action === "fire") shooterFire(state);
        state.player.x = Math.min(0.95, Math.max(0.05, state.player.x));
        state.player.y = Math.min(0.94, Math.max(0.2, state.player.y));
        canvas.focus({ preventScroll: true });
        if (gameStatus) gameStatus.textContent = "Screen controls active — keyboard also available";
        drawProcessingDemo(canvas);
      });
    });
  }

  processingDemoStates.set(canvas, state);
  updateProcessingModeLabel(canvas, state);
}

function roundedRectPath(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawLionCar(ctx, state, width, height) {
  ctx.fillStyle = "rgb(220,220,220)";
  ctx.fillRect(0, 0, width, height);
  const cols = 7;
  const rows = 5;
  const cellW = width / cols;
  const cellH = height / rows;
  const hoverCol = Math.floor(state.mouseX * cols);
  const hoverRow = Math.floor(state.mouseY * rows);
  const pageOffset = state.page * 35;
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const slot = y * cols + x;
      const row = state.csvRows[pageOffset + slot] || {};
      const i = pageOffset + slot;
      const model = row.model || `car ${i + 1}`;
      const mpg = Number(row.MPG || 18 + (i % 20));
      const cylinders = Number(row.cylinders || [3, 4, 5, 6, 8][i % 5]);
      const horsepower = Number(row.horsepower || 80 + (i % 120));
      const weight = Number(row.weight || 1900 + (i % 2600));
      const year = Number(row.year || 70 + (i % 13));
      const origin = row.origin || ["US", "Japan", "Europe"][i % 3];
      const cx = x * cellW + cellW * 0.5 + Math.sin(state.frame * 0.018 + i) * 4;
      const cy = y * cellH + cellH * 0.5 + Math.cos(state.frame * 0.016 + i) * 4;
      const size = Math.min(cellW, cellH) * 0.52;
      const over = x === hoverCol && y === hoverRow;
      const yearMix = Math.max(0, Math.min(1, (year - 70) / 12));
      ctx.fillStyle = `rgb(${2 + yearMix * 253}, ${1 + yearMix * 49}, ${1 + yearMix * 49})`;
      ctx.beginPath();
      ctx.arc(cx, cy, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#d48b2d";
      const earSize = size / 3 + weight * 0.0022;
      ctx.beginPath();
      ctx.arc(cx - size * 0.25, cy - size * 0.25, earSize * 0.5, 0, Math.PI * 2);
      ctx.arc(cx + size * 0.25, cy - size * 0.25, earSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = origin === "US" ? "#777" : origin === "Japan" ? "#f3e800" : "#fff";
      ctx.beginPath();
      ctx.ellipse(cx, cy, size * 0.72, size * 0.58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#050505";
      ctx.lineWidth = Math.max(1, size * 0.018);
      ctx.beginPath();
      ctx.moveTo(cx - size / 7, cy - size / 6 - mpg * 0.12);
      ctx.lineTo(cx - size / 14, cy - size / 7);
      ctx.moveTo(cx + size / 7, cy - size / 6 - mpg * 0.12);
      ctx.lineTo(cx + size / 14, cy - size / 7);
      ctx.stroke();
      ctx.fillStyle = "#050505";
      if (Math.floor(state.frame / 46 + i) % 4 !== 0) {
        ctx.beginPath();
        ctx.arc(cx - size * 0.2, cy - size * 0.1, size * 0.035, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.2, cy - size * 0.1, size * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#9b1421";
      ctx.beginPath();
      ctx.ellipse(cx, cy + size * 0.22, size * 0.16, size * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      const fang = Math.min(size * 0.22, size * 0.12 + horsepower * 0.0018);
      ctx.beginPath();
      ctx.moveTo(cx - size * 0.16, cy + size * 0.14);
      ctx.lineTo(cx - size * 0.07, cy + size * 0.14);
      ctx.lineTo(cx - size * 0.1, cy + size * 0.14 + fang);
      ctx.closePath();
      ctx.moveTo(cx + size * 0.16, cy + size * 0.14);
      ctx.lineTo(cx + size * 0.07, cy + size * 0.14);
      ctx.lineTo(cx + size * 0.1, cy + size * 0.14 + fang);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#050505";
      ctx.lineWidth = Math.max(1, size * 0.02);
      const whiskerRows = Math.max(1, Math.min(4, Math.round(cylinders / 2)));
      for (let w = 0; w < whiskerRows; w += 1) {
        const wy = cy + size * (0.08 + w * 0.045);
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.34, wy);
        ctx.lineTo(cx - size * 0.17, wy);
        ctx.moveTo(cx + size * 0.34, wy);
        ctx.lineTo(cx + size * 0.17, wy);
        ctx.stroke();
      }
      ctx.fillStyle = "#050505";
      ctx.font = `${Math.max(7, Math.min(12, size * 0.08))}px IBM Plex Mono, monospace`;
      ctx.textAlign = "center";
      ctx.fillText(model.slice(0, 18), cx, cy + size * 0.75);
      if (over) {
        ctx.fillStyle = "rgba(0,0,0,0.78)";
        ctx.fillRect(Math.min(cx + 10, width - 172), Math.min(cy + 10, height - 112), 164, 96);
        ctx.fillStyle = "#fff";
        ctx.font = `${Math.max(10, width * 0.01)}px IBM Plex Mono, monospace`;
        ctx.textAlign = "left";
        const tx = Math.min(cx + 20, width - 160);
        const ty = Math.min(cy + 28, height - 92);
        [`Model: ${model}`, `MPG: ${mpg}`, `Cylinders: ${cylinders}`, `Horsepower: ${horsepower}`, `Weight: ${weight}`, `Year: ${year}`, `Origin: ${origin}`].forEach((line, idx) => {
          ctx.fillText(line.slice(0, 28), tx, ty + idx * 12);
        });
      }
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.font = `${Math.max(10, width * 0.012)}px IBM Plex Mono, monospace`;
  ctx.textAlign = "left";
  ctx.fillText(`click to turn page / page ${state.page + 1}`, 14, height - 16);
}

function drawKaleidoscope(ctx, state, width, height) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  const image = state.image;
  if (!image?.complete) return;
  if (state.keys.has("ArrowUp")) state.tileSize += 0.8;
  if (state.keys.has("ArrowDown")) state.tileSize -= 0.8;
  state.tileSize = Math.max(12, Math.min(96, state.tileSize));
  const tileSize = Math.max(18, Math.min(96, state.tileSize + state.mode * 18));
  const sourceSize = state.mode === 0 ? 48 : tileSize;
  const sx = Math.max(0, Math.min(image.width - sourceSize, state.mouseX * image.width - sourceSize / 2));
  const sy = Math.max(0, Math.min(image.height - sourceSize, state.mouseY * image.height - sourceSize / 2));
  const off = document.createElement("canvas");
  off.width = sourceSize;
  off.height = sourceSize;
  const offCtx = off.getContext("2d");
  offCtx.drawImage(image, sx, sy, sourceSize, sourceSize, 0, 0, sourceSize, sourceSize);
  const half = document.createElement("canvas");
  half.width = sourceSize;
  half.height = sourceSize;
  const halfCtx = half.getContext("2d");
  halfCtx.drawImage(off, 0, 0);
  halfCtx.save();
  halfCtx.scale(-1, 1);
  halfCtx.drawImage(off, -sourceSize, 0);
  halfCtx.restore();
  halfCtx.save();
  halfCtx.scale(1, -1);
  halfCtx.drawImage(half, 0, -sourceSize);
  halfCtx.restore();
  if (state.mode === 2) {
    for (let i = 0; i < width; i += tileSize) {
      for (let j = 0; j < height; j += tileSize) {
        const ts = Math.min(tileSize, width - i, height - j);
        const ix = (i / width) * image.width;
        const iy = (j / height) * image.height;
        offCtx.clearRect(0, 0, sourceSize, sourceSize);
        offCtx.drawImage(image, ix, iy, sourceSize, sourceSize, 0, 0, sourceSize, sourceSize);
        ctx.drawImage(off, i, j, ts, ts);
      }
    }
  } else {
    for (let i = 0; i < width; i += 48) {
      for (let j = 0; j < height; j += 48) {
        ctx.drawImage(half, i, j, 48, 48);
      }
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.font = `${Math.max(10, width * 0.012)}px IBM Plex Mono, monospace`;
  ctx.fillText("click: sample / change tile mode", 14, height - 16);
}

function drawBleedingMood(ctx, state, width, height) {
  ctx.fillStyle = "#0d0d0d";
  ctx.fillRect(0, 0, width, height);
  const gridSize = Math.max(34, Math.min(width / 20, height / 11));
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);
  const cellW = width / cols;
  const cellH = height / rows;
  const bloodRows = [
    "11110100000111011110",
    "10001100001000110001",
    "11110100001000110001",
    "10001100001000110001",
    "11110111110111011110"
  ];
  const startCol = Math.floor(cols / 2 - 10);
  const startRow = Math.floor(rows / 2 - 3);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const cx = x * cellW + cellW / 2;
      const cy = y * cellH + cellH / 2;
      const dx = state.mouseX * width - cx;
      const dy = state.mouseY * height - cy;
      const near = Math.hypot(dx, dy) < Math.min(width, height) * 0.14;
      const pulse = Math.sin(state.frame * 0.04 + x * 1.7 + y) * 0.5 + 0.5;
      const letterX = x - startCol;
      const letterY = y - startRow;
      const wordPixel = letterX >= 0 && letterX < bloodRows[0].length && letterY >= 0 && letterY < bloodRows.length && bloodRows[letterY]?.[letterX] === "1";
      if (wordPixel) {
        ctx.fillStyle = near ? "#dbe8ff" : "#f0f0ec";
        ctx.beginPath();
        ctx.ellipse(cx, cy, cellW * 0.34, cellH * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = near ? "#10203f" : "#111";
        ctx.beginPath();
        ctx.arc(cx + (near ? dx * 0.015 : 0), cy + (near ? dy * 0.015 : 0), cellH * 0.055, 0, Math.PI * 2);
        ctx.fill();
      } else if ((x + y) % 2 === 0) {
        ctx.fillStyle = `rgba(128,0,0,${0.42 + pulse * 0.32})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy + cellH * 0.32);
        ctx.bezierCurveTo(cx + cellW * 0.35, cy + cellH * 0.1, cx + cellW * 0.1, cy - cellH * 0.3, cx, cy - cellH * 0.38);
        ctx.bezierCurveTo(cx - cellW * 0.1, cy - cellH * 0.3, cx - cellW * 0.35, cy + cellH * 0.1, cx, cy + cellH * 0.32);
        ctx.fill();
      } else {
        const broken = state.clicked % 2 === 1 || near;
        ctx.fillStyle = broken ? `rgba(255,0,0,${0.45 + pulse * 0.35})` : `rgba(104,15,36,${0.5 + pulse * 0.3})`;
        ctx.beginPath();
        ctx.moveTo(cx, cy - cellH * 0.16);
        ctx.bezierCurveTo(cx + cellW * 0.23, cy - cellH * 0.42, cx + cellW * 0.42, cy, cx, cy + cellH * 0.3);
        ctx.bezierCurveTo(cx - cellW * 0.42, cy, cx - cellW * 0.23, cy - cellH * 0.42, cx, cy - cellH * 0.16);
        ctx.fill();
        if (broken) {
          ctx.strokeStyle = "#0d0d0d";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - cellH * 0.1);
          ctx.lineTo(cx - cellW * 0.08, cy + cellH * 0.03);
          ctx.lineTo(cx + cellW * 0.07, cy + cellH * 0.16);
          ctx.stroke();
        }
      }
    }
  }
}

function drawPortrait(ctx, state, width, height, spiralOnly = false) {
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width, height);
  if (!state.image?.complete || !state.image.naturalWidth) {
    ctx.fillStyle = "#161616";
    ctx.font = `${Math.max(14, width * 0.02)}px IBM Plex Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText("Loading original portrait…", width / 2, height / 2);
    return;
  }

  if (!state.sampleCanvas || state.sampleCanvas.width !== width || state.sampleCanvas.height !== height) {
    state.sampleCanvas = document.createElement("canvas");
    state.sampleCanvas.width = width;
    state.sampleCanvas.height = height;
    const sampleCtx = state.sampleCanvas.getContext("2d", { willReadFrequently: true });
    const scale = Math.max(width / state.image.naturalWidth, height / state.image.naturalHeight);
    const drawWidth = state.image.naturalWidth * scale;
    const drawHeight = state.image.naturalHeight * scale;
    sampleCtx.fillStyle = "#f5f5f1";
    sampleCtx.fillRect(0, 0, width, height);
    sampleCtx.drawImage(state.image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  }

  const pointerX = state.mouseX * width;
  const pointerY = state.mouseY * height;
  const minSide = Math.min(width, height);
  const frame = state.frame;

  if (state.mode === 2) {
    const bandHeight = Math.max(5, Math.round(height / 92));
    const direction = state.mouseX < 0.5 ? -1 : 1;
    const amplitude = direction * width * (0.025 + Math.abs(state.mouseX - 0.5) * 0.2);
    const phase = state.mouseY * Math.PI * 4 + frame * 0.018;
    for (let y = 0; y < height; y += bandHeight) {
      const distance = Math.abs(y - pointerY) / height;
      const focus = Math.max(0, 1 - distance * 2.8);
      const shift = Math.sin(y * 0.032 + phase) * amplitude * (0.18 + focus * 0.82);
      ctx.drawImage(state.sampleCanvas, 0, y, width, bandHeight, shift, y, width, bandHeight);
    }
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.22;
    ctx.drawImage(state.sampleCanvas, (state.mouseX - 0.5) * 22, 0, width, height);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    return;
  }

  if (state.mode === 1) {
    ctx.save();
    ctx.filter = "grayscale(0.55) contrast(1.08)";
    ctx.globalAlpha = 0.88;
    ctx.drawImage(state.sampleCanvas, 0, 0);
    ctx.restore();
    const step = Math.max(10, Math.round(minSide / 42));
    ctx.lineCap = "round";
    for (let y = step / 2; y < height; y += step) {
      for (let x = step / 2; x < width; x += step) {
        const distance = Math.hypot(x - pointerX, y - pointerY);
        const influence = Math.max(0, 1 - distance / (minSide * 0.36));
        const angle = Math.atan2(y - pointerY, x - pointerX) + Math.sin(frame * 0.018 + x * 0.014) * (0.25 + influence);
        const length = step * (0.5 + influence * 2.1);
        const red = 30 + Math.round((x / width) * 170);
        const blue = 60 + Math.round((y / height) * 170);
        ctx.strokeStyle = `rgba(${red},42,${blue},${0.25 + influence * 0.62})`;
        ctx.lineWidth = Math.max(1, step * 0.1);
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(angle) * length * 0.5, y - Math.sin(angle) * length * 0.5);
        ctx.lineTo(x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5);
        ctx.stroke();
      }
    }
    return;
  }

  ctx.save();
  ctx.filter = "contrast(1.08) saturate(0.82)";
  ctx.globalAlpha = 0.92;
  ctx.drawImage(state.sampleCanvas, 0, 0);
  ctx.restore();

  const step = Math.max(8, Math.round(minSide / 48));
  ctx.globalCompositeOperation = "overlay";
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const distance = Math.hypot(x - pointerX, y - pointerY);
      const influence = Math.max(0, 1 - distance / (minSide * 0.32));
      const wave = Math.sin(y * 0.025 + frame * 0.024) * influence * step * 2.2;
      const drift = (state.mouseX - 0.5) * influence * step * 3.5;
      const radius = step * (0.14 + ((x + y) / step % 3) * 0.07 + influence * 0.3);
      ctx.fillStyle = (Math.round(x / step + y / step) % 2 === 0)
        ? `rgba(255,255,255,${0.16 + influence * 0.34})`
        : `rgba(16,16,16,${0.14 + influence * 0.3})`;
      ctx.beginPath();
      ctx.arc(x + wave + drift, y, Math.max(1, radius), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = "source-over";
}

function shooterFire(state) {
  if (state.gameMode !== "play" || state.ammo <= 0) return;
  state.bullets.push({ x: state.player.x, y: state.player.y - 0.05 });
  state.ammo -= 1;
}

function resetShooterGame(state) {
  state.gameMode = "play";
  state.score = 0;
  state.ammo = 10;
  state.health = state.shooterMode === "challenge" ? 5 : 3;
  state.level = 1;
  state.levelTime = 30;
  state.levelTarget = 10;
  state.levelStart = state.frame;
  state.levelPassed = false;
  state.bullets = [];
  state.enemies = [];
  state.enemyBullets = [];
  state.ammoPickups = [];
  state.player = { x: 0.5, y: 0.86 };
}

function handleShooterPointer(state) {
  if (state.gameMode === "menu") {
    if (state.mouseY > 0.47 && state.mouseY < 0.57) {
      state.shooterMode = "challenge";
      state.gameMode = "rules";
      state.health = 5;
    } else if (state.mouseY > 0.6 && state.mouseY < 0.71) {
      state.shooterMode = "score";
      state.gameMode = "rules";
      state.health = 3;
    }
  } else if (state.gameMode === "rules") {
    resetShooterGame(state);
  } else if (state.gameMode === "gameover") {
    resetShooterGame(state);
  } else {
    shooterFire(state);
  }
}

function drawShooterButton(ctx, x, y, w, h, label, fill) {
  ctx.fillStyle = fill;
  roundedRectPath(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = "#050505";
  ctx.font = `${Math.max(13, w * 0.095)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + w / 2, y + h / 2);
}

function drawSpriteOrFallback(ctx, image, x, y, w, h, fallbackColor, label = "") {
  if (image?.complete && image.naturalWidth) {
    ctx.drawImage(image, x, y, w, h);
    return;
  }
  ctx.fillStyle = fallbackColor;
  ctx.fillRect(x, y, w, h);
  if (label) {
    ctx.fillStyle = "#050505";
    ctx.font = `${Math.max(10, w * 0.25)}px IBM Plex Mono, monospace`;
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + h / 2);
  }
}

function playProcessingSound(audio) {
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function drawAssignmentShooter(ctx, state, width, height) {
  if (state.bg?.complete) {
    ctx.drawImage(state.bg, 0, 0, width, height);
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = "#10131a";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.fillStyle = "rgba(0,0,0,0.58)";
  ctx.fillRect(0, 0, width, height);

  if (state.gameMode === "menu") {
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(30, width * 0.07)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Assignments Shooter", width / 2, height * 0.32);
    drawShooterButton(ctx, width / 2 - 120, height * 0.48, 240, 48, "Challenge Mode", "rgb(153,178,204)");
    drawShooterButton(ctx, width / 2 - 120, height * 0.62, 240, 48, "Score Mode", "rgb(204,153,178)");
    return;
  }

  if (state.gameMode === "rules") {
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(17, width * 0.027)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const lines = state.shooterMode === "challenge"
      ? ["Challenge Mode Rules:", "- 5 Lives", "- 6 Levels", "- Complete objectives within time limits"]
      : ["Score Mode Rules:", "- 3 Lives", "- No time limit", "- Aim for the highest score"];
    lines.forEach((line, index) => ctx.fillText(line, width / 2, height * 0.36 + index * 28));
    drawShooterButton(ctx, width / 2 - 100, height * 0.64, 200, 48, "Start Game", "rgb(173,192,171)");
    return;
  }

  if (state.gameMode === "gameover") {
    ctx.fillStyle = "#fff";
    ctx.font = `${Math.max(30, width * 0.065)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("Game Over", width / 2, height * 0.38);
    ctx.font = `${Math.max(16, width * 0.028)}px Inter, sans-serif`;
    ctx.fillText(`Score: ${state.score}`, width / 2, height * 0.48);
    ctx.fillText(`High Score: ${state.highScore}`, width / 2, height * 0.54);
    drawShooterButton(ctx, width / 2 - 100, height * 0.66, 200, 48, "Restart", "rgb(153,178,204)");
    return;
  }

  const speed = 0.011;
  if (state.keys.has("ArrowLeft") || state.keys.has("a")) state.player.x -= speed;
  if (state.keys.has("ArrowRight") || state.keys.has("d")) state.player.x += speed;
  if (state.keys.has("ArrowUp") || state.keys.has("w")) state.player.y -= speed;
  if (state.keys.has("ArrowDown") || state.keys.has("s")) state.player.y += speed;
  state.player.x = Math.min(0.95, Math.max(0.05, state.player.x));
  state.player.y = Math.min(0.94, Math.max(0.2, state.player.y));

  const elapsed = Math.floor((state.frame - (state.levelStart || state.frame)) / 60);
  if (state.shooterMode === "challenge" && elapsed >= state.levelTime) {
    if (state.score >= state.levelTarget) {
      state.level += 1;
      state.levelTarget = state.level === 2 ? 30 : state.levelTarget + 20;
      state.levelTime = state.level === 2 ? 40 : 30;
      state.levelStart = state.frame;
      state.enemies = [];
      state.enemyBullets = [];
      state.bullets = [];
    } else {
      state.gameMode = "gameover";
    }
  }

  if (state.frame % (state.level >= 2 ? 50 : 60) === 0) {
    state.enemies.push({ x: 0.06 + Math.random() * 0.88, y: -0.08, speed: 0.003 + Math.random() * 0.003 });
  }
  if (state.frame % 200 === 0) {
    state.ammoPickups.push({ x: 0.08 + Math.random() * 0.84, y: 0.18 + Math.random() * 0.64 });
  }

  state.enemies.forEach((enemy) => {
    enemy.y += enemy.speed;
    if (Math.random() < 0.01) {
      state.enemyBullets.push({ x: enemy.x, y: enemy.y + 0.04 });
    }
  });
  state.bullets.forEach((bullet) => bullet.y -= 0.018);
  state.enemyBullets.forEach((bullet) => bullet.y += 0.009);

  state.bullets.forEach((bullet) => {
    state.enemies.forEach((enemy) => {
      if (enemy.dead || bullet.dead) return;
      if (Math.hypot(bullet.x - enemy.x, bullet.y - enemy.y) < 0.055) {
        enemy.dead = true;
        bullet.dead = true;
        state.score += 1;
        state.highScore = Math.max(state.highScore, state.score);
        playProcessingSound(state.sounds.score);
      }
    });
  });

  state.enemyBullets.forEach((bullet) => {
    if (bullet.dead) return;
    if (Math.hypot(bullet.x - state.player.x, bullet.y - state.player.y) < 0.055) {
      bullet.dead = true;
      state.health -= 1;
      playProcessingSound(state.sounds.hit);
      if (state.health <= 0) state.gameMode = "gameover";
    }
  });

  state.ammoPickups.forEach((pickup) => {
    if (pickup.dead) return;
    if (Math.hypot(pickup.x - state.player.x, pickup.y - state.player.y) < 0.06) {
      pickup.dead = true;
      state.ammo += 5;
    }
  });

  state.enemies = state.enemies.filter((enemy) => !enemy.dead && enemy.y < 1.1);
  state.bullets = state.bullets.filter((bullet) => !bullet.dead && bullet.y > -0.1);
  state.enemyBullets = state.enemyBullets.filter((bullet) => !bullet.dead && bullet.y < 1.1);
  state.ammoPickups = state.ammoPickups.filter((pickup) => !pickup.dead);

  const drawW = Math.min(width, height * 1.333);
  const unit = drawW / 800;
  const playerW = 70 * unit;
  const playerH = 70 * unit;
  const enemyW = 60 * unit;
  const enemyH = 60 * unit;
  const bulletW = 15 * unit;
  const bulletH = 30 * unit;
  const ammoW = 25 * unit;
  const ammoH = 25 * unit;

  state.enemies.forEach((enemy) => {
    drawSpriteOrFallback(ctx, state.sprites.enemy, enemy.x * width - enemyW / 2, enemy.y * height - enemyH / 2, enemyW, enemyH, "#ff6878", "DUE");
  });
  state.bullets.forEach((bullet) => {
    drawSpriteOrFallback(ctx, state.sprites.bullet, bullet.x * width - bulletW / 2, bullet.y * height - bulletH / 2, bulletW, bulletH, "#f7ff62");
  });
  state.enemyBullets.forEach((bullet) => {
    drawSpriteOrFallback(ctx, state.sprites.enemyBullet, bullet.x * width - bulletW / 2, bullet.y * height - bulletH / 2, bulletW, bulletH, "#ff8a8a");
  });
  state.ammoPickups.forEach((pickup) => {
    drawSpriteOrFallback(ctx, state.sprites.ammo, pickup.x * width - ammoW / 2, pickup.y * height - ammoH / 2, ammoW, ammoH, "#a8ff9e");
  });
  drawSpriteOrFallback(ctx, state.sprites.player, state.player.x * width - playerW / 2, state.player.y * height - playerH / 2, playerW, playerH, "#7fc7ff");

  ctx.fillStyle = "#fff";
  ctx.font = `${Math.max(12, width * 0.018)}px IBM Plex Mono, monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  [`Score: ${state.score}`, `Health: ${state.health}`, `Ammo: ${state.ammo}`, `High Score: ${state.highScore}`].forEach((line, index) => {
    ctx.fillText(line, 18, 18 + index * 20);
  });
  if (state.shooterMode === "challenge") {
    ctx.textAlign = "right";
    ctx.fillText(`Level: ${state.level}`, width - 18, 18);
    ctx.fillText(`Time: ${Math.max(0, state.levelTime - elapsed)}`, width - 18, 38);
    ctx.fillText(`Target: ${state.levelTarget}`, width - 18, 58);
  }
}

function drawProcessingDemo(canvas) {
  const state = processingDemoStates.get(canvas);
  if (!state) return;
  const ctx = canvas.getContext("2d");
  const { width, height } = fitProcessingCanvas(canvas);
  state.frame += 1;
  if (state.demo === "lion-car") drawLionCar(ctx, state, width, height);
  if (state.demo === "kaleidoscope") drawKaleidoscope(ctx, state, width, height);
  if (state.demo === "bleeding-mood") drawBleedingMood(ctx, state, width, height);
  if (state.demo === "portraiture") drawPortrait(ctx, state, width, height);
  if (state.demo === "assignment-shooter") drawAssignmentShooter(ctx, state, width, height);
  if (state.demo === "spiral-portrait") drawPortrait(ctx, state, width, height, true);
}

function animateProcessingDemos() {
  processingCanvases.forEach((canvas) => {
    try {
      drawProcessingDemo(canvas);
    } catch (error) {
      const state = processingDemoStates.get(canvas);
      if (state && !state.failed) {
        state.failed = true;
        const ctx = canvas.getContext("2d");
        const { width, height } = fitProcessingCanvas(canvas);
        ctx.fillStyle = "#050505";
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = "#f4f4ef";
        ctx.font = `${Math.max(14, width * 0.018)}px IBM Plex Mono, monospace`;
        ctx.fillText("Interactive sketch is loading. Click again.", 20, 36);
        console.warn("Processing sketch paused:", state.demo, error);
      }
    }
  });
  window.requestAnimationFrame(animateProcessingDemos);
}

if (processingCanvases.length) {
  processingCanvases.forEach(initProcessingDemo);

  const routeProcessingKey = (event, pressed) => {
    const canvas = document.activeElement;
    if (!canvas?.classList?.contains("processing-live-canvas")) return;
    const state = processingDemoStates.get(canvas);
    if (!state) return;
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

    if (state.demo === "portraiture" && pressed && ["1", "2", "3"].includes(key)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      state.mode = Number(key) - 1;
      updateProcessingModeLabel(canvas, state);
      drawProcessingDemo(canvas);
      return;
    }

    const gameKeys = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "w", "a", "s", "d", " "];
    if (state.demo !== "assignment-shooter" || !gameKeys.includes(key)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pressed) {
      state.keys.add(key);
      if (key === " " && !event.repeat) shooterFire(state);
    } else {
      state.keys.delete(key);
    }
  };

  window.addEventListener("keydown", (event) => routeProcessingKey(event, true), true);
  window.addEventListener("keyup", (event) => routeProcessingKey(event, false), true);
  window.requestAnimationFrame(animateProcessingDemos);
}

if (profilePhoto) {
  profilePhoto.addEventListener("click", releaseProfileStars);
  profilePhoto.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    releaseProfileStars();
  });
}

if (heroTitle) {
  heroTitle.addEventListener("click", buildHeroOrbit);
}

if (heroEmail) {
  heroEmail.addEventListener("click", (event) => {
    event.preventDefault();
    copyEmailToClipboard();
    showEmailCopiedState();
  });
  heroEmail.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    copyEmailToClipboard();
    showEmailCopiedState();
  });
}

contactEmailButtons.forEach((button) => {
  button.addEventListener("click", () => {
    copyEmailToClipboard(button.dataset.copyEmail);
    showEmailCopiedState(button);
  });
});

if (processingCanvas && processingCtx && densityControl && motionControl && resetButton && pauseButton && randomizeButton) {
  resetButton.addEventListener("click", () => {
    densityControl.value = 42;
    motionControl.value = 5;
    processingSeed = Math.random() * 1000;
    updateProcessingControls();
    if (processingPaused) {
      drawProcessing(performance.now());
    }
  });

  pauseButton.addEventListener("click", () => {
    setProcessingPaused(!processingPaused);
  });

  randomizeButton.addEventListener("click", randomizeProcessing);

  [densityControl, motionControl].forEach((control) => {
    control.addEventListener("input", () => {
      updateProcessingControls();
      if (processingPaused) {
        drawProcessing(performance.now());
      }
    });
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
  },
  { threshold: 0.16 },
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

window.addEventListener("resize", createAmbient);
window.addEventListener("resize", updateHomeState);
window.addEventListener("popstate", () => {
  const id = location.hash ? location.hash.slice(1) : "home";
  transitionToSection(getSection(id) ? id : "home", { push: false, direction: "back", force: true });
});

createAmbient();
drawAmbient();
tickTypewriter();
buildHeroOrbit();
if (processingCanvas && processingCtx && densityControl && motionControl) {
  updateProcessingControls();
  processingFrame = requestAnimationFrame(drawProcessing);
}
miniSketches.forEach((canvas, index) => drawMiniSketch(canvas, index));
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
const initialSection = getSection(activeSectionId) || getSection("home");
setActiveSection(initialSection.id);
applyDeckState(initialSection.id, "forward");
initialSection.classList.remove("is-entering-forward", "is-entering-back");
markArriving(initialSection);
updateHomeState();
