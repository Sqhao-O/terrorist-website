(() => {
  function initSound() {
    const controls = [...document.querySelectorAll('[data-sound]')];
    if (!controls.length) return;

    const offLabels = controls.map(button => button.querySelector('span').textContent);
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    const watch = document.querySelector('#watch');
    const threshold = document.querySelector('#threshold');
    const soundOnPath = document.querySelector('#volume .sound-on');
    const soundOffPath = document.querySelector('#volume .sound-off');
    let available = Boolean(AudioEngine);
    let playing = false;
    let engine;
    let suspendTimer;
    let knockTimer;
    let scrollFrame;

    function updateControls() {
      controls.forEach((button, index) => {
        button.disabled = !available;
        button.setAttribute('aria-pressed', String(playing));
        const label = playing ? '关闭环境音' : offLabels[index];
        button.querySelector('span').textContent = available ? label : '环境音不可用';
      });
      // Update the source symbol shared by all <use> instances.
      if (soundOnPath) soundOnPath.style.display = playing ? 'inline' : 'none';
      if (soundOffPath) soundOffPath.style.display = playing ? 'none' : 'inline';
    }

    function createAmbience() {
      const context = new AudioEngine();
      const master = context.createGain();
      master.gain.value = 0;
      master.connect(context.destination);

      const noise = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
      const samples = noise.getChannelData(0);
      for (let index = 0; index < samples.length; index++) {
        samples[index] = Math.random() * 2 - 1;
      }
      const breeze = context.createBufferSource();
      breeze.buffer = noise;
      breeze.loop = true;
      const lowCut = context.createBiquadFilter();
      lowCut.type = 'highpass';
      lowCut.frequency.value = 155;
      const canopy = context.createBiquadFilter();
      canopy.type = 'lowpass';
      canopy.Q.value = 0.55;
      canopy.frequency.value = 1250;
      const air = context.createGain();
      air.gain.value = 0.2;
      breeze.connect(lowCut).connect(canopy).connect(air).connect(master);
      breeze.start();

      const sway = context.createOscillator();
      sway.frequency.value = 0.1;
      const depth = context.createGain();
      depth.gain.value = 0.046;
      sway.connect(depth).connect(air.gain);
      sway.start();

      const drone = context.createGain();
      drone.gain.value = 0;
      drone.connect(master);
      for (const frequency of [76, 77.6]) {
        const tone = context.createOscillator();
        tone.frequency.value = frequency;
        tone.connect(drone);
        tone.start();
      }
      return { context, master, canopy, drone };
    }

    function sectionDepth(section) {
      if (!section) return 0;
      return Math.max(0, Math.min(1, 1 - section.getBoundingClientRect().top / window.innerHeight));
    }

    function knock() {
      knockTimer = undefined;
      if (!playing || sectionDepth(watch) < 0.5) return;
      const { context, master } = engine;
      const now = context.currentTime;
      const wood = context.createOscillator();
      const envelope = context.createGain();
      wood.frequency.setValueAtTime(185, now);
      wood.frequency.exponentialRampToValueAtTime(69, now + 0.13);
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.06, now + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.21);
      wood.connect(envelope).connect(master);
      wood.onended = () => { wood.disconnect(); envelope.disconnect(); };
      wood.start(now);
      wood.stop(now + 0.23);
      knockTimer = window.setTimeout(knock, 9000 + Math.random() * 5000);
    }

    function updateScene() {
      scrollFrame = undefined;
      if (!playing || !engine) return;
      const night = sectionDepth(watch);
      const door = sectionDepth(threshold);
      const now = engine.context.currentTime;
      engine.canopy.frequency.setTargetAtTime(1250 - 680 * night - 180 * door, now, 0.35);
      engine.drone.gain.setTargetAtTime(0.032 * night + 0.015 * door, now, 0.55);
      if (night >= 0.5 && knockTimer === undefined) {
        knockTimer = window.setTimeout(knock, 3200);
      } else if (night < 0.5) {
        window.clearTimeout(knockTimer);
        knockTimer = undefined;
      }
    }

    function scheduleScene() {
      if (playing && scrollFrame === undefined) {
        scrollFrame = window.requestAnimationFrame(updateScene);
      }
    }

    function stop() {
      if (!playing) return;
      playing = false;
      updateControls();
      window.clearTimeout(knockTimer);
      knockTimer = undefined;
      if (!engine) return;
      const { context, master } = engine;
      master.gain.setTargetAtTime(0, context.currentTime, 0.025);
      suspendTimer = window.setTimeout(() => {
        if (!playing) context.suspend().catch(() => {});
      }, 200);
    }

    async function start() {
      playing = true;
      window.clearTimeout(suspendTimer);
      updateControls();
      try {
        if (!engine) engine = createAmbience();
        await engine.context.resume();
        if (!playing) return;
        updateScene();
        engine.master.gain.setTargetAtTime(0.53, engine.context.currentTime, 0.2);
      } catch {
        available = false;
        stop();
        updateControls();
      }
    }

    updateControls();
    controls.forEach(button => button.addEventListener('click', () => {
      if (playing) stop();
      else start();
    }));
    document.querySelectorAll('.return').forEach(link => link.addEventListener('click', stop));
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    window.addEventListener('pagehide', stop);
    window.addEventListener('scroll', scheduleScene, { passive: true });
    window.addEventListener('resize', scheduleScene);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSound, { once: true });
  } else {
    initSound();
  }
})();
