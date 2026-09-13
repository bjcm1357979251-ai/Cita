/* ==========================================================
   NUTRISCAN AI — lógica de la experiencia
   ========================================================== */

/* ⚙️ EDITA AQUÍ antes de enviar el link */
const CONFIG = {
  herName: "Ella", // <-- pon aquí su nombre real
};

document.getElementById("her-name-1").textContent = CONFIG.herName;
document.getElementById("her-name-2").textContent = CONFIG.herName;

/* ---------------------------------------------------------
   UTILIDADES
--------------------------------------------------------- */
const wait = (ms) => new Promise((res) => setTimeout(res, ms));

function showScreen(name) {
  const current = document.querySelector(".screen.active");
  const next = document.querySelector(`[data-screen="${name}"]`);
  if (current && current !== next) {
    current.classList.add("leaving");
    current.classList.remove("active");
    setTimeout(() => current.classList.remove("leaving"), 550);
  }
  next.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function typeText(el, text, speed = 26) {
  el.textContent = "";
  for (const ch of text) {
    el.textContent += ch;
    await wait(speed);
  }
}

async function runProgress(el, pctEl, duration, onTick) {
  const start = performance.now();
  return new Promise((resolve) => {
    function frame(now) {
      const elapsed = now - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      el.style.width = pct + "%";
      if (pctEl) pctEl.textContent = Math.round(pct) + "%";
      if (onTick) onTick(pct);
      if (pct < 100) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });
}

function ripple(btn, evt) {
  const circle = document.createElement("span");
  circle.classList.add("ripple");
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  circle.style.width = circle.style.height = size + "px";
  const x = (evt.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
  const y = (evt.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
  circle.style.left = x + "px";
  circle.style.top = y + "px";
  btn.appendChild(circle);
  setTimeout(() => circle.remove(), 620);
}
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn, .activity-btn");
  if (btn) ripple(btn, e);
});

/* ---------------------------------------------------------
   MONITOR DE SIGNOS VITALES — elemento firma
   Un ECG que reacciona al estado emocional de la narrativa.
--------------------------------------------------------- */
const vitalsCanvas = document.getElementById("vitals-canvas");
const vctx = vitalsCanvas.getContext("2d");
const bpmValueEl = document.getElementById("bpm-value");

let vitalsState = { targetBpm: 72, currentBpm: 72, amplitude: 10, jitter: 0 };
const VITAL_PRESETS = {
  idle: { bpm: 72, amplitude: 10, jitter: 0.15 },
  scanning: { bpm: 88, amplitude: 14, jitter: 0.25 },
  warning: { bpm: 118, amplitude: 20, jitter: 0.9 },
  searching: { bpm: 96, amplitude: 15, jitter: 0.4 },
  persuasion: { bpm: 134, amplitude: 24, jitter: 1.1 },
  tense: { bpm: 128, amplitude: 20, jitter: 0.7 },
  heartbreak: { bpm: 58, amplitude: 6, jitter: 0.1 },
  excited: { bpm: 152, amplitude: 28, jitter: 1.3 },
  content: { bpm: 78, amplitude: 12, jitter: 0.15 },
  happy: { bpm: 70, amplitude: 11, jitter: 0.1 },
};

function setVitals(preset) {
  const p = VITAL_PRESETS[preset] || VITAL_PRESETS.idle;
  vitalsState.targetBpm = p.bpm;
  vitalsState.amplitude = p.amplitude;
  vitalsState.jitter = p.jitter;
}

function resizeVitalsCanvas() {
  vitalsCanvas.width = vitalsCanvas.offsetWidth * devicePixelRatio;
  vitalsCanvas.height = vitalsCanvas.offsetHeight * devicePixelRatio;
}
window.addEventListener("resize", resizeVitalsCanvas);
resizeVitalsCanvas();

let scrollX = 0;
const wavePoints = [];

function ecgLoop() {
  const w = vitalsCanvas.width;
  const h = vitalsCanvas.height;
  vctx.clearRect(0, 0, w, h);

  // suavizar bpm hacia el objetivo
  vitalsState.currentBpm += (vitalsState.targetBpm - vitalsState.currentBpm) * 0.02;
  bpmValueEl.textContent = Math.round(vitalsState.currentBpm);

  const mid = h / 2;
  const speed = 2.4 * devicePixelRatio;
  scrollX += speed;

  // generar nuevo punto cada cierto intervalo basado en bpm (simula latido)
  const beatInterval = 4200 / (vitalsState.currentBpm / 60) / 10;
  if (Math.random() < 1 / beatInterval) {
    wavePoints.push({ x: w + 20, spike: true });
  }

  vctx.beginPath();
  vctx.lineWidth = 2 * devicePixelRatio;
  vctx.strokeStyle = "#4ADE9A";
  vctx.shadowColor = "rgba(74,222,154,0.6)";
  vctx.shadowBlur = 6;

  // mover puntos y dibujar
  for (let i = wavePoints.length - 1; i >= 0; i--) {
    wavePoints[i].x -= speed;
    if (wavePoints[i].x < -20) wavePoints.splice(i, 1);
  }

  vctx.moveTo(0, mid);
  for (let x = 0; x <= w; x += 4 * devicePixelRatio) {
    let y = mid + (Math.random() - 0.5) * vitalsState.jitter * devicePixelRatio;
    // buscar si algún "beat" está cerca de este x para dibujar el pico QRS
    for (const p of wavePoints) {
      const d = x - p.x;
      if (d > -14 * devicePixelRatio && d < 14 * devicePixelRatio) {
        const t = d / (14 * devicePixelRatio);
        const spike = Math.exp(-Math.pow(t * 3, 2)) * vitalsState.amplitude * devicePixelRatio;
        y -= spike * (t < 0 ? 1 : -1) * (Math.abs(t) < 0.35 ? 2.2 : 1);
      }
    }
    vctx.lineTo(x, y);
  }
  vctx.stroke();

  requestAnimationFrame(ecgLoop);
}
requestAnimationFrame(ecgLoop);

/* ---------------------------------------------------------
   FONDO DE PARTÍCULAS
--------------------------------------------------------- */
const pCanvas = document.getElementById("particles");
const pctx = pCanvas.getContext("2d");
let particles = [];

function resizeParticles() {
  pCanvas.width = window.innerWidth;
  pCanvas.height = window.innerHeight;
  const count = Math.floor((window.innerWidth * window.innerHeight) / 22000);
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * pCanvas.width,
    y: Math.random() * pCanvas.height,
    r: Math.random() * 1.6 + 0.4,
    vy: Math.random() * 0.25 + 0.05,
    vx: (Math.random() - 0.5) * 0.15,
    o: Math.random() * 0.5 + 0.15,
  }));
}
window.addEventListener("resize", resizeParticles);
resizeParticles();

function particlesLoop() {
  pctx.clearRect(0, 0, pCanvas.width, pCanvas.height);
  for (const p of particles) {
    p.y -= p.vy;
    p.x += p.vx;
    if (p.y < -5) p.y = pCanvas.height + 5;
    if (p.x < -5) p.x = pCanvas.width + 5;
    if (p.x > pCanvas.width + 5) p.x = -5;
    pctx.beginPath();
    pctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    pctx.fillStyle = `rgba(126,234,192,${p.o})`;
    pctx.fill();
  }
  requestAnimationFrame(particlesLoop);
}
requestAnimationFrame(particlesLoop);

/* ---------------------------------------------------------
   PANTALLA DE CARGA GENÉRICA
--------------------------------------------------------- */
async function runLoading({ icon, title, subtitle, duration, vitals }) {
  showScreen("loading");
  setVitals(vitals);
  document.getElementById("loading-icon").className = `fa-solid ${icon}`;
  document.getElementById("loading-title").textContent = title;
  const subtitleEl = document.getElementById("loading-subtitle");
  const fill = document.getElementById("loading-progress");
  const pct = document.getElementById("loading-pct");
  fill.style.width = "0%";
  pct.textContent = "0%";

  await typeText(subtitleEl, subtitle, 22);
  await runProgress(fill, pct, duration);
  await wait(250);
}

/* ---------------------------------------------------------
   PANTALLA DE ALTERNATIVAS (café / helado / pizza)
--------------------------------------------------------- */
async function runAlternatives() {
  showScreen("alternatives");
  setVitals("searching");
  const items = [
    { icon: "fa-mug-hot", label: "Ofrecer café..." },
    { icon: "fa-ice-cream", label: "Ofrecer helado..." },
    { icon: "fa-pizza-slice", label: "Invitar a comer..." },
  ];
  const iconEl = document.getElementById("alt-icon");
  const labelEl = document.getElementById("alt-label");
  const fill = document.getElementById("alt-progress");
  const resultEl = document.getElementById("alt-result");

  for (const item of items) {
    iconEl.innerHTML = `<i class="fa-solid ${item.icon}"></i>`;
    labelEl.textContent = item.label;
    fill.style.width = "0%";
    resultEl.classList.remove("show");
    resultEl.textContent = "";
    await wait(200);
    await runProgress(fill, null, 1400);
    resultEl.innerHTML = `<i class="fa-solid fa-xmark"></i> Sin éxito`;
    resultEl.classList.add("show");
    await wait(900);
  }
}

/* ---------------------------------------------------------
   CONFETTI Y CORAZONES
--------------------------------------------------------- */
function launchConfetti() {
  if (typeof confetti !== "function") return;
  const colors = ["#4ADE9A", "#FF6B6B", "#EAFBF3", "#7EEAC0"];
  confetti({ particleCount: 100, spread: 75, origin: { y: 0.6 }, colors });
  setTimeout(() => confetti({ particleCount: 60, spread: 100, origin: { y: 0.4 }, colors }), 250);
}

function launchHearts() {
  for (let i = 0; i < 14; i++) {
    setTimeout(() => {
      const heart = document.createElement("i");
      heart.className = "fa-solid fa-heart floating-heart";
      heart.style.left = Math.random() * 100 + "vw";
      heart.style.setProperty("--drift", (Math.random() - 0.5) * 120 + "px");
      heart.style.fontSize = 14 + Math.random() * 16 + "px";
      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 3300);
    }, i * 110);
  }
}

/* ---------------------------------------------------------
   FLUJO PRINCIPAL
--------------------------------------------------------- */
async function init() {
  await runLoading({
    icon: "fa-satellite-dish",
    title: "NutriScan AI v3.4",
    subtitle: "Analizando compatibilidad...",
    duration: 3200,
    vitals: "scanning",
  });

  showScreen("result");
  setVitals("idle");
  await wait(400);
  const compatFill = document.getElementById("compat-fill");
  const compatValue = document.getElementById("compat-value");
  await runProgress(compatFill, null, 1400, (pct) => {
    compatValue.textContent = ((pct / 100) * 94.8).toFixed(1) + "%";
  });
  compatValue.textContent = "94.8%";
}

async function rejectFlow() {
  await runLoading({
    icon: "fa-triangle-exclamation",
    title: "⚠ Respuesta inesperada",
    subtitle: "Iniciando protocolo de revisión...",
    duration: 2200,
    vitals: "warning",
  });

  await runAlternatives();

  await runLoading({
    icon: "fa-brain",
    title: "Activando Modo Persuasión...",
    subtitle: "Recalculando estrategia...",
    duration: 2400,
    vitals: "persuasion",
  });

  showScreen("diagnostico");
  setVitals("tense");
}

async function successFlow() {
  showScreen("success");
  setVitals("excited");
  launchConfetti();
  const sub = document.getElementById("success-subtitle");
  const fill = document.getElementById("success-progress");
  await typeText(sub, "Generando receta médica...", 24);
  await runProgress(fill, null, 1800);
  await wait(300);
  showScreen("receta");
  setVitals("content");
}

/* ---------------------------------------------------------
   RESERVA
--------------------------------------------------------- */
let selectedActivity = null;
const dateInput = document.getElementById("input-date");
const timeInput = document.getElementById("input-time");
const confirmBtn = document.getElementById("confirm-reserva-btn");

// fecha mínima: hoy
dateInput.min = new Date().toISOString().split("T")[0];

document.getElementById("activity-grid").addEventListener("click", (e) => {
  const btn = e.target.closest(".activity-btn");
  if (!btn) return;
  document.querySelectorAll(".activity-btn").forEach((b) => b.classList.remove("selected"));
  btn.classList.add("selected");
  selectedActivity = btn.dataset.activity;
  validateReserva();
});
dateInput.addEventListener("input", validateReserva);
timeInput.addEventListener("input", validateReserva);

function validateReserva() {
  confirmBtn.disabled = !(dateInput.value && timeInput.value && selectedActivity);
}

function formatDate(str) {
  const d = new Date(str + "T00:00:00");
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
function formatTime(str) {
  const [h, m] = str.split(":");
  const d = new Date();
  d.setHours(+h, +m);
  return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
}

confirmBtn.addEventListener("click", async () => {
  if (confirmBtn.disabled) return;
  document.getElementById("final-date").textContent = formatDate(dateInput.value);
  document.getElementById("final-time").textContent = formatTime(timeInput.value);
  document.getElementById("final-activity").textContent = selectedActivity;

  launchConfetti();
  launchHearts();
  setVitals("happy");
  await wait(500);
  showScreen("final");
});

/* ---------------------------------------------------------
   MANEJO DE BOTONES POR data-action
--------------------------------------------------------- */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;
  const action = btn.dataset.action;

  switch (action) {
    case "accept-initial":
    case "accept-final":
      successFlow();
      break;
    case "reject-initial":
      rejectFlow();
      break;
    case "goto-final-choice":
      showScreen("final-choice");
      setVitals("tense");
      break;
    case "reject-final":
      showScreen("goodbye");
      setVitals("heartbreak");
      break;
    case "goto-reserva":
      showScreen("reserva");
      setVitals("idle");
      break;
  }
});

/* ---------------------------------------------------------
   ARRANQUE
--------------------------------------------------------- */
init();