const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const timeLeftEl = $("timeLeft");
const suggestionEl = $("suggestion");
const sessionsNumberEl = $("sessionsNumber");
const nowPlayingEl = $("nowPlaying");
const timerRing = $("timerRing");
const trackActionBtn = $("trackActionBtn");

const focusInput = $("focusMinutes");
const breakInput = $("breakMinutes");
const startBtn = $("startBtn");
const stopBtn = $("stopBtn");

const musicSelect = $("musicSelect");
const volumeControl = $("volumeControl");
const volumeLabel = $("volumeLabel");
const customSoundInput = $("customSoundInput");
const uploadSoundBtn = $("uploadSoundBtn");

const settingsBtn = $("settingsBtn");
const openSoundSettings = $("openSoundSettings");
const settingsBackdrop = $("settingsBackdrop");
const closeSettings = $("closeSettings");
const doneSettings = $("doneSettings");
const switchInterval = $("switchInterval");
const intervalLabel = $("intervalLabel");
const customSoundList = $("customSoundList");
const clearCustomSounds = $("clearCustomSounds");

const toast = $("toast");
const bg1 = $("bg1");
const bg2 = $("bg2");
const focusMusic = $("focusMusic");
const endSound = $("endSound");

const ambientSounds = [
  {
    name: "Atlas Deep Focus",
    audio: "audio/atlasaudio-deep-focus.mp3",
    image: "images/mountain.jpeg"
  },
  {
    name: "Deep Focus Music",
    audio: "audio/deep-focus-music.mp3",
    image: "images/Green.jpeg"
  },
  {
    name: "Deep Concentration",
    audio: "audio/leberch-deep-concentration.mp3",
    image: "images/desk.jpeg"
  },
  {
    name: "Leberch Deep Focus",
    audio: "audio/leberch-deep-focus.mp3",
    image: "images/purple.jpeg"
  },
  {
    name: "Ambient Background",
    audio: "audio/lilliben-ambient-background.mp3",
    image: "images/Beach.jpeg"
  },
  {
    name: "Calm",
    audio: "audio/hengjemping-calm.mp3",
    image: "images/rain_glass.jpeg"
  },
  {
    name: "Deep Focus Mode",
    audio: "audio/hengjemping-deep-focus-mode.mp3",
    image: "images/Green2.jpeg"
  },
  {
    name: "Late Night",
    audio: "audio/ronaldoreyz-late-night.mp3",
    image: "images/alone.jpeg"
  },
  {
    name: "Deep House Travel",
    audio: "audio/slan-house-x-deep-house-travel.mp3",
    image: "images/Lightning.jpeg"
  },
  {
    name: "Mountain Deep Focus",
    audio: "audio/the_mountain-deep-focus.mp3",
    image: "images/tiger.jpeg"
  },
  {
    name: "River in the Forest",
    audio: "audio/river-in-the-forest-with-birds.wav",
    image: "images/love.jpeg"
  },
  {
    name: "River Water Flowing",
    audio: "audio/river-water-flowing.wav",
    image: "images/poly.jpeg"
  }
];

const breakSuggestions = [
  "Stand up and stretch your neck and shoulders.",
  "Close your eyes and take 10 slow breaths.",
  "Drink some water away from your screen.",
  "Walk around for a minute or two.",
  "Look at something far away to rest your eyes."
];

let currentBgLayer = 1;
let customSounds = [];
let mode = "idle";
let timerId = null;
let remainingSeconds = 25 * 60;
let sessionTotalSeconds = 25 * 60;
let isPaused = false;
let currentAmbientIndex = -1;

let randomSoundTimerId = null;
let randomSwitchStartedAt = null;
let randomSwitchRemainingMs = null;

let toastTimer = null;

let sessionsCompleted = Number(
  localStorage.getItem("focusBuddySessions") || 0
);

let switchIntervalSeconds = Number(
  localStorage.getItem("focusBuddySwitchInterval") || switchInterval.value
);

switchInterval.value = String(
  Math.min(
    Number(switchInterval.max),
    Math.max(Number(switchInterval.min), switchIntervalSeconds)
  )
);

switchIntervalSeconds = Number(switchInterval.value);
intervalLabel.textContent = `${switchIntervalSeconds}s`;
sessionsNumberEl.textContent = sessionsCompleted;

focusMusic.loop = true;

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
  const secs = (safeSeconds % 60).toString().padStart(2, "0");

  return `${minutes}:${secs}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function setBackground(imagePath) {
  const show = currentBgLayer === 1 ? bg2 : bg1;
  const hide = currentBgLayer === 1 ? bg1 : bg2;

  show.style.backgroundImage = `url("${imagePath}")`;
  show.style.opacity = "1";
  hide.style.opacity = "0";

  currentBgLayer = currentBgLayer === 1 ? 2 : 1;
}

function setDefaultBackground() {
  setBackground("images/background.jpg");
}

function setNowPlaying(name) {
  const display = name || "None";
  nowPlayingEl.textContent = display;
  nowPlayingEl.title = display;
}

function playFocusMusic() {
  focusMusic.play().catch(() => {
    showToast("Your browser blocked audio. Press Start again.");
  });
}

function pauseFocusMusic() {
  focusMusic.pause();
}

function stopAndRewindMusic() {
  focusMusic.pause();
  focusMusic.currentTime = 0;
}

function populateBuiltInSounds() {
  const uploadOption = [...musicSelect.options].find(
    (option) => option.value === "upload"
  );

  ambientSounds.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.audio;
    option.textContent = item.name;

    if (uploadOption) {
      musicSelect.insertBefore(option, uploadOption);
    } else {
      musicSelect.appendChild(option);
    }
  });
}

function playAmbientByIndex(index, shouldPlay = true) {
  if (!ambientSounds.length) return;

  index = (index + ambientSounds.length) % ambientSounds.length;
  currentAmbientIndex = index;

  const ambient = ambientSounds[index];

  focusMusic.pause();
  focusMusic.src = ambient.audio;
  focusMusic.load();
  focusMusic.loop = true;

  setNowPlaying(ambient.name);
  setBackground(ambient.image);

  if (shouldPlay && mode === "focus" && !isPaused) {
    playFocusMusic();
  }
}

function playSelectedManualAmbient() {
  const selectedAudio = musicSelect.value;

  const index = ambientSounds.findIndex(
    (item) => item.audio === selectedAudio
  );

  if (index !== -1) {
    playAmbientByIndex(index);
    return;
  }

  const custom = customSounds.find(
    (item) => item.url === selectedAudio
  );

  if (!custom) return;

  currentAmbientIndex = -1;

  focusMusic.pause();
  focusMusic.src = custom.url;
  focusMusic.load();
  focusMusic.loop = true;

  setNowPlaying(custom.name);
  setDefaultBackground();

  if (mode === "focus" && !isPaused) {
    playFocusMusic();
  }
}

function playNextAmbient() {
  if (!ambientSounds.length) return;

  let currentIndex = ambientSounds.findIndex(
    (item) => item.audio === musicSelect.value
  );

  if (currentIndex === -1) {
    currentIndex = currentAmbientIndex;
  }

  if (currentIndex < 0) {
    currentIndex = -1;
  }

  const nextIndex = (currentIndex + 1) % ambientSounds.length;
  const nextAmbient = ambientSounds[nextIndex];

  musicSelect.value = nextAmbient.audio;

  clearRandomSoundTimer();
  playAmbientByIndex(nextIndex);
  updateTrackActionButton();
}

function chooseRandomAmbientIndex() {
  if (!ambientSounds.length) return -1;
  if (ambientSounds.length === 1) return 0;

  let index;

  do {
    index = Math.floor(Math.random() * ambientSounds.length);
  } while (index === currentAmbientIndex);

  return index;
}

function clearRandomSoundTimer() {
  if (!randomSoundTimerId) return;

  clearTimeout(randomSoundTimerId);
  randomSoundTimerId = null;
}

function scheduleRandomSwitch(delayMs) {
  clearRandomSoundTimer();

  randomSwitchRemainingMs = delayMs;
  randomSwitchStartedAt = Date.now();

  randomSoundTimerId = setTimeout(() => {
    randomSoundTimerId = null;

    if (
      mode === "focus" &&
      !isPaused &&
      musicSelect.value === "random"
    ) {
      switchRandomAmbient();
    }
  }, delayMs);
}

function switchRandomAmbient() {
  const index = chooseRandomAmbientIndex();

  if (index === -1) return;

  playAmbientByIndex(index);

  scheduleRandomSwitch(
    switchIntervalSeconds * 1000
  );
}

function startRandomSoundCycle() {
  clearRandomSoundTimer();

  const index = chooseRandomAmbientIndex();

  if (index === -1) return;

  playAmbientByIndex(index);

  scheduleRandomSwitch(
    switchIntervalSeconds * 1000
  );
}

function pauseRandomSwitchTimer() {
  if (
    !randomSoundTimerId ||
    randomSwitchStartedAt === null ||
    randomSwitchRemainingMs === null
  ) {
    return;
  }

  const elapsed = Date.now() - randomSwitchStartedAt;

  randomSwitchRemainingMs = Math.max(
    0,
    randomSwitchRemainingMs - elapsed
  );

  clearRandomSoundTimer();
  randomSwitchStartedAt = null;
}

function resumeRandomSwitchTimer() {
  if (
    musicSelect.value !== "random" ||
    mode !== "focus"
  ) {
    return;
  }

  let remaining = randomSwitchRemainingMs;

  if (remaining === null || remaining <= 0) {
    remaining = switchIntervalSeconds * 1000;
  }

  scheduleRandomSwitch(remaining);
}

function updateTrackActionButton() {
  if (mode !== "focus") {
    trackActionBtn.disabled = true;
    trackActionBtn.textContent = "Change";
    return;
  }

  trackActionBtn.disabled = false;

  trackActionBtn.textContent =
    musicSelect.value === "random"
      ? "Switch"
      : "Change";
}

trackActionBtn.addEventListener("click", () => {
  if (mode !== "focus") return;

  if (musicSelect.value === "random") {
    switchRandomAmbient();
  } else {
    playNextAmbient();
  }
});

function syncCustomList() {
  customSoundList.innerHTML = "";

  if (!customSounds.length) {
    const empty = document.createElement("li");
    empty.textContent = "No custom sounds uploaded yet.";
    customSoundList.appendChild(empty);
    return;
  }

  customSounds.forEach((item) => {
    const li = document.createElement("li");

    const nameSpan = document.createElement("span");
    nameSpan.className = "sound-name";
    nameSpan.textContent = item.name;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.type = "button";
    deleteBtn.textContent = "✕";

    deleteBtn.addEventListener("click", () => {
      removeCustomSound(item.id);
    });

    li.append(nameSpan, deleteBtn);
    customSoundList.appendChild(li);
  });
}

function addCustomOption(item) {
  const option = document.createElement("option");
  option.value = item.url;
  option.dataset.customId = item.id;
  option.textContent = `📌 ${item.name}`;

  musicSelect.appendChild(option);
}

function removeCustomSound(id) {
  const item = customSounds.find(
    (sound) => sound.id === id
  );

  if (!item) return;

  if (musicSelect.value === item.url) {
    musicSelect.value = "random";

    if (mode === "focus") {
      startRandomSoundCycle();
    } else {
      setNowPlaying("None");
      setDefaultBackground();
    }
  }

  const option = [...musicSelect.options].find(
    (opt) => opt.dataset.customId === id
  );

  if (option) {
    option.remove();
  }

  URL.revokeObjectURL(item.url);

  customSounds = customSounds.filter(
    (sound) => sound.id !== id
  );

  syncCustomList();
  updateTrackActionButton();
  showToast("Custom sound removed.");
}

function openUploadDialog() {
  customSoundInput.value = "";
  customSoundInput.click();
}

customSoundInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    url: URL.createObjectURL(file)
  };

  customSounds.push(item);
  addCustomOption(item);
  syncCustomList();

  musicSelect.value = item.url;

  clearRandomSoundTimer();

  currentAmbientIndex = -1;

  focusMusic.pause();
  focusMusic.src = item.url;
  focusMusic.load();
  focusMusic.loop = true;

  setNowPlaying(item.name);
  setDefaultBackground();

  if (mode === "focus" && !isPaused) {
    playFocusMusic();
  }

  updateTrackActionButton();
  showToast(`${item.name} added.`);
});

musicSelect.addEventListener("change", () => {
  const value = musicSelect.value;

  if (value === "upload") {
    musicSelect.value = "random";
    openUploadDialog();
    updateTrackActionButton();
    return;
  }

  clearRandomSoundTimer();

  randomSwitchRemainingMs = null;
  randomSwitchStartedAt = null;

  if (value === "random") {
    if (mode === "focus" && !isPaused) {
      startRandomSoundCycle();
    } else if (mode === "focus" && isPaused) {
      const index = chooseRandomAmbientIndex();

      if (index !== -1) {
        playAmbientByIndex(index, false);
      }

      randomSwitchRemainingMs =
        switchIntervalSeconds * 1000;
    } else {
      setNowPlaying("None");
      setDefaultBackground();
    }

    updateTrackActionButton();
    return;
  }

  playSelectedManualAmbient();
  updateTrackActionButton();
});

clearCustomSounds.addEventListener("click", () => {
  customSounds.forEach((item) => {
    URL.revokeObjectURL(item.url);
  });

  customSounds = [];

  [...musicSelect.options]
    .filter((option) => option.dataset.customId)
    .forEach((option) => option.remove());

  syncCustomList();

  showToast("Uploaded sounds cleared.");
});

function getDurationForMode(currentMode) {
  const value =
    currentMode === "focus"
      ? Number.parseInt(focusInput.value, 10)
      : Number.parseInt(breakInput.value, 10);

  return value * 60;
}

function validateDurations() {
  const focus = Number.parseInt(focusInput.value, 10);
  const rest = Number.parseInt(breakInput.value, 10);

  if (
    !Number.isFinite(focus) ||
    !Number.isFinite(rest) ||
    focus <= 0 ||
    rest <= 0
  ) {
    showToast("Enter positive focus and break durations.");
    return false;
  }

  return true;
}

function updateProgressRing() {
  let progress = 0;

  if (sessionTotalSeconds > 0) {
    progress =
      1 -
      remainingSeconds / sessionTotalSeconds;
  }

  progress = Math.min(
    1,
    Math.max(0, progress)
  );

  timerRing.style.setProperty(
    "--progress",
    `${progress * 360}deg`
  );
}

function updateUI() {
  if (mode === "focus") {
    statusEl.textContent =
      isPaused ? "Focus paused" : "Focus";
  } else if (mode === "break") {
    statusEl.textContent =
      isPaused ? "Break paused" : "Break";
  } else {
    statusEl.textContent = "Idle";
  }

  timeLeftEl.textContent =
    formatTime(remainingSeconds);

  updateProgressRing();

  if (mode === "idle") {
    startBtn.textContent = "Start Focus";
  } else if (isPaused) {
    startBtn.textContent = "Resume";
  } else {
    startBtn.textContent = "Pause";
  }

  document.title =
    mode === "idle"
      ? "Focus Buddy"
      : `${formatTime(remainingSeconds)} · ${mode}`;

  updateTrackActionButton();
}

function startSelectedMusic() {
  const selection = musicSelect.value;

  if (selection === "random") {
    startRandomSoundCycle();
    return;
  }

  if (selection === "upload") return;

  playSelectedManualAmbient();
}

function beginFocusSession() {
  mode = "focus";
  isPaused = false;

  remainingSeconds =
    getDurationForMode("focus");

  sessionTotalSeconds =
    remainingSeconds;

  suggestionEl.textContent =
    "Stay with one task until the timer ends.";

  startSelectedMusic();
  updateUI();
  scheduleTick();
}

function toggleTimer() {
  if (mode === "idle") {
    if (!validateDurations()) return;

    beginFocusSession();
    return;
  }

  if (!isPaused) {
    isPaused = true;

    clearTimeout(timerId);
    timerId = null;

    pauseFocusMusic();

    if (
      mode === "focus" &&
      musicSelect.value === "random"
    ) {
      pauseRandomSwitchTimer();
    }

    updateUI();
    return;
  }

  isPaused = false;

  if (mode === "focus") {
    playFocusMusic();

    if (musicSelect.value === "random") {
      resumeRandomSwitchTimer();
    }
  }

  updateUI();
  scheduleTick();
}

function resetTimer() {
  mode = "idle";
  isPaused = false;

  clearTimeout(timerId);
  timerId = null;

  clearRandomSoundTimer();

  randomSwitchRemainingMs = null;
  randomSwitchStartedAt = null;

  stopAndRewindMusic();

  remainingSeconds =
    Math.max(
      1,
      Number.parseInt(focusInput.value, 10) || 25
    ) * 60;

  sessionTotalSeconds =
    remainingSeconds;

  suggestionEl.textContent =
    "Choose your focus session and press Start.";

  setNowPlaying("None");
  setDefaultBackground();

  currentAmbientIndex = -1;

  updateUI();
}

function switchMode() {
  endSound.currentTime = 0;
  endSound.play().catch(() => {});

  if (mode === "focus") {
    sessionsCompleted += 1;

    localStorage.setItem(
      "focusBuddySessions",
      String(sessionsCompleted)
    );

    sessionsNumberEl.textContent =
      sessionsCompleted;

    mode = "break";

    remainingSeconds =
      getDurationForMode("break");

    sessionTotalSeconds =
      remainingSeconds;

    clearRandomSoundTimer();
    stopAndRewindMusic();

    setNowPlaying("None");
    setDefaultBackground();

    suggestionEl.textContent =
      breakSuggestions[
        Math.floor(
          Math.random() * breakSuggestions.length
        )
      ];
  } else {
    mode = "focus";

    remainingSeconds =
      getDurationForMode("focus");

    sessionTotalSeconds =
      remainingSeconds;

    suggestionEl.textContent =
      "New focus round. Keep going.";

    startSelectedMusic();
  }

  updateUI();
}

function scheduleTick() {
  clearTimeout(timerId);

  if (mode === "idle" || isPaused) {
    return;
  }

  timerId = setTimeout(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      updateUI();
      switchMode();
    }

    scheduleTick();
  }, 1000);
}

function updateIdlePreview() {
  if (mode !== "idle") return;

  const focus =
    Number.parseInt(
      focusInput.value,
      10
    );

  if (
    Number.isFinite(focus) &&
    focus > 0
  ) {
    remainingSeconds = focus * 60;
    sessionTotalSeconds = remainingSeconds;
    updateUI();
  }
}

function openSettings() {
  settingsBackdrop.classList.remove("hidden");
}

function closeSettingsModal() {
  settingsBackdrop.classList.add("hidden");
}

startBtn.addEventListener("click", toggleTimer);
stopBtn.addEventListener("click", resetTimer);

focusInput.addEventListener("input", updateIdlePreview);
breakInput.addEventListener("input", updateIdlePreview);

settingsBtn.addEventListener("click", openSettings);
openSoundSettings.addEventListener("click", openSettings);
closeSettings.addEventListener("click", closeSettingsModal);
doneSettings.addEventListener("click", closeSettingsModal);

settingsBackdrop.addEventListener("click", (event) => {
  if (event.target === settingsBackdrop) {
    closeSettingsModal();
  }
});

uploadSoundBtn.addEventListener("click", openUploadDialog);

switchInterval.addEventListener("input", () => {
  switchIntervalSeconds =
    Number.parseInt(
      switchInterval.value,
      10
    );

  intervalLabel.textContent =
    `${switchIntervalSeconds}s`;

  localStorage.setItem(
    "focusBuddySwitchInterval",
    String(switchIntervalSeconds)
  );

  if (
    mode === "focus" &&
    !isPaused &&
    musicSelect.value === "random"
  ) {
    scheduleRandomSwitch(
      switchIntervalSeconds * 1000
    );
  } else if (
    mode === "focus" &&
    isPaused &&
    musicSelect.value === "random"
  ) {
    randomSwitchRemainingMs =
      switchIntervalSeconds * 1000;
  }
});

volumeControl.addEventListener("input", () => {
  const value =
    Number(volumeControl.value);

  const volume =
    value / 100;

  focusMusic.volume = volume;
  endSound.volume = volume;

  volumeLabel.textContent =
    `${value}%`;

  localStorage.setItem(
    "focusBuddyVolume",
    String(value)
  );
});

const savedVolume = Number(
  localStorage.getItem("focusBuddyVolume")
);

if (
  Number.isFinite(savedVolume) &&
  savedVolume >= 0 &&
  savedVolume <= 100
) {
  volumeControl.value =
    String(savedVolume);
}

volumeControl.dispatchEvent(
  new Event("input")
);

document.addEventListener("keydown", (event) => {
  const tag =
    document.activeElement?.tagName;

  const typing =
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA";

  if (
    event.key === "Escape" &&
    !settingsBackdrop.classList.contains("hidden")
  ) {
    closeSettingsModal();
    return;
  }

  if (
    typing ||
    !settingsBackdrop.classList.contains("hidden")
  ) {
    return;
  }

  if (event.code === "Space") {
    event.preventDefault();
    toggleTimer();
  }

  if (event.key.toLowerCase() === "r") {
    resetTimer();
  }
});

window.addEventListener("beforeunload", () => {
  customSounds.forEach((item) => {
    URL.revokeObjectURL(item.url);
  });
});

populateBuiltInSounds();
syncCustomList();
setNowPlaying("None");
updateUI();