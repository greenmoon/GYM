(() => {
  "use strict";

  const CYCLE_SECONDS = 300;
  const RISE_SECONDS = 120;
  const RECOVERY_SECONDS = 120;
  const COUNTDOWN_START_SECONDS = RISE_SECONDS + RECOVERY_SECONDS;
  const MIN_BPM = 85;
  const MAX_BPM = 110;

  const elements = {
    heartRate: document.querySelector("#heart-rate"),
    rateUnit: document.querySelector("#rate-unit"),
    phaseLabel: document.querySelector("#phase-label"),
    cycleCount: document.querySelector("#cycle-count"),
    cycleTime: document.querySelector("#cycle-time"),
    progressFill: document.querySelector("#progress-fill"),
    startButton: document.querySelector("#start-button"),
    resetButton: document.querySelector("#reset-button"),
    cycleOptions: [...document.querySelectorAll(".cycle-option")],
    doneOverlay: document.querySelector("#done-overlay"),
    doneResetButton: document.querySelector("#done-reset-button"),
    doneSummary: document.querySelector("#done-summary"),
    languageButtons: [...document.querySelectorAll(".language-button")],
    cycleBadgeLabel: document.querySelector("#cycle-badge-label"),
    cycleTimeLabel: document.querySelector("#cycle-time-label"),
    maxCyclesLabel: document.querySelector("#max-cycles-label"),
    cycleSelector: document.querySelector("#cycle-selector"),
    doneEyebrow: document.querySelector("#done-eyebrow"),
    rotateNotice: document.querySelector(".rotate-notice"),
  };

  const translations = {
    tc: {
      language: "語言", cycle: "循環", cycleTime: "循環時間", maxCycles: "最多循環",
      targetRate: "目標心率", maxCyclesAria: "最多循環次數", start: "開始", pause: "暫停",
      resume: "繼續", reset: "重設", again: "再來一次", complete: "運動完成",
      rotate: "請將 iPhone 轉為橫向", ready: "準備", ride: "騎乘", ramp: "上升",
      recover: "恢復", rest: "休息 · 倒數", completed: "完成", cycleOne: "循環", cycles: "循環", minutes: "分鐘",
    },
    en: {
      language: "Language", cycle: "Cycle", cycleTime: "Cycle time", maxCycles: "Max cycles",
      targetRate: "Target heart rate", maxCyclesAria: "Maximum workout cycles", start: "START", pause: "PAUSE",
      resume: "RESUME", reset: "RESET", again: "AGAIN", complete: "WORKOUT COMPLETE",
      rotate: "Rotate iPhone to landscape", ready: "READY", ride: "RIDE", ramp: "RAMP UP",
      recover: "RECOVER", rest: "REST · COUNTDOWN", completed: "COMPLETE", cycleOne: "cycle", cycles: "cycles", minutes: "minutes",
    },
  };

  let elapsedBeforeStart = 0;
  let startedAt = 0;
  let animationFrame = null;
  let running = false;
  let finished = false;
  let maxCycles = 2;
  let audioContext = null;
  let language = "tc";

  function text(key) {
    return translations[language][key];
  }

  function actionLabel() {
    if (running) return text("pause");
    return elapsedBeforeStart > 0 ? text("resume") : text("start");
  }

  function updateLanguage() {
    document.documentElement.lang = language === "tc" ? "zh-Hant" : "en";
    document.querySelector(".language-switcher").setAttribute("aria-label", text("language"));
    document.querySelector(".heart-panel").setAttribute("aria-label", text("targetRate"));
    elements.cycleSelector.setAttribute("aria-label", text("maxCyclesAria"));
    elements.cycleBadgeLabel.textContent = text("cycle");
    elements.cycleTimeLabel.textContent = text("cycleTime");
    elements.maxCyclesLabel.textContent = text("maxCycles");
    elements.resetButton.textContent = text("reset");
    elements.doneEyebrow.textContent = text("complete");
    elements.doneResetButton.textContent = text("again");
    elements.rotateNotice.textContent = text("rotate");
    elements.languageButtons.forEach((button) => {
      const selected = button.dataset.language === language;
      button.classList.toggle("is-selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    elements.startButton.textContent = actionLabel();
    render(currentElapsed());
  }

  function selectLanguage(nextLanguage) {
    language = nextLanguage;
    updateLanguage();
  }

  function targetBpm(cycleSecond) {
    if (cycleSecond <= RISE_SECONDS) {
      const progress = cycleSecond / RISE_SECONDS;
      return MIN_BPM + (MAX_BPM - MIN_BPM) * progress;
    }

    const progress = (cycleSecond - RISE_SECONDS) / RECOVERY_SECONDS;
    return MAX_BPM - (MAX_BPM - MIN_BPM) * progress;
  }

  function countdownSeconds(cycleSecond) {
    return Math.max(0, Math.ceil(CYCLE_SECONDS - cycleSecond) - 1);
  }

  function rainbowColor(bpm) {
    const boundedBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));
    const progress = (boundedBpm - MIN_BPM) / (MAX_BPM - MIN_BPM);
    const hue = Math.round(progress * 270);
    return `hsl(${hue} 100% 68%)`;
  }

  function formatTime(seconds) {
    const safeSeconds = Math.max(0, Math.min(CYCLE_SECONDS, Math.floor(seconds)));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function currentElapsed(now = performance.now()) {
    return running ? elapsedBeforeStart + (now - startedAt) / 1000 : elapsedBeforeStart;
  }

  function totalSeconds() {
    return CYCLE_SECONDS * maxCycles;
  }

  function updateCycleControls() {
    const locked = running || elapsedBeforeStart > 0 || finished;
    elements.cycleOptions.forEach((option) => {
      const selected = Number(option.dataset.cycles) === maxCycles;
      option.classList.toggle("is-selected", selected);
      option.setAttribute("aria-pressed", String(selected));
      option.disabled = locked;
    });
  }

  function selectCycles(cycles) {
    if (running || elapsedBeforeStart > 0 || finished) return;
    maxCycles = cycles;
    updateCycleControls();
    render(0);
  }

  function render(elapsed) {
    const workoutSeconds = totalSeconds();
    const boundedElapsed = Math.min(elapsed, workoutSeconds);
    const cycleIndex = Math.min(Math.floor(boundedElapsed / CYCLE_SECONDS), maxCycles - 1);
    const cycleSecond = boundedElapsed === workoutSeconds
      ? CYCLE_SECONDS
      : boundedElapsed % CYCLE_SECONDS;
    const isCountdown = cycleSecond >= COUNTDOWN_START_SECONDS;
    const bpm = boundedElapsed === workoutSeconds ? MIN_BPM : targetBpm(cycleSecond);
    const roundedBpm = Math.round(bpm);
    const displayedValue = isCountdown ? countdownSeconds(cycleSecond) : roundedBpm;

    document.documentElement.style.setProperty("--rate-color", rainbowColor(roundedBpm));
    elements.heartRate.value = displayedValue;
    elements.rateUnit.textContent = isCountdown ? "SEC" : "BPM";
    elements.cycleCount.textContent = `${cycleIndex + 1} / ${maxCycles}`;
    elements.cycleTime.value = `${formatTime(cycleSecond)} / 05:00`;
    elements.progressFill.style.width = `${(cycleSecond / CYCLE_SECONDS) * 100}%`;
    elements.phaseLabel.textContent = finished
      ? text("completed")
      : `${running ? text("ride") : text("ready")} · ${isCountdown ? text("rest") : cycleSecond <= RISE_SECONDS ? text("ramp") : text("recover")}`;
  }

  function tick(now) {
    const elapsed = currentElapsed(now);
    if (elapsed >= totalSeconds()) {
      completeWorkout();
      return;
    }

    render(elapsed);
    animationFrame = requestAnimationFrame(tick);
  }

  function ensureAudio() {
    if (!audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioContext = new AudioContext();
    }
    if (audioContext?.state === "suspended") audioContext.resume();
  }

  function playDoneAlert() {
    if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 600]);
    if (!audioContext) return;

    [0, 0.22, 0.44].forEach((delay, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = [660, 790, 990][index];
      gain.gain.setValueAtTime(0.0001, audioContext.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + 0.2);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start(audioContext.currentTime + delay);
      oscillator.stop(audioContext.currentTime + delay + 0.22);
    });
  }

  function completeWorkout() {
    running = false;
    finished = true;
    elapsedBeforeStart = totalSeconds();
    cancelAnimationFrame(animationFrame);
    render(totalSeconds());
    elements.startButton.textContent = text("start");
    elements.startButton.classList.remove("is-running");
    elements.doneSummary.textContent = `${maxCycles} ${maxCycles === 1 ? text("cycleOne") : text("cycles")} · ${maxCycles * 5} ${text("minutes")}`;
    elements.doneOverlay.hidden = false;
    updateCycleControls();
    playDoneAlert();
  }

  function toggleRunning() {
    if (finished) resetWorkout();
    ensureAudio();

    if (running) {
      elapsedBeforeStart = currentElapsed();
      running = false;
      cancelAnimationFrame(animationFrame);
      elements.startButton.textContent = text("resume");
      elements.startButton.classList.remove("is-running");
      render(elapsedBeforeStart);
      updateCycleControls();
      return;
    }

    running = true;
    startedAt = performance.now();
    elements.startButton.textContent = text("pause");
    elements.startButton.classList.add("is-running");
    updateCycleControls();
    animationFrame = requestAnimationFrame(tick);
  }

  function resetWorkout() {
    running = false;
    finished = false;
    elapsedBeforeStart = 0;
    cancelAnimationFrame(animationFrame);
    elements.startButton.textContent = text("start");
    elements.startButton.classList.remove("is-running");
    elements.doneOverlay.hidden = true;
    updateCycleControls();
    render(0);
  }

  elements.startButton.addEventListener("click", toggleRunning);
  elements.resetButton.addEventListener("click", resetWorkout);
  elements.doneResetButton.addEventListener("click", resetWorkout);
  elements.cycleOptions.forEach((option) => {
    option.addEventListener("click", () => selectCycles(Number(option.dataset.cycles)));
  });
  elements.languageButtons.forEach((button) => {
    button.addEventListener("click", () => selectLanguage(button.dataset.language));
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && running) render(currentElapsed());
  });

  window.GymTimer = {
    constants: { CYCLE_SECONDS, RISE_SECONDS, RECOVERY_SECONDS, COUNTDOWN_START_SECONDS, MIN_BPM, MAX_BPM },
    totalSeconds,
    targetBpm,
    countdownSeconds,
    rainbowColor,
  };

  updateCycleControls();
  updateLanguage();
})();
