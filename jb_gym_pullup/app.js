(() => {
  "use strict";

  const settings = { n: 4, n1: 2, m: 4 };
  const limits = { n: [1, 7], m: [1, 5] };
  const elements = {
    app: document.querySelector(".app"),
    phasePanel: document.querySelector("#phase-panel"),
    phaseLabel: document.querySelector("#phase-label"),
    phaseTime: document.querySelector("#phase-time"),
    splitLabel: document.querySelector("#split-label"),
    totalTime: document.querySelector("#total-time"),
    cycleLabel: document.querySelector("#cycle-label"),
    formula: document.querySelector("#formula"),
    nValue: document.querySelector("#n-value"),
    n1Value: document.querySelector("#n1-value"),
    n2Value: document.querySelector("#n2-value"),
    mValue: document.querySelector("#m-value"),
    adjustButtons: [...document.querySelectorAll("[data-adjust]")],
    startButton: document.querySelector("#start-button"),
    resetButton: document.querySelector("#reset-button"),
    doneOverlay: document.querySelector("#done-overlay"),
    doneResetButton: document.querySelector("#done-reset-button"),
    doneSummary: document.querySelector("#done-summary"),
  };

  let elapsedBeforeStart = 0;
  let startedAt = 0;
  let animationFrame = null;
  let running = false;
  let finished = false;
  let audioContext = null;
  let lastSecond = null;

  const n2Minutes = () => settings.n - settings.n1;
  const cycleSeconds = () => settings.n * 60;
  const workSeconds = () => settings.n1 * 60;
  const totalSeconds = () => cycleSeconds() * settings.m;

  function formatMinutes(value) {
    return Number.isInteger(value) ? String(value) : value.toFixed(1);
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.ceil(seconds));
    return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
  }

  function currentElapsed(now = performance.now()) {
    return running ? elapsedBeforeStart + (now - startedAt) / 1000 : elapsedBeforeStart;
  }

  function updateSettings() {
    elements.nValue.value = settings.n;
    elements.n1Value.value = formatMinutes(settings.n1);
    elements.n2Value.value = formatMinutes(n2Minutes());
    elements.mValue.value = settings.m;
    elements.formula.textContent = `${settings.n} × ${settings.m} = ${settings.n * settings.m} MIN`;
    elements.adjustButtons.forEach((button) => { button.disabled = running || elapsedBeforeStart > 0 || finished; });
  }

  function adjustSetting(name, delta) {
    if (running || elapsedBeforeStart > 0 || finished) return;
    if (name === "n") {
      settings.n = Math.max(limits.n[0], Math.min(limits.n[1], settings.n + delta));
      settings.n1 = Math.min(settings.n1, settings.n - 0.5);
      settings.n1 = Math.max(0.5, settings.n1);
    } else if (name === "m") {
      settings.m = Math.max(limits.m[0], Math.min(limits.m[1], settings.m + delta));
    } else {
      settings.n1 = Math.max(0.5, Math.min(settings.n - 0.5, settings.n1 + delta));
    }
    updateSettings();
    render(0);
  }

  function render(elapsed) {
    const bounded = Math.min(elapsed, totalSeconds());
    const complete = bounded >= totalSeconds();
    const cycleIndex = complete ? settings.m - 1 : Math.floor(bounded / cycleSeconds());
    const inCycle = complete ? cycleSeconds() : bounded % cycleSeconds();
    const isWork = inCycle < workSeconds() && !complete;
    const phaseEnd = isWork ? workSeconds() : cycleSeconds();
    const phaseRemaining = complete ? 0 : phaseEnd - inCycle;

    elements.phasePanel.classList.toggle("is-work", isWork && (running || elapsedBeforeStart > 0));
    elements.phasePanel.classList.toggle("is-rest", !isWork && !complete);
    elements.phaseLabel.textContent = complete ? "COMPLETE" : running || elapsedBeforeStart > 0 ? (isWork ? "WORK" : "REST") : "READY";
    elements.phaseTime.value = formatTime(phaseRemaining || (elapsedBeforeStart === 0 ? workSeconds() : 0));
    elements.splitLabel.textContent = isWork
      ? `N1 WORK ${formatMinutes(settings.n1)} MIN`
      : `N2 REST ${formatMinutes(n2Minutes())} MIN`;
    elements.totalTime.value = formatTime(totalSeconds() - bounded);
    elements.cycleLabel.textContent = `CYCLE ${cycleIndex + 1} / ${settings.m}`;
  }

  function tick(now) {
    const elapsed = currentElapsed(now);
    if (elapsed >= totalSeconds()) return completeWorkout();
    const second = Math.ceil(elapsed);
    if (second !== lastSecond) {
      lastSecond = second;
      render(elapsed);
    }
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
    elements.doneSummary.textContent = `${settings.m} cycles · ${settings.n * settings.m} minutes`;
    elements.doneOverlay.hidden = false;
    updateSettings();
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
    } else {
      running = true;
      startedAt = performance.now();
      elements.startButton.textContent = "PAUSE";
      elements.startButton.classList.add("is-running");
      animationFrame = requestAnimationFrame(tick);
    }
    updateSettings();
  }

  function resetWorkout() {
    running = false;
    finished = false;
    elapsedBeforeStart = 0;
    lastSecond = null;
    cancelAnimationFrame(animationFrame);
    elements.startButton.textContent = "START";
    elements.startButton.classList.remove("is-running");
    elements.doneOverlay.hidden = true;
    updateSettings();
    render(0);
  }

  elements.adjustButtons.forEach((button) => button.addEventListener("click", () => {
    adjustSetting(button.dataset.adjust, Number(button.dataset.delta));
  }));
  elements.startButton.addEventListener("click", toggleRunning);
  elements.resetButton.addEventListener("click", resetWorkout);
  elements.doneResetButton.addEventListener("click", resetWorkout);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && running) render(currentElapsed()); });

  window.GymTimer = { settings, n2Minutes, cycleSeconds, workSeconds, totalSeconds, formatTime };
  updateSettings();
  render(0);
})();
