const ambientCanvas = document.querySelector("#ambient-canvas");
const ambientCtx = ambientCanvas.getContext("2d");
const processingCanvas = document.querySelector("#processing-canvas");
const processingCtx = processingCanvas.getContext("2d");
const densityControl = document.querySelector("#density-control");
const motionControl = document.querySelector("#motion-control");
const resetButton = document.querySelector("#reset-sketch");
const typewriter = document.querySelector("#typewriter");
const portfolioTabs = document.querySelectorAll(".portfolio-tab");
const portfolioPanels = document.querySelectorAll("[data-category-panel]");
const miniSketches = document.querySelectorAll(".mini-sketch");
const homeSection = document.querySelector("#home");

const roles = [
  "HCI Researcher",
  "UI/UX Designer",
  "Web Front-end Developer",
  "Creative Technologist",
  "Marcom Designer",
];
let roleIndex = 0;
let charIndex = 0;
let deleting = false;
let ambientDots = [];
let processingSeed = Math.random() * 1000;

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
  const homeRect = homeSection.getBoundingClientRect();
  document.body.classList.toggle("is-home", homeRect.bottom > window.innerHeight * 0.62);
}

function drawProcessing(time = 0) {
  const { width, height } = fitCanvas(processingCanvas, processingCtx);
  const density = Number(densityControl.value);
  const motion = Number(motionControl.value) * 0.0018;
  const centerX = width / 2;
  const centerY = height / 2;
  const minSide = Math.min(width, height);

  processingCtx.fillStyle = "#f4f4ef";
  processingCtx.fillRect(0, 0, width, height);
  processingCtx.strokeStyle = "#000";
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
  requestAnimationFrame(drawProcessing);
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

portfolioTabs.forEach((tab) => {
  tab.addEventListener("click", () => setPortfolioCategory(tab.dataset.category));
});

resetButton.addEventListener("click", () => {
  processingSeed = Math.random() * 1000;
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => entry.target.classList.toggle("is-visible", entry.isIntersecting));
  },
  { threshold: 0.16 },
);

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));

window.addEventListener("resize", createAmbient);
window.addEventListener("scroll", updateHomeState, { passive: true });
window.addEventListener("resize", updateHomeState);

createAmbient();
drawAmbient();
tickTypewriter();
drawProcessing();
miniSketches.forEach((canvas, index) => drawMiniSketch(canvas, index));
updateHomeState();
