"use strict";
// Voice, cassette transport and the effects bus share one real mute switch.
window.ShiftSound = (() => {
  let enabled = false;
  let keepMuted = false;
  let held = false;
  let room = null;
  const voice = new Audio();
  const effect = new Audio();
  let voiceId = "";
  let following = [];
  let voiceToken = 0;
  let cueSheet = {};
  const catalog = fetch("./assets/shift/cues.json")
    .then((r) => {
      if (!r.ok) throw Error("cue sheet");
      return r.json();
    })
    .then((data) => {
      cueSheet = data;
      document.querySelectorAll("[data-transcript]").forEach((el) => {
        const track = data[el.dataset.transcript];
        if (track)
          el.replaceChildren(
            ...track.cues.map((cue) => {
              const p = document.createElement("p");
              p.textContent = cue.at.toFixed(1) + "s　" + cue.speaker + "　" + cue.text;
              return p;
            }),
          );
      });
      return data;
    })
    .catch(() => ({}));
  function controls() {
    document.querySelectorAll("[data-master]").forEach((b) => {
      b.textContent = enabled ? "声音开 · 静音" : "声音关 · 开启";
      b.setAttribute("aria-pressed", String(enabled));
    });
    document.body.classList.toggle("sound-on", enabled);
  }
  let statusTimer;
  function notify(text) {
    const msg = document.getElementById("sound-status");
    clearTimeout(statusTimer);
    msg.textContent = text;
    msg.hidden = false;
    statusTimer = setTimeout(() => {
      msg.hidden = true;
    }, 6500);
  }
  function stop() {
    voiceToken++;
    voice.pause();
    effect.pause();
    voiceId = "";
    following = [];
    window.dispatchEvent(new Event("shift-stop-media"));
  }
  function set(on) {
    if (enabled === on) {
      controls();
      return;
    }
    enabled = on;
    if (!on) {
      stop();
      if (room) {
        room.close().catch(() => {});
        room = null;
      }
    } else {
      try {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        room = new AudioEngine();
        const motor = room.createOscillator(),
          gain = room.createGain();
        motor.frequency.value = 50;
        gain.gain.value = 0.008;
        motor.connect(gain).connect(room.destination);
        motor.start();
        const air = room.createBuffer(2, room.sampleRate * 3, room.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const channel = air.getChannelData(ch);
          for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
        }
        const fan = room.createBufferSource(),
          grille = room.createBiquadFilter(),
          distance = room.createGain();
        grille.type = "lowpass";
        grille.frequency.value = 680;
        distance.gain.value = 0.019;
        fan.buffer = air;
        fan.loop = true;
        fan.connect(grille).connect(distance).connect(room.destination);
        fan.start();
        if (held) room.suspend().catch(() => {});
        else room.resume().catch(() => {});
      } catch {
        room = null;
      }
    }
    controls();
  }
  async function play(id, explicit = false, volume = 0.9, rest = []) {
    if (explicit && keepMuted) {
      const data = await catalog;
      notify("静音　" + (data[id]?.cues.map((c) => c.text).join("") || "可在柜台开启声音。"));
      return;
    }
    if (explicit) set(true);
    if (!enabled || !id || document.hidden) return;
    const token = ++voiceToken;
    const data = await catalog;
    if (!data[id] || !enabled || token !== voiceToken || document.hidden) return;
    window.dispatchEvent(new Event("shift-stop-cassette"));
    voice.pause();
    voiceId = id;
    following = rest;
    voice.src = "./assets/shift/" + id + ".mp3";
    voice.volume = volume;
    try {
      await voice.play();
    } catch {
      if (explicit && token === voiceToken) {
        notify("声音暂未播放，可以读逐字稿。");
      }
    }
  }
  function sfx(id) {
    if (!enabled || document.hidden || !cueSheet[id]) return;
    effect.pause();
    effect.src = "./assets/shift/" + id + ".mp3";
    effect.volume = 0.58;
    effect.play().catch(() => {});
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-master]")) {
      keepMuted = enabled;
      set(!enabled);
    }
    const btn = e.target.closest("[data-voice]");
    if (btn) {
      if (voiceId === btn.dataset.voice && !voice.paused) {
        stop();
        return;
      }
      play(btn.dataset.voice, true);
    }
  });
  voice.addEventListener("timeupdate", () => {
    if (!voiceId) return;
    const cue = cueSheet[voiceId]?.cues.find((c) => c.at <= voice.currentTime && voice.currentTime < c.end);
    document.querySelectorAll("[data-playing-caption]").forEach((el) => {
      el.textContent = cue ? cue.speaker + "　" + cue.text : "";
    });
  });
  voice.addEventListener("ended", () => {
    if (following.length && enabled) {
      const [next, ...rest] = following;
      following = [];
      play(next, false, 0.9, rest);
    }
  });
  window.addEventListener("shift-cassette-play", () => {
    voiceToken++;
    voice.pause();
    voiceId = "";
    following = [];
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) set(false);
  });
  window.addEventListener("pagehide", () => set(false));
  controls();
  function hush(value) {
    held = value;
    if (room && enabled) (held ? room.suspend() : room.resume()).catch(() => {});
  }
  function allowTransport() {
    if (keepMuted) {
      notify("磁带已静音。逐字稿可逐句定位，柜台的声音开关可恢复播放。");
      return false;
    }
    set(true);
    return true;
  }
  return {
    get enabled() {
      return enabled;
    },
    play,
    sfx,
    set,
    stop,
    controls,
    catalog,
    hush,
    allowTransport,
  };
})();
