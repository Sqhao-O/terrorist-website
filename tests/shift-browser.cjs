// Run against the local preview or the deployed Pages project subpath.
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_PATH || "playwright-core");
const url = process.env.PAGES_BASE_URL || "http://127.0.0.1:8192/terrorist-website/";
const wait = (p, fn, arg) => p.waitForFunction(fn, arg, { timeout: 18000 });
const saved = (p) => p.evaluate(() => JSON.parse(sessionStorage.getItem("shixiang-counter-v2")));
const click = (p, s) => p.locator(s).first().click();
const bottom = (p) =>
  p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
async function arrive(p, id) {
  await p.locator("#" + id).evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
  await p.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}
async function night(p, fromScroll = false) {
  if (fromScroll) await bottom(p);
  else await click(p, "#close-day");
  await wait(
    p,
    () => !document.querySelector("#night-shift").hidden && document.querySelector("#ink-cut").hidden,
  );
  assert.ok(await p.evaluate(() => scrollY < 5));
}
async function openCut(p, id) {
  await wait(
    p,
    (k) => document.querySelector("#closeup").open && document.querySelector("#closeup").dataset.shot === k,
    id,
  );
  assert.ok(await p.locator("#closeup-img").evaluate((img) => img.complete && img.naturalWidth > 0));
  assert.equal(await p.locator("#closeup [data-master]").isVisible(), true);
  return p.locator("#closeup-line").innerText();
}
async function leave(p, escape = false) {
  if (escape) await p.keyboard.press("Escape");
  else await click(p, "#leave-cut");
  await wait(p, () => !document.querySelector("#closeup").open);
}
async function summary(p) {
  assert.equal(await p.locator(".index-list a").count(), 3);
  return p.locator("#desk-content").innerText();
}
async function mainRoute(p) {
  assert.equal(await p.locator(".case-grid .case").count(), 3);
  assert.equal(await p.evaluate(() => ShiftSound.enabled), false);
  await click(p, ".header-sound");
  await click(p, '[data-voice="liang-intro"]');
  await wait(p, () => window.testMedia.some((m) => /liang-intro/.test(m.currentSrc) && m.currentTime > 0));
  await click(p, "#workbar [data-master]");
  await click(p, '[data-voice="mother-intro"]');
  assert.equal(await p.evaluate(() => ShiftSound.enabled || testMedia.some((m) => !m.paused)), false);
  await p.locator("#compare").focus();
  await p.keyboard.press("Home");
  await p.locator("#green-tone").focus();
  await p.keyboard.press("End");
  await click(p, "#seal-green");
  await click(p, ".flip");
  assert.equal(await p.locator(".proof-back").isVisible(), true);
  await click(p, '[data-observe="unsure"]');
  await click(p, "#seal-thread");
  await click(p, '[data-cutpoint="plastic"]');
  assert.equal((await saved(p)).cut, false);
  await click(p, '[data-cutpoint="line"]');
  assert.match(await p.locator("#shift-clock").innerText(), /17:58/);
  await click(p, "#workbar [data-index]");
  assert.match(await summary(p), /我看不清楚/);
  await click(p, "#dialog-close");
  await night(p);
  await p.reload();
  await p.waitForSelector("#night-shift:visible");
  assert.equal((await saved(p)).green, 100);
  assert.equal((await saved(p)).left, true);
  await click(p, "#focus-post");
  assert.match(await p.locator("#post-photo").getAttribute("src"), /post-far/);
  await click(p, "#focus-post");
  await openCut(p, "post");
  await p.reload();
  assert.equal(await p.locator("#closeup").isVisible(), false);
  assert.equal(await p.locator("#focus-post").isDisabled(), true);
  assert.match(await p.locator("#post-photo").getAttribute("src"), /post-trace/);
  await click(p, "#lift-carbon");
  assert.match(await p.locator("#first-quote").innerText(), /我看不清楚/);
  await click(p, '[data-signer="liang"]');
  assert.match(await p.locator("#second-call").innerText(), /代收人老梁/);
  await click(p, '[data-print="three"]');
  await click(p, '[data-slot="father"]');
  await click(p, '[data-print="empty"]');
  await click(p, '[data-slot="father"]');
  await click(p, '[data-print="three"]');
  await click(p, '[data-slot="daughter"]');
  await click(p, "#seal-frames");
  assert.match(await p.locator("#frame-slip").innerText(), /第三只碗/);
  await click(p, ".neg-compare");
  await click(p, ".neg-snap");
  assert.equal(await p.locator(".neg-finding").isVisible(), true);
  await click(p, '[data-tape-side="B"]');
  await click(p, ".tape-match");
  assert.equal(await p.locator(".tape-evidence").isVisible(), true);
  // Seek close to the end, then let the actual B-side audio dispatch its ended event.
  await click(p, ".tape-play");
  await wait(p, () => testMedia.some((m) => m.currentTime > 0 && /blob:/.test(m.currentSrc)));
  await p.locator(".tape-scrub input").evaluate((el) => {
    el.value = 20.8;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await wait(p, () => JSON.parse(sessionStorage.getItem("shixiang-counter-v2")).spool === 1);
  await click(p, "#eject");
  assert.match(await p.locator("#spool-photo").getAttribute("src"), /tape-lid/);
  await click(p, "#eject");
  await openCut(p, "spool");
  await click(p, "#closeup [data-master]");
  await leave(p, true);
  assert.equal(await p.locator("#split").isVisible(), true);
  assert.match(await p.locator("#spool-photo").getAttribute("src"), /trace/);
  for (const i of [2, 0, 1]) {
    await click(p, '[data-record="' + i + '"]');
    if (i === 2) {
      await click(p, '[data-mark="0"]');
      assert.deepEqual((await saved(p)).registered, []);
    }
    await click(p, '[data-mark="' + i + '"]');
  }
  await click(p, "#workbar [data-index]");
  assert.match(await summary(p), /正在看底片的人/);
  await click(p, "#desk-content [data-fourth]");
  assert.match(await openCut(p, "fourth"), /拖到最左/);
  await leave(p);
  await p.locator("#last-cut").focus();
  await p.keyboard.press("Home");
  await openCut(p, "lens");
  await leave(p, true);
  assert.equal(await p.locator("#counter-roles").isVisible(), true);
  assert.deepEqual((await saved(p)).seen, ["post", "spool", "fourth", "lens"]);
  await arrive(p, "top");
  await arrive(p, "fourth");
  await click(p, "#fourth [data-fourth]");
  assert.match(await p.locator("#desk-heading").innerText(), /空袋/);
  await click(p, "#dialog-close");
  assert.equal(await p.locator('[data-ending="both"]').isEnabled(), true);
  await click(p, '[data-ending="both"]');
  assert.match(await p.locator("#end-last").innerText(), /她叫阿禾/);
  await p.reload();
  assert.match(await p.locator("#end-title").innerText(), /说完/);
  await arrive(p, "coda");
  assert.equal((await saved(p)).ending, "both");
  return "白班三份回执、声音与持续静音、假重启后刷新、四次特写、双底结局";
}
async function otherRoute(p, ending) {
  await click(p, '[data-observe="person"]');
  await night(p);
  if (ending === "restore") {
    await click(p, '[data-signer="self"]');
    assert.match(await p.locator("#second-call").innerText(), /请本人/);
    await click(p, '[data-print="three"]');
    await click(p, '[data-slot="father"]');
    await click(p, '[data-print="empty"]');
    await click(p, '[data-slot="daughter"]');
    await click(p, "#seal-frames");
    assert.match(await p.locator("#frame-slip").innerText(), /没有进门/);
    await click(p, ".neg-compare");
    await click(p, ".neg-snap");
    await click(p, '[data-tape-side="B"]');
    await click(p, ".tape-match");
    assert.equal(await p.locator('[data-ending="both"]').isDisabled(), true);
  }
  await arrive(p, "fourth");
  await click(p, "#fourth [data-fourth]");
  assert.match(await openCut(p, "fourth"), /椅子上坐着一个人/);
  await leave(p);
  await click(p, '[data-ending="' + ending + '"]');
  const text = await p.locator("#end-last").innerText();
  if (ending === "restore") assert.match(text, /爸，是我/);
  else {
    assert.match(text, /辛苦你接班/);
    await click(p, '[data-ending="order"]');
    assert.match(await p.locator("#desk-content").innerText(), /辛苦你接班/);
    await click(p, "#dialog-close");
  }
  await click(p, "#workbar [data-restart]");
  await click(p, "[data-dismiss]");
  assert.equal((await saved(p)).ending, ending);
  await click(p, "#workbar [data-restart]");
  await click(p, "[data-confirm-reset]");
  await p.waitForSelector("#day-shift:visible");
  assert.equal((await saved(p)).observation, "");
  assert.deepEqual((await saved(p)).seen, []);
  assert.equal((await saved(p)).ending, "");
  return ending + " 结局、真实原话、真重开";
}
async function unsigned(p) {
  await night(p, true);
  await bottom(p);
  await wait(p, () => document.querySelector("#window-layer").src.endsWith("window-near.webp"));
  const s = await saved(p);
  assert.equal(s.observation, "");
  assert.equal(s.signer, "");
  assert.equal(s.echo, "");
  assert.equal(s.ending, "");
  assert.equal(s.green, null);
  assert.equal(s.thread, false);
  assert.equal(s.cut, false);
  assert.deepEqual(s.seen, []);
  assert.deepEqual(s.proof, []);
  assert.equal(s.left, false);
  await arrive(p, "post");
  await bottom(p);
  assert.deepEqual((await saved(p)).proof, []);
  await arrive(p, "fourth");
  await click(p, "#fourth [data-fourth]");
  assert.match(await openCut(p, "fourth"), /等纸上有一句/);
  await click(p, "#closeup [data-restart]");
  await click(p, "[data-confirm-reset]");
  await p.waitForSelector("#day-shift:visible");
  return "手机快速滚动、无签字橱窗、无操作保持沉默、特写内真重开";
}
async function checkAssets(p) {
  return p.evaluate(async () => {
    const data = await ShiftSound.catalog;
    const ctx = new AudioContext();
    try {
      for (const [id, rec] of Object.entries(data)) {
        const buffer = await ctx.decodeAudioData(
          await (await fetch("./assets/shift/" + id + ".mp3")).arrayBuffer(),
        );
        if (Math.abs(buffer.duration - rec.duration) > 0.12 || !rec.cues.length)
          throw Error("bad audio " + id);
      }
      if (Object.keys(data).length !== 19) throw Error("missing cues");
      return "19 条录音逐条解码与字幕时长";
    } finally {
      await ctx.close();
    }
  });
}
async function run() {
  const browser = await chromium.launch({ channel: process.env.CHROME_CHANNEL || "chrome" });
  try {
    const cases = [
      [mainRoute, 1440, 900],
      [(p) => otherRoute(p, "order"), 768, 1024],
      [(p) => otherRoute(p, "restore"), 390, 844],
      [unsigned, 320, 658],
    ];
    for (const [route, width, height] of cases) {
      const ctx = await browser.newContext({
        viewport: { width, height },
        isMobile: width < 450,
        hasTouch: width < 450,
        reducedMotion: width < 450 ? "reduce" : "no-preference",
      });
      await ctx.addInitScript(() => {
        window.testMedia = [];
        const Original = window.Audio;
        window.Audio = class extends Original {
          constructor(...args) {
            super(...args);
            window.testMedia.push(this);
          }
        };
      });
      const p = await ctx.newPage(),
        errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      p.on("response", (r) => {
        if (r.status() >= 400 && r.url().startsWith(url)) errors.push(r.status() + " " + r.url());
      });
      await p.goto(url);
      await p.waitForSelector("#workbar");
      await p.evaluate(() => document.fonts.ready);
      assert.ok(
        await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        "day overflows at " + width,
      );
      assert.equal(await p.locator("[data-script]").count(), 12);
      if (width === 1440) console.log(await checkAssets(p));
      const result = await route(p);
      assert.ok(
        await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1),
        "overflow at " + width,
      );
      assert.deepEqual(errors, []);
      console.log(width + "px　" + result);
      await ctx.close();
    }
  } finally {
    await browser.close();
  }
}
run().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
