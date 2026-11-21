(() => {
  "use strict";
  const mount = document.getElementById("tape");
  if (!mount) return;

  const recordings = {
    A: {
      name: "来电留存",
      speaker: "母亲",
      duration: 25.5,
      file: "voice-a.mp3",
      cues: [
        [0, "［电话接通］"],
        [1.4, "师傅。那张合影，还留着吗？"],
        [7.7, "洗两张吧。"],
        [10.8, "一张给他。"],
        [14.2, "一张……"],
        [16.1, "［两次呼吸，中间有一下轻响］"],
        [20.9, "放那把椅子上。"],
        [24.55, "［挂断］"],
      ],
    },
    B: {
      name: "接缝底声",
      speaker: "录音员",
      duration: 21,
      file: "voice-b.mp3",
      cues: [
        [0, "［倒带头的咔嗒声］"],
        [1.4, "我问你的时候，你就照这句说。"],
        [6, "请说，椅子从来就是空的。"],
        [10.5, "［两次呼吸，中间有一下轻响］"],
        [15.3, "别说「后来」。"],
        [18.25, "［相机快门响了。上弦。］"],
      ],
    },
  };
  // RMS envelopes measured from the matching 4.8 s sections of the two masters.
  const envelope = [
    17, 18, 19, 19, 18, 20, 20, 21, 23, 28, 34, 44, 52, 66, 74, 84, 83, 91, 86, 71, 62, 47, 37, 29, 21, 18,
    16, 17, 15, 15, 16, 15, 17, 18, 17, 19, 20, 21, 25, 56, 34, 39, 45, 51, 55, 58, 61, 61, 61, 57, 58, 54,
    48, 42, 39, 31, 29, 24, 20, 19, 17, 16, 17, 16, 15, 16, 17, 16, 17, 17, 17, 17,
  ];

  mount.innerHTML = `
    <div class="tape-wrap">
      <header class="tape-heading">
        <p class="tape-kicker"><i></i>随单附件<span lang="en">AUDIO ARCHIVE</span></p>
        <h2 id="tape-title">她要洗两张。</h2>
        <p>2004 年 6 月，母亲打电话来加洗。纸盒里夹着当时的电话录音。磁带翻过来，背面还留着一截没擦干净的声音。</p>
      </header>
      <div class="tape-desk">
        <div class="tape-player">
          <div class="tape-cassette" aria-hidden="true">
            <i class="tape-screw tl"></i><i class="tape-screw tr"></i><i class="tape-screw bl"></i><i class="tape-screw br"></i>
            <div class="tape-paper">
              <div class="tape-paper-title"><b class="tape-letter">A</b><span>拾相 / 留声档案</span><i>27-B</i></div>
              <div class="tape-window"><b class="tape-reel left"></b><i class="tape-film"></i><b class="tape-reel right"></b></div>
              <div class="tape-paper-foot"><span class="tape-scribble">来电留存</span><span>60 MIN</span></div>
            </div>
            <div class="tape-lip"><i></i><i></i><i></i><i></i></div>
          </div>
          <div class="tape-transport">
            <button type="button" class="tape-play"><i aria-hidden="true"></i><span>播放</span></button>
            <label class="tape-scrub"><span class="tape-scrub-meta"><span>走带位置</span><output aria-hidden="true">00:00 / 00:25</output></span><input aria-label="录音进度" type="range" step=".1" min="0" max="25.5" value="0"></label>
          </div>
          <p class="tape-error" role="status" hidden>录音暂时无法播放，可以继续核对逐字稿。</p>
        </div>
        <div class="tape-document">
          <div class="tape-sides" role="group" aria-label="选择磁带面"><button type="button" data-tape-side="A" aria-pressed="true">磁带 A 面</button><button type="button" data-tape-side="B" aria-pressed="false">磁带 B 面</button></div>
          <div class="tape-doc-head"><h3>来电留存</h3><span>母亲 · 逐字稿</span></div>
          <ol class="tape-cues" aria-label="逐字稿，选择一句可定位录音"></ol>
          <button class="tape-match" type="button" hidden>比对两处停顿</button>
        </div>
      </div>
      <div class="tape-evidence" role="region" aria-labelledby="tape-proof-title" hidden tabindex="-1">
        <div class="tape-traces" aria-hidden="true"><div><b>A</b><span></span><em>16.1 s</em></div><div><b>B</b><span></span><em>10.5 s</em></div></div>
        <div><p class="tape-proof-title" id="tape-proof-title">同一口气，被用了两次。</p><p>A 面第 16.1 秒，B 面第 10.5 秒。两次呼吸之间那一下碰桌声，也在同一拍。四秒八，一分不差。他们把她听指令时的沉默，剪进了她自己的回答。</p></div>
      </div>
      <div class="tape-bottom"><span>拾相修复所 · 声轨存档</span><button type="button" data-ambience aria-pressed="false"><span data-ambience-label>开启环境音</span></button></div>
    </div>`;

  const get = (selector) => mount.querySelector(selector);
  const rootUrl = new URL("./assets/album/", document.baseURI);
  const audio = new Audio();
  audio.preload = "metadata";
  let side = "A";
  let position = 0;
  let awaitingSeek = null;
  let inspected = false;
  let playbackRequest = 0;
  let sourceRequest = 0;
  let loading = false;
  const localSources = new Map();
  const scrub = get("input");
  const cueList = get(".tape-cues");
  const playButton = get(".tape-play");
  const proof = get(".tape-evidence");
  const match = get(".tape-match");
  const formatTime = (seconds) => "00:" + String(Math.floor(seconds)).padStart(2, "0");
  const rowBars = envelope.map((height) => '<i style="height:' + height + '%"></i>').join("");
  proof.querySelectorAll(".tape-traces span").forEach((wave) => {
    wave.innerHTML = rowBars;
  });

  function drawPosition() {
    const record = recordings[side];
    let activeIndex = 0;
    record.cues.forEach(([start], index) => {
      if (start <= position) activeIndex = index;
    });
    Array.from(cueList.children).forEach((line, index) => {
      if (index === activeIndex) line.firstChild.setAttribute("aria-current", "true");
      else line.firstChild.removeAttribute("aria-current");
    });
    scrub.value = String(position);
    scrub.setAttribute("aria-valuetext", "第 " + Math.floor(position) + " 秒，共 " + record.duration + " 秒");
    scrub.style.setProperty("--tape-fill", (100 * position) / record.duration + "%");
    get("output").value = formatTime(position) + " / " + formatTime(record.duration);
  }
  function drawTransport() {
    const playing = !audio.paused;
    mount.classList.toggle("tape-playing", playing);
    const action = loading ? "载入中" : playing ? "暂停" : "播放";
    playButton.disabled = loading;
    playButton.querySelector("span").textContent = action;
    playButton.setAttribute("aria-label", action + "磁带 " + side + " 面");
  }
  async function loadSideSource(file) {
    const request = ++sourceRequest;
    loading = true;
    // A local blob remains seekable on static hosts that ignore HTTP byte ranges.
    const location = new URL(file, rootUrl).href;
    if (!localSources.has(file)) {
      localSources.set(
        file,
        fetch(location, { priority: "low" })
          .then((response) => {
            if (!response.ok) throw new Error("Audio unavailable");
            return response.blob();
          })
          .then((blob) => URL.createObjectURL(blob))
          .catch(() => {
            localSources.delete(file);
            return location;
          }),
      );
    }
    const source = await localSources.get(file);
    if (request !== sourceRequest) return;
    audio.src = source;
    audio.load();
    loading = false;
    drawTransport();
  }
  function selectSide(key) {
    playbackRequest++;
    audio.pause();
    side = key;
    position = 0;
    awaitingSeek = null;
    const record = recordings[key];
    loadSideSource(record.file);
    scrub.max = String(record.duration);
    mount.querySelectorAll("[data-tape-side]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.tapeSide === key));
    });
    mount.dataset.side = key;
    get(".tape-letter").textContent = key;
    get(".tape-scribble").textContent = record.name;
    get(".tape-doc-head h3").textContent = record.name;
    get(".tape-doc-head span").textContent = record.speaker + " · 逐字稿";
    cueList.replaceChildren();
    record.cues.forEach(([time, line]) => {
      const entry = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.time = String(time);
      const stamp = document.createElement("time");
      stamp.textContent = formatTime(time);
      button.append(stamp, document.createTextNode(line));
      entry.append(button);
      cueList.append(entry);
    });
    match.hidden = key !== "B" || inspected;
    get(".tape-error").hidden = true;
    drawPosition();
    drawTransport();
  }
  function establishSplice(focus) {
    if (inspected) return;
    inspected = true;
    proof.hidden = false;
    match.hidden = true;
    if (focus) proof.focus({ preventScroll: true });
    window.dispatchEvent(new CustomEvent("studio-evidence", { detail: "splice" }));
  }
  function seek(value) {
    position = Math.max(0, Math.min(recordings[side].duration, value));
    awaitingSeek = position;
    if (!loading && audio.readyState >= 1) audio.currentTime = position;
    drawPosition();
  }
  async function togglePlayback() {
    if (!audio.paused) {
      playbackRequest++;
      audio.pause();
      return;
    }
    const request = ++playbackRequest;
    if (position >= recordings[side].duration - 0.12) seek(0);
    try {
      await audio.play();
    } catch {
      if (request === playbackRequest) get(".tape-error").hidden = false;
    }
    drawTransport();
  }

  get(".tape-sides").addEventListener("click", (event) => {
    const button = event.target.closest("[data-tape-side]");
    if (button && button.dataset.tapeSide !== side) selectSide(button.dataset.tapeSide);
  });
  cueList.addEventListener("click", (event) => {
    const cue = event.target.closest("[data-time]");
    if (cue) seek(Number(cue.dataset.time));
  });
  match.addEventListener("click", () => establishSplice(true));
  scrub.addEventListener("input", () => seek(Number(scrub.value)));
  playButton.addEventListener("click", togglePlayback);
  audio.addEventListener("play", drawTransport);
  audio.addEventListener("pause", drawTransport);
  audio.addEventListener("loadedmetadata", () => {
    if (!loading && awaitingSeek !== null) audio.currentTime = awaitingSeek;
  });
  audio.addEventListener("seeked", () => {
    if (awaitingSeek !== null && Math.abs(audio.currentTime - awaitingSeek) < 0.25) awaitingSeek = null;
  });
  audio.addEventListener("timeupdate", () => {
    if (loading || audio.readyState < 1 || awaitingSeek !== null) return;
    position = audio.currentTime;
    drawPosition();
  });
  audio.addEventListener("ended", () => {
    drawTransport();
    if (side === "B") establishSplice(false);
  });
  selectSide("A");

  // A motor winding at slightly different speeds as the page approaches the darkroom.
  let roomEngine = null;
  let ambienceGeneration = 0;
  const coda = document.getElementById("coda");
  const breathKey = "shixiang-window-breath-27b";
  let inWindow = false;
  let breathTask = null;
  let breathPlayed = false;
  try {
    breathPlayed = sessionStorage.getItem(breathKey) === "1";
  } catch {
    /* Keep one roll in memory. */
  }

  function stopBreath() {
    if (!breathTask) return;
    const { controller, source } = breathTask;
    breathTask = null;
    controller.abort();
    if (source) source.stop();
  }
  function windowIsVisible() {
    if (!inWindow || !coda) return false;
    // A control may scroll into view one frame before IntersectionObserver fires.
    const rect = coda.getBoundingClientRect();
    return rect.height > 0 && Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top) >= 0.4 * rect.height;
  }
  async function soundAtWindow() {
    if (!windowIsVisible()) {
      stopBreath();
      return;
    }
    const context = roomEngine?.context;
    if (!context || context.state !== "running" || document.hidden || breathPlayed || breathTask) return;
    const task = { controller: new AbortController(), source: null };
    breathTask = task;
    try {
      const response = await fetch(new URL("window-breath.mp3", rootUrl), { signal: task.controller.signal });
      if (!response.ok) throw new Error("Window recording unavailable");
      const samples = await context.decodeAudioData(await response.arrayBuffer());
      if (task !== breathTask) return;
      if (document.hidden || !windowIsVisible()) {
        stopBreath();
        return;
      }
      const source = context.createBufferSource();
      source.buffer = samples;
      const glass = context.createBiquadFilter();
      glass.type = "lowpass";
      glass.frequency.value = 1900;
      glass.Q.value = 0.55;
      const level = context.createGain();
      level.gain.value = 1.45;
      source.connect(glass).connect(level).connect(context.destination);
      source.onended = () => {
        source.disconnect();
        glass.disconnect();
        level.disconnect();
        if (breathTask === task) breathTask = null;
      };
      source.start();
      task.source = source;
      breathPlayed = true;
      try {
        sessionStorage.setItem(breathKey, "1");
      } catch {
        /* A private tab still plays it once. */
      }
    } catch {
      if (breathTask === task) breathTask = null;
    }
  }
  if (coda) {
    new IntersectionObserver(
      ([entry]) => {
        inWindow = entry.isIntersecting && entry.intersectionRatio >= 0.4;
        soundAtWindow();
      },
      { threshold: [0, 0.4] },
    ).observe(coda);
  }
  function updateAmbienceControls() {
    document.querySelectorAll("[data-ambience]").forEach((button) => {
      button.setAttribute("aria-pressed", String(Boolean(roomEngine)));
      const label = roomEngine ? "关闭环境音" : "开启环境音";
      button.setAttribute("aria-label", label);
      const visibleLabel = button.querySelector("[data-ambience-label]");
      if (visibleLabel) visibleLabel.textContent = label;
    });
  }
  function stopAmbience() {
    ambienceGeneration++;
    stopBreath();
    if (roomEngine) {
      const { context, gain } = roomEngine;
      roomEngine = null;
      gain.gain.setTargetAtTime(0, context.currentTime, 0.018);
      setTimeout(() => context.close().catch(() => {}), 130);
    }
    updateAmbienceControls();
  }
  async function toggleAmbience() {
    if (roomEngine) {
      stopAmbience();
      return;
    }
    const AudioAPI = window.AudioContext || window.webkitAudioContext;
    if (!AudioAPI) return;
    const token = ++ambienceGeneration;
    let context;
    try {
      context = new AudioAPI();
      const gain = context.createGain();
      gain.gain.value = 0;
      gain.connect(context.destination);
      const motor = context.createOscillator();
      motor.frequency.value = 52;
      motor.connect(gain);
      motor.start();
      const beating = context.createOscillator();
      beating.frequency.value = 52.7;
      const echo = context.createGain();
      echo.gain.value = 0.41;
      beating.connect(echo).connect(gain);
      beating.start();
      const strip = context.createBuffer(1, 3 * context.sampleRate, context.sampleRate);
      const hiss = strip.getChannelData(0);
      let seed = 27;
      for (let i = 0; i < hiss.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
        hiss[i] = (seed / 2147483648) * 0.17;
      }
      const head = context.createBufferSource();
      head.buffer = strip;
      head.loop = true;
      const lowpass = context.createBiquadFilter();
      lowpass.frequency.value = 2100;
      head.connect(lowpass).connect(gain);
      head.start();
      roomEngine = { context, gain, beating };
      updateAmbienceControls();
      await context.resume();
      if (token !== ambienceGeneration) return;
      gain.gain.setTargetAtTime(0.038, context.currentTime, 0.28);
      tuneRoom();
      soundAtWindow();
    } catch {
      if (token === ambienceGeneration) {
        if (!roomEngine && context) await context.close().catch(() => {});
        stopAmbience();
      }
    }
  }
  function tuneRoom() {
    if (!roomEngine) return;
    const distance = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    roomEngine.beating.frequency.setTargetAtTime(
      52.4 + (2.9 * scrollY) / distance,
      roomEngine.context.currentTime,
      0.8,
    );
  }
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-ambience]")) toggleAmbience();
  });
  window.addEventListener("scroll", tuneRoom, { passive: true });
  function silence() {
    playbackRequest++;
    audio.pause();
    stopAmbience();
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) silence();
  });
  window.addEventListener("pagehide", silence);
  document.querySelector("#coda-back")?.addEventListener("click", (event) => {
    if (event.currentTarget.hash === "#top") silence();
    else stopBreath();
  });
  window.addEventListener("studio-reset", () => {
    silence();
    breathPlayed = false;
    try {
      sessionStorage.removeItem(breathKey);
    } catch {
      /* In-memory reset is sufficient. */
    }
    inspected = false;
    proof.hidden = true;
    selectSide("A");
  });
  updateAmbienceControls();
})();
