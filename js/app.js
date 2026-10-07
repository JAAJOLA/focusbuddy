const $ = (id) => document.getElementById(id);

const statusEl = $("status");
const timeLeftEl = $("timeLeft");
const suggestionEl = $("suggestion");
const sessionsNumberEl = $("sessionsNumber");
const nowPlayingEl = $("nowPlaying");
const nowPlayingCard = $("nowPlayingCard");
const timerRing = $("timerRing");
const focusInput = $("focusMinutes");
const breakInput = $("breakMinutes");
const startBtn = $("startBtn");
const stopBtn = $("stopBtn");
const musicSelect = $("musicSelect");
const volumeControl = $("volumeControl");
const volumeLabel = $("volumeLabel");
const switchInterval = $("switchInterval");
const intervalLabel = $("intervalLabel");
const customAudioCard = $("customAudioCard");
const audioLibraryBackdrop = $("audioLibraryBackdrop");
const closeAudioLibrary = $("closeAudioLibrary");
const closeAudioLibraryBottom = $("closeAudioLibraryBottom");
const librarySelect = $("librarySelect");
const defaultAudioList = $("defaultAudioList");
const uploadedAudioList = $("uploadedAudioList");
const defaultAudioCount = $("defaultAudioCount");
const uploadAudioBtn = $("uploadAudioBtn");
const customSoundInput = $("customSoundInput");
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
let timerEndTime = null;
let remainingSeconds = 40 * 60;
let sessionTotalSeconds = 40 * 60;
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

function formatInterval(seconds) {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (secs === 0) return `${minutes} min`;
  return `${minutes}m ${secs}s`;
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

function populateMusicSelectors() {
  musicSelect.innerHTML = "";
  librarySelect.innerHTML = "";

  const randomMain = document.createElement("option");
  randomMain.value = "random";
  randomMain.textContent = "🎲 Random Ambient";
  musicSelect.appendChild(randomMain);

  const randomLibrary = document.createElement("option");
  randomLibrary.value = "random";
  randomLibrary.textContent = "🎲 Random Ambient";
  librarySelect.appendChild(randomLibrary);

  ambientSounds.forEach((item) => {
    const mainOption = document.createElement("option");
    mainOption.value = item.audio;
    mainOption.textContent = item.name;
    musicSelect.appendChild(mainOption);

    const libraryOption = document.createElement("option");
    libraryOption.value = item.audio;
    libraryOption.textContent = item.name;
    librarySelect.appendChild(libraryOption);
  });

  customSounds.forEach((item) => {
    const mainOption = document.createElement("option");
    mainOption.value = item.url;
    mainOption.textContent = `📌 ${item.name}`;
    musicSelect.appendChild(mainOption);

    const libraryOption = document.createElement("option");
    libraryOption.value = item.url;
    libraryOption.textContent = `📌 ${item.name}`;
    librarySelect.appendChild(libraryOption);
  });
}

function syncSelectors(value) {
  musicSelect.value = value;
  librarySelect.value = value;
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

  renderAudioLibrary();
}

function playCustomSound(custom, shouldPlay = true) {
  currentAmbientIndex = -1;

  focusMusic.pause();
  focusMusic.src = custom.url;
  focusMusic.load();
  focusMusic.loop = true;

  setNowPlaying(custom.name);
  setDefaultBackground();

  if (shouldPlay && mode === "focus" && !isPaused) {
    playFocusMusic();
  }

  renderAudioLibrary();
}

function playSelectedAudio(shouldPlay = true) {
  const selectedAudio = musicSelect.value;

  const index = ambientSounds.findIndex(
    (item) => item.audio === selectedAudio
  );

  if (index !== -1) {
    playAmbientByIndex(index, shouldPlay);
    return;
  }

  const custom = customSounds.find(
    (item) => item.url === selectedAudio
  );

  if (custom) {
    playCustomSound(custom, shouldPlay);
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

  const nextIndex = (currentIndex + 1) % ambientSounds.length;
  const nextAmbient = ambientSounds[nextIndex];

  syncSelectors(nextAmbient.audio);
  clearRandomSoundTimer();
  playAmbientByIndex(nextIndex);
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
  scheduleRandomSwitch(switchIntervalSeconds * 1000);
}

function startRandomSoundCycle() {
  clearRandomSoundTimer();

  const index = chooseRandomAmbientIndex();

  if (index === -1) return;

  playAmbientByIndex(index);
  scheduleRandomSwitch(switchIntervalSeconds * 1000);
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

function handleNowPlayingClick() {
  if (mode !== "focus") return;

  if (musicSelect.value === "random") {
    switchRandomAmbient();
  } else {
    playNextAmbient();
  }
}

function applyAudioSelection(value) {
  syncSelectors(value);
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

      randomSwitchRemainingMs = switchIntervalSeconds * 1000;
    } else {
      setNowPlaying("None");
      setDefaultBackground();
    }
  } else {
    playSelectedAudio(mode === "focus" && !isPaused);
  }

  renderAudioLibrary();
}

function renderAudioLibrary() {
  defaultAudioList.innerHTML = "";
  uploadedAudioList.innerHTML = "";
  defaultAudioCount.textContent = `${ambientSounds.length} sounds`;

  ambientSounds.forEach((item, index) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "audio-item";

    if (musicSelect.value === item.audio) {
      row.classList.add("selected");
    }

    const text = document.createElement("div");

    const name = document.createElement("div");
    name.className = "audio-item-name";
    name.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "audio-item-meta";
    // meta.textContent = `Default sound ${index + 1}`;

    text.append(name, meta);
    row.appendChild(text);

    row.addEventListener("click", () => {
      applyAudioSelection(item.audio);
    });

    defaultAudioList.appendChild(row);
  });

  if (!customSounds.length) {
    const empty = document.createElement("div");
    empty.className = "library-empty";
    empty.textContent = "No uploaded audio yet.";
    uploadedAudioList.appendChild(empty);
    return;
  }

  customSounds.forEach((item) => {
    const row = document.createElement("div");
    row.className = "audio-item";

    if (musicSelect.value === item.url) {
      row.classList.add("selected");
    }

    const text = document.createElement("div");
    text.className = "audio-item-name";
    text.textContent = item.name;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-audio-btn";
    deleteButton.textContent = "✕";
    deleteButton.setAttribute("aria-label", `Delete ${item.name}`);

    text.addEventListener("click", () => {
      applyAudioSelection(item.url);
    });

    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      removeCustomSound(item.id);
    });

    row.append(text, deleteButton);
    uploadedAudioList.appendChild(row);
  });
}

function removeCustomSound(id) {
  const item = customSounds.find(
    (sound) => sound.id === id
  );

  if (!item) return;

  const wasSelected = musicSelect.value === item.url;

  URL.revokeObjectURL(item.url);

  customSounds = customSounds.filter(
    (sound) => sound.id !== id
  );

  populateMusicSelectors();

  if (wasSelected) {
    syncSelectors("random");

    if (mode === "focus" && !isPaused) {
      startRandomSoundCycle();
    } else {
      setNowPlaying("None");
      setDefaultBackground();
    }
  } else {
    syncSelectors(musicSelect.value || "random");
  }

  renderAudioLibrary();
  showToast("Custom sound removed.");
}

function openAudioLibrary() {
  renderAudioLibrary();
  librarySelect.value = musicSelect.value;
  audioLibraryBackdrop.classList.remove("hidden");
}

function closeLibrary() {
  audioLibraryBackdrop.classList.add("hidden");
}

customAudioCard.addEventListener("click", openAudioLibrary);

customAudioCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    openAudioLibrary();
  }
});

closeAudioLibrary.addEventListener("click", closeLibrary);
closeAudioLibraryBottom.addEventListener("click", closeLibrary);

audioLibraryBackdrop.addEventListener("click", (event) => {
  if (event.target === audioLibraryBackdrop) {
    closeLibrary();
  }
});

uploadAudioBtn.addEventListener("click", () => {
  customSoundInput.value = "";
  customSoundInput.click();
});

customSoundInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  const item = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    url: URL.createObjectURL(file)
  };

  customSounds.push(item);
  populateMusicSelectors();
  applyAudioSelection(item.url);
  showToast(`${item.name} added.`);
});

musicSelect.addEventListener("change", () => {
  applyAudioSelection(musicSelect.value);
});

librarySelect.addEventListener("change", () => {
  applyAudioSelection(librarySelect.value);
});

nowPlayingCard.addEventListener("click", handleNowPlayingClick);

nowPlayingCard.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    handleNowPlayingClick();
  }
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
    progress = 1 - remainingSeconds / sessionTotalSeconds;
  }

  progress = Math.min(1, Math.max(0, progress));

  timerRing.style.setProperty(
    "--progress",
    `${progress * 360}deg`
  );
}

function updateUI() {
  if (mode === "focus") {
    statusEl.textContent = isPaused ? "Focus paused" : "Focus";
  } else if (mode === "break") {
    statusEl.textContent = isPaused ? "Break paused" : "Break";
  } else {
    statusEl.textContent = "Idle";
  }

  timeLeftEl.textContent = formatTime(remainingSeconds);
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
}

function startSelectedMusic() {
  if (musicSelect.value === "random") {
    startRandomSoundCycle();
    return;
  }

  playSelectedAudio();
}

function beginFocusSession() {
  mode = "focus";
  isPaused = false;
  remainingSeconds = getDurationForMode("focus");
  sessionTotalSeconds = remainingSeconds;
  timerEndTime = Date.now() + remainingSeconds * 1000;

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

    if (timerEndTime !== null) {
      remainingSeconds = Math.max(
        0,
        Math.ceil((timerEndTime - Date.now()) / 1000)
      );
    }

    clearInterval(timerId);
    timerId = null;
    timerEndTime = null;

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
  timerEndTime = Date.now() + remainingSeconds * 1000;

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

  clearInterval(timerId);
  timerId = null;
  timerEndTime = null;

  clearRandomSoundTimer();
  randomSwitchRemainingMs = null;
  randomSwitchStartedAt = null;

  stopAndRewindMusic();

  remainingSeconds =
    Math.max(
      1,
      Number.parseInt(focusInput.value, 10) || 40
    ) * 60;

  sessionTotalSeconds = remainingSeconds;
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

    sessionsNumberEl.textContent = sessionsCompleted;

    mode = "break";
    remainingSeconds = getDurationForMode("break");
    sessionTotalSeconds = remainingSeconds;
    timerEndTime = Date.now() + remainingSeconds * 1000;

    clearRandomSoundTimer();
    randomSwitchRemainingMs = null;
    randomSwitchStartedAt = null;

    stopAndRewindMusic();
    setNowPlaying("None");
    setDefaultBackground();

    suggestionEl.textContent =
      breakSuggestions[
        Math.floor(Math.random() * breakSuggestions.length)
      ];
  } else {
    mode = "focus";
    remainingSeconds = getDurationForMode("focus");
    sessionTotalSeconds = remainingSeconds;
    timerEndTime = Date.now() + remainingSeconds * 1000;

    suggestionEl.textContent =
      "New focus round. Keep going.";

    startSelectedMusic();
  }

  updateUI();
}

function scheduleTick() {
  clearInterval(timerId);

  if (mode === "idle" || isPaused) return;

  if (timerEndTime === null) {
    timerEndTime = Date.now() + remainingSeconds * 1000;
  }

  timerId = setInterval(() => {
    if (mode === "idle" || isPaused) return;

    remainingSeconds = Math.max(
      0,
      Math.ceil((timerEndTime - Date.now()) / 1000)
    );

    updateUI();

    if (remainingSeconds <= 0) {
      clearInterval(timerId);
      timerId = null;
      timerEndTime = null;

      switchMode();
      scheduleTick();
    }
  }, 250);
}

function updateIdlePreview() {
  if (mode !== "idle") return;

  const focus = Number.parseInt(focusInput.value, 10);

  if (Number.isFinite(focus) && focus > 0) {
    remainingSeconds = focus * 60;
    sessionTotalSeconds = remainingSeconds;
    updateUI();
  }
}

startBtn.addEventListener("click", toggleTimer);
stopBtn.addEventListener("click", resetTimer);
focusInput.addEventListener("input", updateIdlePreview);
breakInput.addEventListener("input", updateIdlePreview);

switchInterval.addEventListener("input", () => {
  switchIntervalSeconds = Number.parseInt(
    switchInterval.value,
    10
  );

  intervalLabel.textContent =
    formatInterval(switchIntervalSeconds);

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
  const value = Number(volumeControl.value);
  const volume = value / 100;

  focusMusic.volume = volume;
  endSound.volume = volume;
  volumeLabel.textContent = `${value}%`;

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
  volumeControl.value = String(savedVolume);
}

volumeControl.dispatchEvent(new Event("input"));

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement?.tagName;

  const typing =
    tag === "INPUT" ||
    tag === "SELECT" ||
    tag === "TEXTAREA";

  if (
    event.key === "Escape" &&
    !audioLibraryBackdrop.classList.contains("hidden")
  ) {
    closeLibrary();
    return;
  }

  if (
    typing ||
    !audioLibraryBackdrop.classList.contains("hidden")
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

populateMusicSelectors();
syncSelectors("random");
renderAudioLibrary();
intervalLabel.textContent = formatInterval(switchIntervalSeconds);
setNowPlaying("None");
updateUI();