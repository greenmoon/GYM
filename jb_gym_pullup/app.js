(() => {
  "use strict";

  const settings = { n: 4, n1: 2, m: 4 };
  const exercisePresets = {
    pullup: { n: 4, n1: 2 },
    squat: { n: 5, n1: 2.5 },
  };
  const limits = { n: [1, 7], m: [1, 5] };
  const copy = {
    tc: {
      htmlLang: "zh-Hant", creator: "· Kevin 製作", languageAria: "語言",
      minute: "分鐘", ready: "準備", working: "運動中", rest: "休息", resting: "休息中", complete: "完成",
      totalLeft: "剩餘總時間", cycle: "循環", nCycle: "N · 每循環", mCycles: "M · 循環次數",
      start: "開始", pause: "暫停", resume: "繼續", reset: "重設", doneMessage: "運動完成", again: "再來一次",
      currentTimeAria: "現在時間", exerciseAria: "運動模式", pullupAria: "引體向上模式", squatAria: "深蹲模式", phaseAria: "目前階段倒數", totalAria: "訓練總進度", controlsAria: "訓練設定",
      adjustAria: {
        "n:-1": "減少每循環分鐘", "n:1": "增加每循環分鐘",
        "n1:-0.5": "減少運動時間", "n1:0.5": "增加運動時間",
        "m:-1": "減少循環次數", "m:1": "增加循環次數",
      },
    },
    en: {
      htmlLang: "en", creator: "· Created by Kevin", languageAria: "Language",
      minute: "MIN", ready: "READY", working: "WORK", rest: "REST", resting: "RESTING", complete: "COMPLETE",
      totalLeft: "TOTAL LEFT", cycle: "CYCLE", nCycle: "N · CYCLE", mCycles: "M · CYCLES",
      start: "START", pause: "PAUSE", resume: "RESUME", reset: "RESET", doneMessage: "WORKOUT COMPLETE", again: "AGAIN",
      currentTimeAria: "Current time", exerciseAria: "Exercise mode", pullupAria: "Pull-up mode", squatAria: "Squat mode", phaseAria: "Current phase countdown", totalAria: "Workout progress", controlsAria: "Workout settings",
      adjustAria: {
        "n:-1": "Decrease cycle minutes", "n:1": "Increase cycle minutes",
        "n1:-0.5": "Decrease work time", "n1:0.5": "Increase work time",
        "m:-1": "Decrease cycle count", "m:1": "Increase cycle count",
      },
    },
  };
  const elements = {
    app: document.querySelector(".app"),
    creatorLabel: document.querySelector("#creator-label"),
    currentTime: document.querySelector("#current-time"),
    languageSwitch: document.querySelector(".language-switch"),
    languageButtons: [...document.querySelectorAll("[data-lang]")],
    exerciseSwitch: document.querySelector("#exercise-switch"),
    exerciseButtons: [...document.querySelectorAll("[data-exercise]")],
    phasePanel: document.querySelector("#phase-panel"),
    phaseLabel: document.querySelector("#phase-label"),
    phaseTime: document.querySelector("#phase-time"),
    splitLabel: document.querySelector("#split-label"),
    totalPanel: document.querySelector(".total-panel"),
    totalLabel: document.querySelector("#total-label"),
    totalTime: document.querySelector("#total-time"),
    cycleLabel: document.querySelector("#cycle-label"),
    formula: document.querySelector("#formula"),
    controlsPanel: document.querySelector(".controls-panel"),
    nSettingLabel: document.querySelector("#n-setting-label"),
    nValue: document.querySelector("#n-value"),
    nUnit: document.querySelector("#n-unit"),
    n1Value: document.querySelector("#n1-value"),
    n1Unit: document.querySelector("#n1-unit"),
    workSetting: document.querySelector("#work-setting"),
    workSettingLabel: document.querySelector("#work-setting-label"),
    n2Value: document.querySelector("#n2-value"),
    n2Unit: document.querySelector("#n2-unit"),
    restSetting: document.querySelector("#rest-setting"),
    restSettingLabel: document.querySelector("#rest-setting-label"),
    mSettingLabel: document.querySelector("#m-setting-label"),
    mValue: document.querySelector("#m-value"),
    adjustButtons: [...document.querySelectorAll("[data-adjust]")],
    startButton: document.querySelector("#start-button"),
    resetButton: document.querySelector("#reset-button"),
    doneOverlay: document.querySelector("#done-overlay"),
    doneResetButton: document.querySelector("#done-reset-button"),
    doneMessage: document.querySelector("#done-message"),
    doneTitle: document.querySelector("#done-title"),
    doneSummary: document.querySelector("#done-summary"),
  };

  let language = "tc";
  let exerciseMode = "pullup";
  let elapsedBeforeStart = 0;
  let startedAt = 0;
  let animationFrame = null;
  let running = false;
  let finished = false;
  let audioContext = null;
  let lastSecond = null;
  let lastPhase = "ready";

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

  function phaseAtElapsed(elapsed) {
    return elapsed % cycleSeconds() < workSeconds() ? "work" : "rest";
  }

  function getText() {
    return copy[language];
  }

  function updateClock() {
    const now = new Date();
    elements.currentTime.dateTime = now.toISOString();
    elements.currentTime.textContent = [now.getHours(), now.getMinutes(), now.getSeconds()]
      .map((value) => String(value).padStart(2, "0"))
      .join(":");
    window.setTimeout(updateClock, 1000 - now.getMilliseconds());
  }

  function updateStartButton() {
    const text = getText();
    elements.startButton.textContent = running ? text.pause : elapsedBeforeStart > 0 && !finished ? text.resume : text.start;
  }

  function updateDoneSummary() {
    elements.doneSummary.textContent = language === "tc"
      ? `${settings.m} 個循環 · ${settings.n * settings.m} 分鐘`
      : `${settings.m} cycles · ${settings.n * settings.m} minutes`;
  }

  function updateLanguage() {
    const text = getText();
    document.documentElement.lang = text.htmlLang;
    elements.currentTime.setAttribute("aria-label", text.currentTimeAria);
    elements.languageSwitch.setAttribute("aria-label", text.languageAria);
    elements.languageButtons.forEach((button) => {
      const active = button.dataset.lang === language;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    elements.exerciseSwitch.setAttribute("aria-label", text.exerciseAria);
    elements.exerciseButtons.forEach((button) => {
      button.setAttribute("aria-label", button.dataset.exercise === "pullup" ? text.pullupAria : text.squatAria);
    });
    elements.creatorLabel.textContent = text.creator;
    elements.phasePanel.setAttribute("aria-label", text.phaseAria);
    elements.totalPanel.setAttribute("aria-label", text.totalAria);
    elements.controlsPanel.setAttribute("aria-label", text.controlsAria);
    elements.totalLabel.textContent = text.totalLeft;
    elements.nSettingLabel.textContent = text.nCycle;
    elements.mSettingLabel.textContent = text.mCycles;
    elements.nUnit.textContent = text.minute;
    elements.n1Unit.textContent = text.minute;
    elements.n2Unit.textContent = text.minute;
    elements.resetButton.textContent = text.reset;
    elements.doneMessage.textContent = text.doneMessage;
    elements.doneTitle.textContent = text.complete;
    elements.doneResetButton.textContent = text.again;
    elements.adjustButtons.forEach((button) => {
      button.setAttribute("aria-label", text.adjustAria[`${button.dataset.adjust}:${button.dataset.delta}`]);
    });
    updateStartButton();
    updateDoneSummary();
    updateSettings();
    render(currentElapsed());
  }

  function setLanguage(nextLanguage) {
    if (!copy[nextLanguage] || nextLanguage === language) return;
    language = nextLanguage;
    updateLanguage();
  }

  function updateSettings() {
    const text = getText();
    const settingsLocked = running || elapsedBeforeStart > 0 || finished;
    elements.nValue.value = settings.n;
    elements.n1Value.value = formatMinutes(settings.n1);
    elements.n2Value.value = formatMinutes(n2Minutes());
    elements.mValue.value = settings.m;
    elements.formula.textContent = `${settings.n} × ${settings.m} = ${settings.n * settings.m} ${text.minute}`;
    elements.adjustButtons.forEach((button) => { button.disabled = settingsLocked; });
    elements.exerciseButtons.forEach((button) => {
      const active = button.dataset.exercise === exerciseMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = settingsLocked;
    });
  }

  function setExerciseMode(nextMode) {
    if (!exercisePresets[nextMode] || running || elapsedBeforeStart > 0 || finished) return;
    exerciseMode = nextMode;
    settings.n = exercisePresets[nextMode].n;
    settings.n1 = exercisePresets[nextMode].n1;
    updateSettings();
    render(0);
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
    const text = getText();
    const bounded = Math.min(elapsed, totalSeconds());
    const complete = bounded >= totalSeconds();
    const cycleIndex = complete ? settings.m - 1 : Math.floor(bounded / cycleSeconds());
    const inCycle = complete ? cycleSeconds() : bounded % cycleSeconds();
    const isWork = inCycle < workSeconds() && !complete;
    const phaseEnd = isWork ? workSeconds() : cycleSeconds();
    const phaseRemaining = complete ? 0 : phaseEnd - inCycle;
    const workActive = running && isWork;
    const restActive = running && !isWork && !complete;

    elements.workSetting.classList.toggle("is-active", workActive);
    elements.workSettingLabel.textContent = `N1 · ${text.working}`;
    elements.restSetting.classList.toggle("is-active", restActive);
    elements.restSettingLabel.textContent = `N2 · ${restActive ? text.resting : text.rest}`;
    elements.phasePanel.classList.toggle("is-work", isWork && (running || elapsedBeforeStart > 0));
    elements.phasePanel.classList.toggle("is-rest", !isWork && !complete);
    elements.phaseLabel.textContent = complete ? text.complete : running || elapsedBeforeStart > 0 ? (isWork ? text.working : text.rest) : text.ready;
    elements.phaseTime.value = formatTime(phaseRemaining || (elapsedBeforeStart === 0 ? workSeconds() : 0));
    elements.splitLabel.textContent = isWork
      ? `N1 ${text.working} ${formatMinutes(settings.n1)} ${text.minute}`
      : `N2 ${text.rest} ${formatMinutes(n2Minutes())} ${text.minute}`;
    elements.totalTime.value = formatTime(totalSeconds() - bounded);
    elements.cycleLabel.textContent = `${text.cycle} ${cycleIndex + 1} / ${settings.m}`;
  }

  function tick(now) {
    const elapsed = currentElapsed(now);
    if (elapsed >= totalSeconds()) return completeWorkout();
    const phase = phaseAtElapsed(elapsed);
    if (lastPhase === "rest" && phase === "work") playCricketChirp();
    lastPhase = phase;
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

  function playCricketChirp() {
    if (!audioContext) return;
    const start = audioContext.currentTime;
    const chirpDuration = 3;
    const chirpEnd = start + chirpDuration;
    const clusterSpacing = 0.4;
    const pulseDuration = 0.05;
    const pulseOffsets = [0, 0.055, 0.11, 0.165];
    let pulseIndex = 0;

    for (let clusterStart = 0; clusterStart < chirpDuration; clusterStart += clusterSpacing) {
      pulseOffsets.forEach((offset) => {
        const pulseStart = start + clusterStart + offset;
        if (pulseStart >= chirpEnd) return;
        const pulseEnd = Math.min(pulseStart + pulseDuration, chirpEnd);
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(pulseIndex % 4 === 1 ? 4300 : 3700, pulseStart);
        oscillator.frequency.exponentialRampToValueAtTime(3200, pulseEnd);
        gain.gain.setValueAtTime(0.0001, pulseStart);
        gain.gain.exponentialRampToValueAtTime(0.14, Math.min(pulseStart + 0.006, pulseEnd));
        gain.gain.exponentialRampToValueAtTime(0.0001, pulseEnd);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(pulseStart);
        oscillator.stop(pulseEnd);
        pulseIndex += 1;
      });
    }
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
    lastPhase = "complete";
    elapsedBeforeStart = totalSeconds();
    cancelAnimationFrame(animationFrame);
    render(totalSeconds());
    updateStartButton();
    elements.startButton.classList.remove("is-running");
    updateDoneSummary();
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
      elements.startButton.classList.remove("is-running");
      render(elapsedBeforeStart);
    } else {
      const startingFresh = elapsedBeforeStart === 0;
      running = true;
      startedAt = performance.now();
      lastPhase = phaseAtElapsed(elapsedBeforeStart);
      if (startingFresh) playCricketChirp();
      elements.startButton.classList.add("is-running");
      animationFrame = requestAnimationFrame(tick);
    }
    updateStartButton();
    updateSettings();
  }

  function resetWorkout() {
    running = false;
    finished = false;
    elapsedBeforeStart = 0;
    lastSecond = null;
    lastPhase = "ready";
    cancelAnimationFrame(animationFrame);
    updateStartButton();
    elements.startButton.classList.remove("is-running");
    elements.doneOverlay.hidden = true;
    updateSettings();
    render(0);
  }

  elements.adjustButtons.forEach((button) => button.addEventListener("click", () => {
    adjustSetting(button.dataset.adjust, Number(button.dataset.delta));
  }));
  elements.languageButtons.forEach((button) => button.addEventListener("click", () => setLanguage(button.dataset.lang)));
  elements.exerciseButtons.forEach((button) => button.addEventListener("click", () => setExerciseMode(button.dataset.exercise)));
  elements.startButton.addEventListener("click", toggleRunning);
  elements.resetButton.addEventListener("click", resetWorkout);
  elements.doneResetButton.addEventListener("click", resetWorkout);
  document.addEventListener("visibilitychange", () => { if (!document.hidden && running) render(currentElapsed()); });

  window.GymTimer = { settings, n2Minutes, cycleSeconds, workSeconds, totalSeconds, formatTime, setLanguage, getLanguage: () => language, getExerciseMode: () => exerciseMode };
  updateClock();
  updateLanguage();
})();
