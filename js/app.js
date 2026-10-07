const $ = (id) => document.getElementById(id);

    const statusEl = $("status");
    const timeLeftEl = $("timeLeft");
    const suggestionEl = $("suggestion");
    const sessionsNumberEl = $("sessionsNumber");
    const nowPlayingEl = $("nowPlaying");
    const timerRing = $("timerRing");

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

    const breakSuggestions = [
      "Stand up and stretch your neck and shoulders.",
      "Close your eyes and take 10 slow breaths.",
      "Drink some water away from your screen.",
      "Walk around for a minute or two.",
      "Look at something far away to rest your eyes."
    ];

    /*
      BUILT-IN AMBIENCE LIBRARY
      ------------------------
      To add a new built-in sound/background pair:
      1. Put audio files in /audio and background images in /images.
      2. Add ONE object below with:
         name:  label shown in the dropdown
         audio: relative audio path, e.g. "audio/forest.mp3"
         image: relative image path, e.g. "images/forest.jpg"

      The app automatically:
      - adds it to the dropdown
      - includes it in Random Ambient
      - switches to its matching background when selected
    */
    const ambientSounds = [
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
        name: "Atlas Deep Focus",
        audio: "audio/atlasaudio-deep-focus.mp3",
        image: "images/mountain.jpeg"
      },
      {
        name: "Calm",
        audio: "audio/nengjemping-calm.mp3",
        image: "images/rain_glass.jpeg"
      },
      {
        name: "Piano",
        audio: "audio/piano.mp3",
        image: "images/piano.jfif"
      },
      {
        name: "Deep Focus Mode",
        audio: "audio/nengjemping-deep-focus-mode.mp3",
        image: "images/Green2.jpeg"
      },
      {
        name: "Dryer",
        audio: "audio/Dryer.mp3",
        image: "images/Dryer.jfif"
      },
      {
        name: "Rain & Thunder",
        audio: "audio/rain.mp3",
        image: "images/rain.jfif"
      },
      {
        name: "White Noise",
        audio: "audio/White-Noise.mp3",
        image: "images/White-Noise.jfif"
      },
      {
        name: "Ocean",
        audio: "audio/Ocean.mp3",
        image: "images/Ocean.jpg"
      },
      {
        name: "Heater",
        audio: "audio/Heater.mp3",
        image: "images/Heater.jfif"
      },
      {
        name: "India",
        audio: "audio/india.mp3",
        image: "images/india.jpg"
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

    let currentBgLayer = 1;
    let customSounds = [];
    let mode = "idle";
    let timerId = null;
    let randomSoundTimerId = null;
    let remainingSeconds = 25 * 60;
    let sessionTotalSeconds = 25 * 60;
    let sessionsCompleted = Number(localStorage.getItem("focusBuddySessions") || 0);
    let isPaused = false;
    let lastRandomSound = null;
    let toastTimer = null;

    let switchIntervalSeconds = Number(
      localStorage.getItem("focusBuddySwitchInterval") || switchInterval.value
    );

    switchInterval.value = String(
      Math.min(Number(switchInterval.max), Math.max(Number(switchInterval.min), switchIntervalSeconds))
    );
    switchIntervalSeconds = Number(switchInterval.value);

    sessionsNumberEl.textContent = sessionsCompleted;
    intervalLabel.textContent = switchIntervalSeconds + "s";

    function cleanName(filename) {
      if (!filename) return "None";
      const base = filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      return base.replace(/\b\w/g, (ch) => ch.toUpperCase());
    }

    function formatTime(seconds) {
      const safeSeconds = Math.max(0, Math.floor(seconds));
      const m = Math.floor(safeSeconds / 60).toString().padStart(2, "0");
      const s = (safeSeconds % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    }

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
    }

    function setBackground(imagePath) {
      const show = currentBgLayer === 1 ? bg2 : bg1;
      const hide = currentBgLayer === 1 ? bg1 : bg2;

      show.style.backgroundImage = `url("${imagePath}")`;
      show.style.opacity = "1";
      hide.style.opacity = "0";

      currentBgLayer = currentBgLayer === 1 ? 2 : 1;
    }

    function updateSoundVisuals(src, displayName = null) {
      if (!src) {
        nowPlayingEl.textContent = "None";
        nowPlayingEl.title = "None";
        setBackground("images/background.jpg");
        return;
      }

      const file = src.startsWith("blob:") ? "" : src.split("/").pop();
      const niceName = displayName || cleanName(file || "Custom Sound");
      const customSound = customSounds.find((item) => item.url === src);

      nowPlayingEl.textContent = niceName;
      nowPlayingEl.title = niceName;

      if (musicSelect.value === "random" || src.startsWith("blob:") || customSound) {
        setBackground("images/background.jpg");
        return;
      }

      const ambient = ambientSounds.find((item) => item.audio === src);
      setBackground(ambient?.image || "images/background.jpg");
    }

    function playFocusMusic(shouldPlay) {
      if (shouldPlay) {
        focusMusic.play().catch(() => {
          showToast("Your browser blocked audio. Press Start again to enable sound.");
        });
      } else {
        focusMusic.pause();
      }
    }

    function stopAndRewindMusic() {
      focusMusic.pause();
      focusMusic.currentTime = 0;
    }

    function clearRandomSoundTimer() {
      if (randomSoundTimerId) {
        clearTimeout(randomSoundTimerId);
        randomSoundTimerId = null;
      }
    }

    function chooseRandomSound() {
      const customEntries = customSounds.map((item) => ({
        src: item.url,
        name: item.name
      }));

      const builtInEntries = ambientSounds.map((item) => ({
        src: item.audio,
        name: item.name
      }));

      const allSounds = builtInEntries.concat(customEntries);

      if (!allSounds.length) return null;
      if (allSounds.length === 1) return allSounds[0];

      let choice;
      do {
        choice = allSounds[Math.floor(Math.random() * allSounds.length)];
      } while (choice.src === lastRandomSound);

      lastRandomSound = choice.src;
      return choice;
    }

    function startRandomSoundCycle() {
      clearRandomSoundTimer();

      function cycle() {
        if (mode !== "focus" || isPaused || musicSelect.value !== "random") return;

        const choice = chooseRandomSound();
        if (!choice) return;

        focusMusic.pause();
        focusMusic.src = choice.src;
        focusMusic.load();
        playFocusMusic(true);
        updateSoundVisuals(choice.src, choice.name);

        randomSoundTimerId = setTimeout(cycle, switchIntervalSeconds * 1000);
      }

      cycle();
    }

    function syncCustomList() {
      customSoundList.innerHTML = "";

      if (!customSounds.length) {
        const empty = document.createElement("li");
        empty.innerHTML = '<span class="sound-name" style="color:#cbd5e1">No custom sounds uploaded yet.</span>';
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
        deleteBtn.setAttribute("aria-label", `Remove ${item.name}`);
        deleteBtn.textContent = "✕";

        deleteBtn.addEventListener("click", () => removeCustomSound(item.id));

        li.append(nameSpan, deleteBtn);
        customSoundList.appendChild(li);
      });
    }

    function addCustomOption(item) {
      const opt = document.createElement("option");
      opt.value = item.url;
      opt.dataset.customId = item.id;
      opt.textContent = "📌 " + item.name;
      musicSelect.appendChild(opt);
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

    function removeCustomSound(id) {
      const item = customSounds.find((sound) => sound.id === id);
      if (!item) return;

      if (musicSelect.value === item.url) {
        musicSelect.value = "random";
        if (mode === "focus" && !isPaused) {
          startRandomSoundCycle();
        } else {
          updateSoundVisuals(null);
        }
      }

      const option = [...musicSelect.options].find(
        (opt) => opt.dataset.customId === id
      );
      if (option) option.remove();

      URL.revokeObjectURL(item.url);
      customSounds = customSounds.filter((sound) => sound.id !== id);
      syncCustomList();
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
      focusMusic.src = item.url;
      focusMusic.load();
      updateSoundVisuals(item.url, item.name);

      if (mode === "focus" && !isPaused) {
        clearRandomSoundTimer();
        playFocusMusic(true);
      }

      showToast(`${item.name} added for this browser session.`);
    });

    musicSelect.addEventListener("change", () => {
      const value = musicSelect.value;

      if (value === "upload") {
        musicSelect.value = "random";
        openUploadDialog();
        return;
      }

      clearRandomSoundTimer();

      if (value === "random") {
        if (mode === "focus" && !isPaused) {
          startRandomSoundCycle();
        } else {
          updateSoundVisuals(null);
        }
        return;
      }

      const customItem = customSounds.find((item) => item.url === value);

      focusMusic.src = value;
      focusMusic.load();
      updateSoundVisuals(value, customItem?.name);

      if (mode === "focus" && !isPaused) {
        playFocusMusic(true);
      }
    });

    function getDurationForMode(currentMode) {
      const value = currentMode === "focus"
        ? Number.parseInt(focusInput.value, 10)
        : Number.parseInt(breakInput.value, 10);

      return value * 60;
    }

    function validateDurations() {
      const focus = Number.parseInt(focusInput.value, 10);
      const rest = Number.parseInt(breakInput.value, 10);

      if (!Number.isFinite(focus) || !Number.isFinite(rest) || focus <= 0 || rest <= 0) {
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
      timerRing.style.setProperty("--progress", `${progress * 360}deg`);
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
          : `${formatTime(remainingSeconds)} · ${mode === "focus" ? "Focus" : "Break"}`;
    }

    function startSelectedMusic() {
      const selection = musicSelect.value;

      if (selection === "random") {
        startRandomSoundCycle();
        return;
      }

      if (selection === "upload") return;

      const customItem = customSounds.find((item) => item.url === selection);

      focusMusic.src = selection;
      focusMusic.load();
      updateSoundVisuals(selection, customItem?.name);
      playFocusMusic(true);
    }

    function beginFocusSession() {
      mode = "focus";
      isPaused = false;
      remainingSeconds = getDurationForMode("focus");
      sessionTotalSeconds = remainingSeconds;
      suggestionEl.textContent = "Stay with one task until the timer ends.";
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
        clearRandomSoundTimer();
        focusMusic.pause();
        updateUI();
        return;
      }

      isPaused = false;

      if (mode === "focus") {
        if (musicSelect.value === "random") {
          startRandomSoundCycle();
        } else {
          playFocusMusic(true);
        }
      }

      updateUI();
      scheduleTick();
    }

    function resetTimer() {
      mode = "idle";
      isPaused = false;
      clearTimeout(timerId);
      clearRandomSoundTimer();
      stopAndRewindMusic();

      remainingSeconds = Math.max(1, Number.parseInt(focusInput.value, 10) || 25) * 60;
      sessionTotalSeconds = remainingSeconds;

      suggestionEl.textContent = "Choose your focus session and press Start.";
      updateSoundVisuals(null);
      updateUI();
    }

    function switchMode() {
      endSound.currentTime = 0;
      endSound.play().catch(() => {});

      if (mode === "focus") {
        sessionsCompleted += 1;
        localStorage.setItem("focusBuddySessions", String(sessionsCompleted));
        sessionsNumberEl.textContent = sessionsCompleted;

        mode = "break";
        remainingSeconds = getDurationForMode("break");
        sessionTotalSeconds = remainingSeconds;

        clearRandomSoundTimer();
        stopAndRewindMusic();
        updateSoundVisuals(null);

        suggestionEl.textContent =
          breakSuggestions[Math.floor(Math.random() * breakSuggestions.length)];
      } else {
        mode = "focus";
        remainingSeconds = getDurationForMode("focus");
        sessionTotalSeconds = remainingSeconds;
        suggestionEl.textContent = "New focus round. Keep going.";
        startSelectedMusic();
      }

      updateUI();
    }

    function scheduleTick() {
      clearTimeout(timerId);

      if (mode === "idle" || isPaused) return;

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

      const focus = Number.parseInt(focusInput.value, 10);
      if (Number.isFinite(focus) && focus > 0) {
        remainingSeconds = focus * 60;
        sessionTotalSeconds = remainingSeconds;
        updateUI();
      }
    }

    function openSettings() {
      settingsBackdrop.classList.remove("hidden");
      closeSettings.focus();
    }

    function closeSettingsModal() {
      settingsBackdrop.classList.add("hidden");
      settingsBtn.focus();
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
      if (event.target === settingsBackdrop) closeSettingsModal();
    });

    uploadSoundBtn.addEventListener("click", openUploadDialog);

    switchInterval.addEventListener("input", () => {
      switchIntervalSeconds = Number.parseInt(switchInterval.value, 10);
      intervalLabel.textContent = switchIntervalSeconds + "s";
      localStorage.setItem("focusBuddySwitchInterval", String(switchIntervalSeconds));

      if (mode === "focus" && !isPaused && musicSelect.value === "random") {
        startRandomSoundCycle();
      }
    });

    clearCustomSounds.addEventListener("click", () => {
      customSounds.forEach((item) => URL.revokeObjectURL(item.url));
      customSounds = [];

      [...musicSelect.options]
        .filter((opt) => opt.dataset.customId)
        .forEach((opt) => opt.remove());

      if (musicSelect.value.startsWith("blob:")) {
        musicSelect.value = "random";
      }

      syncCustomList();

      if (mode === "focus" && !isPaused && musicSelect.value === "random") {
        startRandomSoundCycle();
      } else if (mode === "idle") {
        updateSoundVisuals(null);
      }

      showToast("Uploaded sounds cleared.");
    });

    volumeControl.addEventListener("input", () => {
      const value = Number(volumeControl.value);
      const volume = value / 100;
      focusMusic.volume = volume;
      endSound.volume = volume;
      volumeLabel.textContent = value + "%";
      localStorage.setItem("focusBuddyVolume", String(value));
    });

    const savedVolume = Number(localStorage.getItem("focusBuddyVolume"));
    if (Number.isFinite(savedVolume) && savedVolume >= 0 && savedVolume <= 100) {
      volumeControl.value = String(savedVolume);
    }
    volumeControl.dispatchEvent(new Event("input"));

    document.addEventListener("keydown", (event) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";

      if (event.key === "Escape" && !settingsBackdrop.classList.contains("hidden")) {
        closeSettingsModal();
        return;
      }

      if (typing || !settingsBackdrop.classList.contains("hidden")) return;

      if (event.code === "Space") {
        event.preventDefault();
        toggleTimer();
      }

      if (event.key.toLowerCase() === "r") {
        resetTimer();
      }
    });

    window.addEventListener("beforeunload", () => {
      customSounds.forEach((item) => URL.revokeObjectURL(item.url));
    });

    populateBuiltInSounds();
    syncCustomList();
    updateSoundVisuals(null);
    updateUI();
