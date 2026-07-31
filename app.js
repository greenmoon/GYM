(() => {
  "use strict";

  const CYCLE_SECONDS = 300;
  const RISE_SECONDS = 210;
  const MIN_BPM = 90;
  const MAX_BPM = 110;

  const elements = {
    heartRate: document.querySelector("#heart-rate"),
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
  };

  let elapsedBeforeStart = 0;
  let startedAt = 0;
  let animationFrame = null;
  let running = false;
  let finished = false;
  let maxCycles = 2;
  let audioContext = null;

  function targetBpm(cycleSecond) {
    if (cycleSecond <= RISE_SECONDS) {
      const progress = cycleSecond / RISE_SECONDS;
      return MIN_BPM + (MAX_BPM - MIN_BPM) * progress;
    }

    const progress = (cycleSecond - RISE_SECONDS) / (CYCLE_SECONDS - RISE_SECONDS);
    return MAX_BPM - (MAX_BPM - MIN_BPM) * progress;
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
    const bpm = boundedElapsed === workoutSeconds ? MIN_BPM : targetBpm(cycleSecond);
    const rising = cycleSecond <= RISE_SECONDS;

    const roundedBpm = Math.round(bpm);
    document.documentElement.style.setProperty("--rate-color", rainbowColor(roundedBpm));
    elements.heartRate.value = roundedBpm;
    elements.cycleCount.textContent = `${cycleIndex + 1} / ${maxCycles}`;
    elements.cycleTime.value = `${formatTime(cycleSecond)} / 05:00`;
    elements.progressFill.style.width = `${(cycleSecond / CYCLE_SECONDS) * 100}%`;
    elements.phaseLabel.textContent = finished
      ? "COMPLETE"
      : `${running ? "RIDE" : "READY"} · ${rising ? "RAMP UP" : "RECOVER"}`;
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
    elements.startButton.textContent = "START";
    elements.startButton.classList.remove("is-running");
    elements.doneSummary.textContent = `${maxCycles} ${maxCycles === 1 ? "cycle" : "cycles"} · ${maxCycles * 5} minutes`;
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
      elements.startButton.textContent = "RESUME";
      elements.startButton.classList.remove("is-running");
      render(elapsedBeforeStart);
      updateCycleControls();
      return;
    }

    running = true;
    startedAt = performance.now();
    elements.startButton.textContent = "PAUSE";
    elements.startButton.classList.add("is-running");
    updateCycleControls();
    animationFrame = requestAnimationFrame(tick);
  }

  function resetWorkout() {
    running = false;
    finished = false;
    elapsedBeforeStart = 0;
    cancelAnimationFrame(animationFrame);
    elements.startButton.textContent = "START";
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
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && running) render(currentElapsed());
  });

  window.GymTimer = {
    constants: { CYCLE_SECONDS, RISE_SECONDS, MIN_BPM, MAX_BPM },
    totalSeconds,
    targetBpm,
    rainbowColor,
  };

  updateCycleControls();
  render(0);
})();
