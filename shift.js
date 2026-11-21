"use strict";
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const by = (id) => document.getElementById(id);
  const write = (id, text) => {
    by(id).textContent = text;
  };
  const shift = (file) => "./assets/shift/" + file + ".webp";
  const album = (file) => "./assets/album/" + file + ".webp";
  function picture(el, src, alt) {
    if (el.getAttribute("src") !== src) el.src = src;
    if (alt !== undefined) el.alt = alt;
  }
  const key = "shixiang-counter-v2";
  const blank = () => ({
    phase: "day",
    green: null,
    tone: 26,
    observation: "",
    thread: false,
    cut: false,
    left: false,
    look: 0,
    carbon: false,
    signer: "",
    father: "",
    daughter: "",
    framed: false,
    spool: 0,
    registered: [],
    stage: 0,
    seen: [],
    proof: [],
    pages: {},
    ending: "",
    lastCut: 100,
    echo: "",
    echoTracks: [],
    bells: [],
  });
  let state = blank();
  try {
    const saved = JSON.parse(sessionStorage.getItem(key));
    if (saved && ["day", "night", "ending"].includes(saved.phase)) Object.assign(state, saved);
  } catch {}
  const night = () => state.phase !== "day";
  function ringOnce(id, sound) {
    if (state.bells.includes(id)) return;
    state.bells.push(id);
    save();
    ShiftSound.sfx(sound);
  }
  const seen = (id) => state.seen.includes(id);
  const words = { empty: "椅子是空的。", person: "椅子上坐着一个人。", unsure: "我看不清楚。" };
  const names = { father: "父亲", daughter: "阿禾", empty: "空椅照", three: "三人照" };
  const evidenceCases = {
    postprint: "post",
    negative: "family",
    letter: "family",
    splice: "family",
    voices: "family",
    register: "clerk",
  };
  const sources = () => new Set(state.proof.map((p) => evidenceCases[p]).filter(Boolean));
  function save() {
    try {
      sessionStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }
  function addProof(id) {
    if (Object.hasOwn(evidenceCases, id) && !state.proof.includes(id)) state.proof.push(id);
  }
  function pressed(selector, prop, value) {
    $$(selector).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset[prop] === value)));
  }
  function jump(id) {
    by(id).scrollIntoView({ block: "start", behavior: "instant" });
  }
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function mountReader(node) {
    const id = node.dataset.script,
      scene = SHIFT_PLAY[id];
    node.className = "scene-reader";
    node.innerHTML =
      '<div class="reader-head"><b></b><small></small></div><p class="reader-prose" aria-live="polite"></p><div class="reader-turn"><button data-page="-1" aria-label="上一页">←</button><button data-page="1">翻到下页 →</button></div>';
    const update = () => {
      const i = state.pages[id] || 0;
      node.querySelector("b").textContent = scene.pages[i][0];
      node.querySelector("small").textContent = "口述记录　" + (i + 1) + " / " + scene.pages.length;
      node.querySelector(".reader-prose").textContent = scene.pages[i][1];
      node.querySelector('[data-page="-1"]').disabled = i === 0;
      const next = node.querySelector('[data-page="1"]');
      next.textContent = i === scene.pages.length - 1 ? "已到末页" : "翻到下页 →";
      next.disabled = i === scene.pages.length - 1;
    };
    node.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn) return;
      state.pages[id] = Math.max(
        0,
        Math.min(scene.pages.length - 1, (state.pages[id] || 0) + Number(btn.dataset.page)),
      );
      update();
      save();
    });
    if (scene.follow) {
      const fold = document.createElement("details"),
        q = document.createElement("summary"),
        a = document.createElement("p");
      q.textContent = "追问　" + scene.follow[0];
      a.textContent = scene.follow[1];
      fold.append(q, a);
      node.append(fold);
    }
    update();
  }
  $$("[data-script]").forEach(mountReader);
  const toneName = (n) => (n < 36 ? "带黄的旧绿" : n < 72 ? "避光处的邮绿" : "偏蓝的深绿");
  function receipts() {
    const rows = [
      ["014-A · 老梁", state.green === null ? "色样栏留空" : "原片封存 · " + toneName(state.green)],
      [
        "027-B · 母亲",
        (state.thread ? "红线已封存" : "红线待封存") + " / " + (words[state.observation] || "第一联未落笔"),
      ],
      ["031-C · 许棠", state.cut ? "挂机点 00:09.1 · 尾音另存" : "剪接栏留空"],
    ];
    return rows
      .map(([who, what]) => '<div class="receipt-row"><b>' + who + "</b><span>" + what + "</span></div>")
      .join("");
  }
  function dayView() {
    by("green-tone").value = state.tone;
    by("green-tone").disabled = state.green !== null;
    write("green-value", toneName(state.tone));
    by("green-photo").style.filter =
      "sepia(" + (100 - state.tone) * 0.006 + ") saturate(" + (0.65 + state.tone / 100) + ")";
    by("green-value").style.setProperty("--sample", "hsl(" + (56 + state.tone * 0.74) + " 23% 35%)");
    by("seal-green").disabled = state.green !== null;
    write(
      "green-slip",
      state.green === null ? "按样片调色，原件单独入袋。" : "一号已封。老梁挑起车撑，把这份色样夹进了邮册。",
    );
    pressed("[data-observe]", "observe", state.observation);
    $$("[data-observe]").forEach((b) => (b.disabled = !!state.observation || state.thread));
    by("seal-thread").disabled = state.thread;
    write(
      "observation-status",
      (state.observation ? "第一联原话「" + words[state.observation] + "」" : "第一联留白。") +
        (state.thread ? "　母亲收好样片，用指腹摸了一遍线头。" : ""),
    );
    if (state.cut) {
      pressed("[data-cutpoint]", "cutpoint", "line");
      $$("[data-cutpoint]").forEach((b) => (b.disabled = true));
      write("cut-slip", "三号已封。线路在 9.1 秒断开。许棠把原带留在店里，挂断后的那句也在。");
    }
    $("[data-receipts]").innerHTML = receipts();
  }
  const records = [
    ["旧签收单 · 1998", "纸角上，「本人」的末笔穿透了背面。", "把签收联覆在原件上", "代签笔迹"],
    ["电话定位卡 · 2004 拷贝", "两响之间有一道木柜弹簧的回声。", "把提示音覆在铃座上", "柜内提示音"],
    ["胶卷 · 2001 翻拍", "底片边缘缺掉的半圆，直径和铃座一样。", "把机位图覆在柜内侧", "反射机位"],
  ];
  by("register-slots").innerHTML = records
    .map(
      ([name, clue], i) =>
        "<div><b>" +
        name +
        "</b><p>" +
        clue +
        '</p><button data-record="' +
        i +
        '">拿起这份副本</button></div>',
    )
    .join("");
  by("register-slots").insertAdjacentHTML(
    "afterend",
    '<div class="register-marks" aria-label="灯台上的三个缺口"><span>灯台原件</span><button data-mark="1">铃座的双响</button><button data-mark="2">玻璃反向的半圆</button><button data-mark="0">收件栏的笔尾</button></div>',
  );
  let heldRecord = null;
  const endings = window.SHIFT_ENDINGS;
  function indexOpen() {
    const targets = night() ? ["post", "family", "apprentice"] : ["today", "intake", "day-tape"];
    const links = ["014-A　老梁的邮局", "027-B　母亲的藤椅", "031-C　" + clerkName() + "的胶卷"];
    let html =
      '<div class="index-list">' +
      targets.map((id, i) => '<a data-enter href="#' + id + '">' + links[i] + "　↗</a>").join("");
    if (night() && state.stage >= 2)
      html +=
        "<button data-fourth>004　正在看底片的人　" + (seen("fourth") ? "空袋" : "许　棠") + "</button>";
    html += "</div><h3>白班封存联</h3>" + receipts();
    if (night())
      html +=
        '<p class="index-carbon">柜台副联　' +
        (state.carbon ? "经本人确认，椅子从来就是空的。" : "黑面尚未揭开。") +
        "</p>";
    StudioDesk.show(night() ? "夜班工单夹" : "白班工单夹", html);
  }
  function clerkName() {
    return seen("fourth") ? "许棠" : state.stage >= 2 ? "许□木" : state.registered.length ? "许□" : "许棠";
  }
  function renderStorefront() {
    document.body.classList.toggle("second-shift", night());
    document.body.classList.toggle("after-cut", seen("lens"));
    by("day-shift").hidden = night();
    by("night-shift").hidden = !night();
    const dayCount = Number(state.green !== null) + Number(state.thread) + Number(state.cut);
    write("shift-label", night() ? (state.ending ? "已经闭店" : "夜班复核") : "白班营业");
    const t = night()
      ? state.ending
        ? "00:01"
        : ["18:07", "19:46", "21:13", "23:59"][state.stage]
      : ["09:00", "11:25", "14:40", "17:58"][dayCount];
    write("shift-clock", t);
    by("shift-clock").dateTime = t;
    if (!night()) return;
    document.title = "拾相修复所 · 请本人签收";
    $$("[data-archive-link]").forEach((a) => {
      a.href = "#post";
      a.textContent = "夜班退件";
    });
    by("hero-action").href = seen("lens") ? "#delivery" : "#post";
    $("#hero-action span").textContent = seen("lens") ? "许棠 · 等待交件" : "查收夜班退件";
    by("hero-intro").textContent = seen("lens")
      ? "老梁在窗口等副联。母亲扶着相框。以前负责盖章的那个人，已经把位子腾出来了。"
      : "今日收件已经封袋。三位客人约在闭店前，再来核对一次。请保留白班的回执。";
    write("sample-caption", seen("lens") ? "同一枚铃，从柜台里面响了一声。" : "南桥巷，退回的原片");
    $(".label-before").textContent = "交件副本";
    $(".label-after").textContent = "原片";
    picture($(".aged img"), album("front"));
    picture(
      $(".comparison > .restored"),
      state.ending === "restore" || state.ending === "both" ? shift("family-answer") : album("occupied"),
      "夜班原件，窗前的藤椅里多出一道身影",
    );
    const invaded = state.stage >= 2;
    ["#compact-nav", ".main-nav", ".case-grid"].forEach((selector) => {
      const host = $(selector);
      if (!invaded || host.querySelector("[data-fourth]")) return;
      const button = document.createElement("button");
      button.dataset.fourth = "";
      if (selector === ".case-grid") {
        button.className = "case intruder";
        button.dataset.medium = "film";
        button.hidden = $('[data-filter][aria-pressed="true"]').dataset.filter === "print";
        button.innerHTML =
          '<span class="case-img fourth-print"></span><span class="case-meta">004 · 借阅中</span><strong>正在看底片的人</strong><span class="case-foot">夹页里掉出一个「棠」字</span>';
      } else button.textContent = "第四项 · 棠";
      host.append(button);
    });
    document.body.classList.toggle("empty-file", seen("fourth"));
    if (seen("fourth")) {
      $$(".mini-cases img").forEach((img, i) =>
        picture(img, shift(["post-close", "family-turn", "xu-turn"][i])),
      );
      $$(".case-grid .case-img img").forEach((img, i) =>
        picture(img, shift(["post-close", "family-turn", "xu-turn"][i])),
      );
    }
    if (seen("lens")) {
      $("[data-query]").lastChild.textContent = "老梁 · 查件";
      $(".hero-actions [data-service]").textContent = "母亲 · 两只相框";
    }
  }
  let selectedPrint = "";
  function nightView() {
    if (!night()) return;
    const looked = state.look > 0,
      fingerprint = seen("post");
    picture(
      by("post-photo"),
      fingerprint ? shift("post-trace") : looked ? shift("post-far") : album("street"),
      fingerprint ? "镜片内侧留下的反向拇指印" : looked ? "放大镜里远处的老梁" : "白班封存的邮局原照",
    );
    write(
      "post-caption",
      fingerprint
        ? "放大镜已撤 · 逆向指印在内侧"
        : looked
          ? "同一面玻璃 · 老梁仍站在柜台后面"
          : state.green === null
            ? "街景背后藏着第二张照片。"
            : "白班色样 · " + toneName(state.green) + "。街景背后夹着第二张照片。",
    );
    write("focus-post", fingerprint ? "指印已入袋" : looked ? "把同一块玻璃对清" : "第一次检查玻璃");
    by("focus-post").disabled = fingerprint;
    by("play-sign").hidden = !fingerprint;
    write(
      "post-note",
      fingerprint
        ? "鼻尖离开以后，斗形纹朝向柜台内侧。签字的人当时在玻璃后面。"
        : looked
          ? "他站得很远。再看同一个位置。"
          : "邮差的车还倚着墙，窗内的东西看不真切。",
    );
    write("first-quote", words[state.observation] || "此栏未落笔");
    write("second-quote", state.carbon ? "经本人确认，椅子从来就是空的。" : "隔着蜡纸，墨迹透不过来。");
    by("lift-carbon").setAttribute("aria-pressed", String(state.carbon));
    $(".carbon").classList.toggle("is-lifted", state.carbon);
    write("lift-carbon", state.carbon ? "盖回复写纸" : "揭开复写纸");
    write(
      "carbon-result",
      state.carbon
        ? "「从来就是」四个字在蓝色蜡层下面，第一联没有这处压痕。"
        : "复写纸的黑面朝上。墨本应落在另一面。",
    );
    pressed("[data-signer]", "signer", state.signer);
    $$("[data-signer]").forEach((b) => (b.disabled = !!state.signer));
    write(
      "sign-slip",
      state.signer === "liang"
        ? "老梁亲手按住修正处。下一声铃会叫他。"
        : state.signer
          ? "「本人」两个字透了两层。下一声铃会照这个称呼叫人。"
          : "老梁把笔递过来。也可以让签收人留空。",
    );
    write(
      "second-call",
      state.signer === "liang"
        ? "第二声取件铃。「代收人老梁，请到窗口。」他把帽子摘下，第一次应了声到。"
        : state.signer
          ? "第二声取件铃。「请本人到窗口。」玻璃两边的人一齐抬了头。"
          : "第二声取件铃。副联没有新签名，老梁还在邮局玻璃后面等。",
    );
    pressed("[data-print]", "print", selectedPrint);
    $$("[data-slot]").forEach((slot) => {
      const print = state[slot.dataset.slot],
        img = slot.querySelector("img");
      if (print) picture(img, print === "empty" ? album("front") : album("occupied"), names[print]);
      img.hidden = !print;
      slot.querySelector("small").textContent = print ? names[print] : "等待装片";
      slot.disabled = state.framed;
    });
    $$("[data-print]").forEach((b) => (b.disabled = state.framed));
    by("seal-frames").disabled = state.framed || !state.father || !state.daughter;
    write(
      "frame-slip",
      state.framed
        ? state.father === "empty"
          ? "窄框给父亲。他先认出那根线，去热第三只碗。宽框给阿禾，母亲把三个人的脸都擦干净。"
          : "父亲看着三张脸，从头问名字。阿禾提着那只空椅宽框，没有进门。"
        : selectedPrint
          ? "手上拿着" + names[selectedPrint] + "，点一只相框装入。"
          : "两张校样各一份。背板扣紧以前还能调换。",
    );
    const sp = state.spool;
    picture(
      by("spool-photo"),
      shift(sp === 3 ? "tape-trace" : sp === 2 ? "tape-lid" : "tape-day"),
      sp === 3 ? "透明带盒已取出，眼睛还留在机仓里" : "透明带仓与静止的带轮",
    );
    write(
      "spool-caption",
      ["带尾 · 透明引带", "B 面 · 已停转", "带轮已停，右边的瞳孔还在转", "带盒已取出 · 眼睛留在机仓"][sp],
    );
    write("eject", ["定位到 B 面带尾", "翻过透明带盒", "抽出磁带", "带盒已取出"][sp]);
    by("eject").disabled = sp === 3;
    write(
      "spool-note",
      [
        "可以播放 B 面，也可以按逐字稿直接定位到结尾。",
        "盘轴停了。母亲说要翻面看一下。",
        "透明塑料后面有一点水光，离带轮很近。",
        "「别替我答。」分轨后，柜台提示者的嗓音与白班的许棠相同。",
      ][sp],
    );
    by("split").hidden = sp !== 3;
    $$("[data-record]").forEach((b, i) => {
      const set = state.registered.includes(i);
      b.disabled = set;
      b.textContent = set ? "已合印 · " + records[i][3] : heldRecord === i ? "拿在手上" : "拿起这份副本";
      b.setAttribute("aria-pressed", String(heldRecord === i));
    });
    $$("[data-mark]").forEach(
      (b) => (b.disabled = heldRecord === null || state.registered.includes(Number(b.dataset.mark))),
    );
    write(
      "register-result",
      state.registered.length === 3
        ? "三个缺口合成同一枚骑缝章。1998 年 11 月 29 日，核对人许棠站在柜台里。2001 年翻拍、2004 年拷贝的都是那次雨夜。"
        : heldRecord !== null
          ? "拿着" + records[heldRecord][0] + "。把它压到能接回印痕的位置。"
          : state.registered.length
            ? state.registered.length + " 份已压紧，印章的圆还缺一段。"
            : "台灯照出三份年代不同的副本，底下压着一张雨夜原单。",
    );
    write("clerk-name", clerkName() + " · " + (seen("fourth") ? "人像栏已迁出" : "夜班学徒"));
    by("clerk-photo").classList.toggle("vacated", seen("fourth"));
    $("[data-menu-message]").textContent = seen("fourth")
      ? "第四格空了。许棠的嘴不再动，那句话留在按钮里。"
      : "前三份来件都有日期。第四只纸袋写着今天的柜台位置。";
    by("last-cut").value = state.lastCut;
    by("last-cut").disabled = seen("lens");
    $(".final-view").style.setProperty("--line", state.lastCut + "%");
    picture(
      by("near-print"),
      seen("lens") ? shift("lens-trace") : state.lastCut < 78 ? shift("lens-mid") : album("darkroom"),
      seen("lens") ? "人已退开，玻璃上只剩一根带水的睫毛" : "暗房玻璃里的修复台",
    );
    write(
      "lens-note",
      seen("lens")
        ? "铃从柜内响了一声。玻璃留下一根湿睫毛，首页的三处柜台已经换人。"
        : "红灯下是早上那张校样。玻璃里面的那个人又往前站了一点。",
    );
    by("counter-roles").hidden = !seen("lens");
    const found = sources();
    $$("[data-proof]").forEach((a) => a.classList.toggle("found", found.has(a.dataset.proof)));
    write(
      "both-hint",
      found.size >= 2
        ? "不同委托的凭据已齐，可分别封袋。"
        : "已核实 " + found.size + " 宗，须取两宗不同来件的凭据。",
    );
    $$("[data-ending]").forEach((b) => {
      const speakingStamp = state.ending === "order" && b.dataset.ending === "order";
      b.disabled = (!speakingStamp && !!state.ending) || (b.dataset.ending === "both" && found.size < 2);
      b.setAttribute("aria-pressed", String(b.dataset.ending === state.ending));
      if (speakingStamp) b.querySelector("small").textContent = "许棠在章里。再按一次。";
    });
    const end = endings[state.ending];
    by("aftermath").hidden = !end;
    if (end) {
      picture(by("return-photo"), end.photo, end.caption);
      write("return-stamp", end.stamp);
      write("return-caption", end.caption);
      write("end-title", end.title);
      write("end-text", end.text);
      write("end-last", end.last);
      write("end-voice", end.button);
      write("decision-status", "交付联已盖章 · " + end.stamp);
      write("coda-title", "巷子里的灯灭了。");
      write("coda-line", end.line);
      by("coda-back").href = "#aftermath";
      write("coda-back", "取回这张收据");
    } else {
      write("coda-title", "第三声铃，没有人应。");
      write(
        "coda-line",
        "取件槽从里面打开。那人把笔帽咬在嘴里，让笔杆穿过玻璃，伸到你手边。签收联最后一格还空着。",
      );
    }
    if (end) {
      $$(
        "#focus-post,[data-signer],[data-print],[data-slot],#seal-frames,#eject,[data-record],[data-mark],#last-cut",
      ).forEach((b) => (b.disabled = true));
    }
  }
  function render() {
    dayView();
    renderStorefront();
    nightView();
    save();
  }
  const preloadNames = [
    "post-far",
    "post-close",
    "post-trace",
    "tape-lid",
    "tape-eye",
    "tape-trace",
    "xu-turn",
    "xu-close",
    "family-turn",
    "glass-eye",
    "lens-mid",
    "lens-trace",
    "window-mid",
    "window-near",
    "pen-window",
    "family-answer",
  ];
  const images = new Map();
  function preload(name) {
    if (!images.has(name)) {
      const image = new Image();
      image.src = shift(name);
      images.set(name, image);
    }
    return images.get(name);
  }
  let transitioning = false;
  function nightfall() {
    if (night() || transitioning) return;
    transitioning = true;
    by("ink-cut").hidden = false;
    ShiftSound.stop();
    ShiftSound.sfx("bell-counter");
    preloadNames.forEach(preload);
    state.phase = "night";
    save();
    setTimeout(
      () => {
        render();
        history.replaceState(null, "", location.pathname + location.search);
        window.scrollTo({ top: 0, behavior: "instant" });
        $("#top .brand").focus({ preventScroll: true });
        window.dispatchEvent(new Event("shift-night"));
        by("ink-cut").hidden = true;
        transitioning = false;
      },
      reduced.matches ? 0 : 290,
    );
  }
  function stage(n) {
    if (!night() || n <= state.stage) return;
    state.stage = n;
    renderStorefront();
    nightView();
    save();
  }
  const cuts = {
    post: { image: "post-close", line: "鼻尖压在放大镜的内侧。它盯着你身后。", effect: "lens-knock" },
    spool: {
      image: "tape-eye",
      line: "带盒已经在手里。眼睛还在机器里。母亲贴近说：「别替我答。」",
      voice: "mother-stop",
    },
    fourth: { image: "xu-close", line: "许棠看着柜台外面，等纸上有一句能念的话。" },
    lens: { image: "glass-eye", line: "半只眼睛。一道鼻梁。玻璃里面没有一点声音。" },
  };
  const closeup = by("closeup");
  let cutTimer = 0,
    activeCut = "",
    cutVersion = 0;
  function echo() {
    if (state.left) return ["xu-extreme", "你把线拖到最左的时候，我终于看见柜台外面了。"];
    if (state.observation) return ["xu-" + state.observation, words[state.observation]];
    if (state.thread) return ["", "你封了红线那一袋。"];
    if (state.green !== null) return ["", "你把那一份绿留在柜台上。"];
    if (state.cut) return ["", "你把挂断后的一句留下了。"];
    if (state.signer)
      return ["", state.signer === "liang" ? "你在副联留下了代收人的名字。" : "你把「本人」留在副联上。"];
    if (state.framed) return ["", "你扣紧了两块相框背板。"];
    if (state.registered.length) return ["", "你把纸压到了灯台上。"];
    return ["", ""];
  }
  function returnFromCut() {
    clearTimeout(cutTimer);
    cutVersion++;
    if (!activeCut) return;
    const id = activeCut;
    activeCut = "";
    ShiftSound.stop();
    if (id === "lens") {
      ShiftSound.hush(false);
      ShiftSound.sfx("bell-inside");
    }
    nightView();
    if (by("desk-dialog").open) return;
    if (id === "lens") {
      jump("top");
      by("hero-action").focus({ preventScroll: true });
    } else {
      const landing =
        id === "post" ? by("post-photo") : id === "spool" ? by("spool-photo") : $(".mini-cases");
      landing.tabIndex = -1;
      landing.focus({ preventScroll: true });
      landing.scrollIntoView({ block: "center", behavior: "instant" });
    }
  }
  closeup.addEventListener("close", returnFromCut);
  by("leave-cut").addEventListener("click", () => closeup.close());
  function scare(id) {
    if (!night() || seen(id) || activeCut || closeup.open) return;
    const spec = cuts[id];
    let voice = spec.voice,
      line = spec.line,
      rest = [];
    if (id === "fourth") {
      let [track, spoken] = echo();
      voice = track;
      if (state.left && state.observation) {
        rest = [track];
        voice = "xu-" + state.observation;
        spoken = words[state.observation] + spoken;
      }
      state.echo = spoken;
      state.echoTracks = [voice, ...rest].filter(Boolean);
      line = spoken ? "许棠贴在镜片上：「" + spoken + "」" : spec.line;
    }
    activeCut = id;
    if (by("desk-dialog").open) StudioDesk.close();
    ShiftSound.stop();
    if (id === "lens") ShiftSound.hush(true);
    closeup.dataset.shot = id;
    picture(by("closeup-img"), shift(spec.image), line);
    write("closeup-line", line);
    const version = ++cutVersion;
    function show() {
      if (version !== cutVersion || activeCut !== id) return;
      state.seen.push(id);
      if (id === "post") addProof("postprint");
      if (id === "spool") {
        state.spool = 3;
        addProof("voices");
      }
      render();
      closeup.showModal();
      by("leave-cut").focus({ preventScroll: true });
      if (spec.effect) ShiftSound.sfx(spec.effect);
      if (voice) ShiftSound.play(voice, false, 0.9, rest);
      const hold = id === "fourth" && ShiftSound.enabled && voice ? (rest.length ? 11500 : 8200) : 3300;
      cutTimer = setTimeout(() => {
        if (closeup.open) closeup.close();
      }, hold);
    }
    // Give the turning thumbnails a frame before the smallest portrait fills the screen.
    if (id === "fourth") {
      $$(".mini-cases img").forEach((img, i) =>
        picture(img, shift(["post-close", "family-turn", "xu-turn"][i])),
      );
      $$(".case-grid .case-img img").forEach((img, i) =>
        picture(img, shift(["post-close", "family-turn", "xu-turn"][i])),
      );
    }
    const image = preload(spec.image);
    const decoded = image.decode ? image.decode().catch(() => {}) : Promise.resolve();
    decoded.then(() => {
      if (id === "fourth" && !reduced.matches) setTimeout(show, 200);
      else show();
    });
  }
  function fourth() {
    if (!night() || state.stage < 2 || activeCut) return;
    if (by("desk-dialog").open) StudioDesk.close();
    $(".mini-cases").scrollIntoView({ block: "center", behavior: "instant" });
    if (state.ending && !seen("fourth")) {
      StudioDesk.show(
        "已闭店",
        '<p>第四只袋子仍然封着。取件联已经盖过章，印泥干了。</p><button class="work-action" data-dismiss>放回工单夹</button>',
      );
      return;
    }
    if (seen("fourth")) {
      StudioDesk.show(
        "第四只空袋",
        "<p>袋内只有一句铅笔小字：请把人名还到工牌上。</p><p>许棠。两个字终于排在一起。" +
          (state.echo ? "按钮里面仍压着那句话。" : "听不见他说话。") +
          '</p><button data-dismiss class="work-action">把空袋放回</button>',
      );
      return;
    }
    scare("fourth");
  }
  const witnesses = [
    ["post", "carbon", "老梁在玻璃后抬起手。你从柜台前经过，只看见他把代签单向里折了一折。"],
    ["spool", "apprentice", "带盘已经静止。母亲把取出的磁带装回纸盒，另一只手仍然捂着机器。"],
    ["fourth", "darkroom", "三张缩略图排得很紧，旁边挤出一个空格。许棠张了张嘴，柜台上没有声音。"],
    ["lens", "delivery", "红灯灭了一下。玻璃内侧有一小块地方起了雾，像有人刚刚俯过身。"],
  ];
  function updateWitnesses() {
    witnesses.forEach(([id, next]) => {
      const section = by(next);
      const note = section.querySelector(".witness-note");
      if (note) note.hidden = seen(id) || !night() || section.getBoundingClientRect().top > innerHeight * 0.9;
    });
  }
  witnesses.forEach(([id, next, text]) => {
    const note = document.createElement("p");
    note.className = "witness-note";
    note.hidden = true;
    note.textContent = text;
    by(next).querySelector("h2").after(note);
  });
  function setFrame(slot) {
    if (state.framed) return;
    if (!selectedPrint) {
      write("frame-slip", "先从桌上拿起空椅照或三人照。");
      return;
    }
    const other = slot === "father" ? "daughter" : "father";
    if (state[other] === selectedPrint) state[other] = state[slot] || "";
    state[slot] = selectedPrint;
    selectedPrint = "";
    render();
  }
  function selectEnding(choice) {
    if (
      !night() ||
      state.ending ||
      !Object.hasOwn(endings, choice) ||
      (choice === "both" && sources().size < 2)
    )
      return;
    state.ending = choice;
    state.phase = "ending";
    stage(3);
    render();
    ShiftSound.stop();
    ShiftSound.play("ending-" + choice);
    jump("aftermath");
    by("end-title").focus({ preventScroll: true });
    onScroll();
  }
  function restartDialog() {
    if (closeup.open) closeup.close();
    StudioDesk.show(
      "重开这卷底片？",
      '<p>本标签页的交件单、第一联、查到的证据和已放过的特写将一起清空。柜台会回到白班开门时。</p><div class="option-row"><button class="work-action" data-confirm-reset>重开，回到白班</button><button data-dismiss>继续这一卷</button></div>',
    );
  }
  function reset() {
    ShiftSound.set(false);
    try {
      sessionStorage.removeItem(key);
      sessionStorage.removeItem("shixiang-counter-recall-v2");
    } catch {}
    history.replaceState(null, "", location.pathname + location.search);
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
    location.reload();
  }
  function doRole(role) {
    if (role === "liang") {
      jump("carbon");
      return;
    }
    if (role === "mother") {
      jump("family");
      return;
    }
    const order = state.ending === "order";
    const text = order
      ? "辛苦你接班。"
      : seen("fourth")
        ? state.echo
        : "请本人签收。你不接，我就只能再叫一次。";
    StudioDesk.show(
      "按钮里面的人",
      '<p>指尖落下，印章轻轻弹了一下。</p><p class="stamp-reply"></p><button data-dismiss class="work-action">松开按钮</button>',
    );
    $(".stamp-reply").textContent = text ? "「" + text + "」" : "没有字，许棠也没出声。";
    const [first, ...rest] = order ? ["ending-order"] : seen("fourth") ? state.echoTracks : ["xu-handover"];
    if (first) ShiftSound.play(first, false, 0.9, rest);
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("button,a");
    if (!b || b.disabled) return;
    const d = b.dataset;
    if (b.hasAttribute("data-index")) {
      indexOpen();
      return;
    }
    if (b.hasAttribute("data-restart") || b.hasAttribute("data-reset")) {
      restartDialog();
      return;
    }
    if (b.hasAttribute("data-confirm-reset")) {
      reset();
      return;
    }
    if (b.hasAttribute("data-fourth")) {
      fourth();
      return;
    }
    if (!night()) {
      if (b.matches(".flip")) {
        const back = $(".proof-back"),
          front = $(".proof-front");
        back.hidden = !back.hidden;
        front.hidden = !back.hidden;
        b.setAttribute("aria-pressed", String(!back.hidden));
        b.querySelector("span").textContent = back.hidden ? "翻看照片背面" : "翻回第一联正面";
      }
      if (d.observe && Object.hasOwn(words, d.observe) && !state.thread && !state.observation)
        state.observation = d.observe;
      if (b.id === "seal-green" && state.green === null) {
        state.green = state.tone;
      }
      if (b.id === "seal-thread") {
        state.thread = true;
      }
      if (d.cutpoint) {
        if (d.cutpoint !== "line") {
          write(
            "cut-slip",
            d.cutpoint === "plastic"
              ? "塑料壳碰座时线路还没有断，听听底噪消失的位置。"
              : "那句轻声的话留在挂机以后。先找线路真正断开的一刻。",
          );
          return;
        }
        state.cut = true;
        preloadNames.forEach(preload);
      }
      if (b.id === "close-day") {
        nightfall();
        return;
      }
      if (d.observe || d.cutpoint || b.id === "seal-green" || b.id === "seal-thread") render();
      return;
    }
    if (b.id === "focus-post") {
      if (state.look) scare("post");
      else {
        state.look = 1;
        preload("post-close");
        render();
      }
      return;
    }
    if (b.id === "lift-carbon") {
      state.carbon = !state.carbon;
      render();
      return;
    }
    if (d.signer && !state.signer) {
      state.signer = d.signer;
      render();
      return;
    }
    if (d.print) {
      selectedPrint = d.print;
      nightView();
      return;
    }
    if (d.slot) {
      setFrame(d.slot);
      return;
    }
    if (b.id === "seal-frames" && state.father && state.daughter) {
      state.framed = true;
      selectedPrint = "";
      render();
      return;
    }
    if (b.id === "eject") {
      if (state.spool === 2) scare("spool");
      else if (state.spool < 2) {
        state.spool++;
        window.dispatchEvent(new Event("shift-stop-cassette"));
        render();
      }
      return;
    }
    if (d.record !== undefined && !state.registered.includes(Number(d.record))) {
      heldRecord = Number(d.record);
      nightView();
      return;
    }
    if (d.mark !== undefined && heldRecord !== null) {
      if (heldRecord !== Number(d.mark)) {
        write("register-result", "印痕差了一截。这份副本仍在手上，再对照纸角、铃声和机位。");
        return;
      }
      state.registered.push(heldRecord);
      heldRecord = null;
      if (state.registered.length === 3) {
        addProof("register");
        stage(2);
      }
      render();
      return;
    }
    if (d.ending) {
      if (state.ending === "order" && d.ending === "order") doRole("xu");
      else selectEnding(d.ending);
      return;
    }
    if (b.id === "end-voice") {
      ShiftSound.play("ending-" + state.ending, true);
      return;
    }
    if (d.customer) doRole(d.customer);
    if (b.matches(".recall-return")) {
      e.preventDefault();
      indexOpen();
    }
  });
  by("green-tone").addEventListener("input", (e) => {
    state.tone = +e.target.value;
    dayView();
    save();
  });
  by("last-cut").addEventListener("input", (e) => {
    if (!night() || seen("lens")) return;
    state.lastCut = +e.target.value;
    if (state.lastCut <= 30) {
      scare("lens");
      return;
    }
    nightView();
    save();
  });
  window.addEventListener("studio-evidence", (e) => {
    if (night() && !state.ending) {
      addProof(e.detail);
      nightView();
      save();
    }
  });
  window.addEventListener("shift-tape-tail", () => {
    if (night() && !state.ending && !state.spool) {
      state.spool = 1;
      render();
    }
  });
  let scheduled = false,
    codaFrame = "";
  function onScroll() {
    scheduled = false;
    if (transitioning) return;
    if (!night()) {
      if (scrollY > innerHeight && innerHeight + scrollY >= document.documentElement.scrollHeight - 6)
        nightfall();
      return;
    }
    const threshold = innerHeight * 0.68;
    const family = by("family").getBoundingClientRect();
    if (!activeCut && !state.ending && family.top < threshold && family.bottom > threshold)
      ringOnce("second", "bell-counter");
    if (by("darkroom").getBoundingClientRect().top < threshold) stage(3);
    else if (by("fourth").getBoundingClientRect().top < threshold) stage(2);
    else if (by("family").getBoundingClientRect().top < threshold) stage(1);
    updateWitnesses();
    const entry = 1 - by("coda").getBoundingClientRect().top / innerHeight;
    if (entry <= 0) return;
    if (entry > 0.57 && !state.ending && !seen("lens") && !activeCut) ringOnce("window", "bell-inside");
    by("coda").classList.add("in-window");
    const frame =
      entry < 0.3
        ? ""
        : entry < 0.57
          ? "window-mid"
          : entry < 0.82
            ? state.ending
              ? "window-near"
              : "pen-window"
            : state.ending
              ? "window-mid"
              : "window-near";
    const layer = by("window-layer");
    layer.hidden = !frame;
    if (frame && codaFrame !== frame) picture(layer, shift(frame));
    codaFrame = frame;
  }
  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    if (night()) onScroll();
  });
  window.ShiftRun = {
    get night() {
      return night();
    },
    get invaded() {
      return night() && state.stage >= 2;
    },
    markLeft() {
      if (!night() && !state.left) {
        state.left = true;
        save();
      }
    },
    fourth,
    indexOpen,
    doRole,
    get recast() {
      return seen("lens");
    },
    get evidence() {
      return [...state.proof];
    },
  };
  render();
  if (night()) preloadNames.forEach(preload);
  window.addEventListener("pageshow", () => {
    if (night()) requestAnimationFrame(onScroll);
  });
})();
