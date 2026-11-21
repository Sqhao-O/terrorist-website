"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const observationText = {
    empty: "椅子是空的。",
    person: "椅子上坐着一个人。",
    unsure: "我看不清楚。",
  };
  const clues = ["carbon", "negative", "splice", "letter"];
  const endings = {
    order: {
      title: "两张照片，三个指印。",
      stamp: "照单交付",
      image: "front",
      caption: "取件回执　27-B / 一底两印",
      text: "她把两张空椅照面对面合起来，拿棉线捆成一个小包。取件栏上按了三个指印。第三个很浅，指腹的纹路里夹着一小截藤皮。",
      last: "打烊后你去擦橱窗。玻璃上倒映着一家三口，只有等你从玻璃前走开，他们才凑得齐。",
      headline: ["已经修好，", "原样交付。"],
      sample: "归档样片 · 两人合影",
      storefront: "本卷已按第二联交付。右侧椅面确认为空，校样人的原话留存在第一联。",
    },
    restore: {
      title: "工牌的背面。",
      stamp: "第 27 格",
      image: "occupied",
      caption: "取件回执　27-B / 全幅放大",
      text: "你把椅子上的人洗了出来。那件灰开衫胸口有一处方方的褪色，正好能放进柜台上那张工牌。牌背的别针，跟照片里两道锈印分毫不差。",
      last: "母亲拿走了照片。门铃再响的时候，你想从椅子上站起来。相纸在你膝盖上，轻轻折了一道白痕。",
      headline: ["人已到齐，", "请看镜头。"],
      sample: "归档样片 · 三人合影",
      storefront: "本卷已按第 27 格重印。橱窗换上了新样片，右边那位仍戴着所里的工牌。",
    },
    both: {
      title: "这一栏，留空。",
      stamp: "原底未裁",
      image: "enlarger",
      caption: "原底封套　26 / 27 / 28　并存",
      text: "你把互相抵牾的底片和查到的痕迹一起封好。取件人的名字空着。母亲摸了摸两张照片的边，说：「都有一道线头。这个朝里，那个朝外。两张我都要。」",
      last: "你没有替她把话说完。橱窗里留着那张空椅照。灯灭以后，纸袋里传来一根藤条慢慢回弹的声音。",
      headline: ["留下底片，", "暂不定影。"],
      sample: "原件留存 · 身份未核",
      storefront: "本卷保留了两种互不相容的记录。交付表上的取件人一栏，仍然空着。",
    },
  };
  const hasKey = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const storageKey = "shixiang-roll-27b-v1";
  const cleanState = () => ({ observation: null, evidence: [], ending: null });
  function readState() {
    try {
      const data = JSON.parse(sessionStorage.getItem(storageKey));
      if (!data || typeof data !== "object") return cleanState();
      const state = cleanState();
      if (hasKey(observationText, data.observation)) state.observation = data.observation;
      if (Array.isArray(data.evidence)) state.evidence = clues.filter((clue) => data.evidence.includes(clue));
      if (hasKey(endings, data.ending) && (data.ending !== "both" || state.evidence.length >= 2))
        state.ending = data.ending;
      return state;
    } catch {
      return cleanState();
    }
  }
  let state = readState();
  function persist() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* The current tab still works in memory. */
    }
  }
  function record(clue) {
    if (!clues.includes(clue) || state.evidence.includes(clue)) return;
    state.evidence.push(clue);
    persist();
    drawEvidence();
  }
  window.addEventListener("studio-evidence", (event) => record(event.detail));

  const menu = $(".menu");
  function setMenu(open) {
    $("#compact-nav").hidden = !open;
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "收起导航" : "展开导航");
    menu.querySelector("use").setAttribute("href", open ? "#close" : "#menu");
  }
  menu.addEventListener("click", () => setMenu($("#compact-nav").hidden));
  document.addEventListener("click", (event) => {
    if (!$("#compact-nav").hidden && !event.target.closest(".menu")) setMenu(false);
  });
  window.matchMedia("(max-width:720px)").addEventListener("change", () => setMenu(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !$("#compact-nav").hidden) {
      setMenu(false);
      menu.focus();
    }
  });

  const compare = $("#compare");
  function setCut() {
    $(".comparison").style.setProperty("--cut", compare.value + "%");
    compare.setAttribute("aria-valuetext", "原片占 " + compare.value + "%");
  }
  compare.addEventListener("input", setCut);
  setCut();
  function filterCases(filter) {
    $$("[data-filter]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filter === filter)));
    $$(".case").forEach((card) => {
      card.hidden = filter !== "all" && card.dataset.medium !== filter;
    });
  }
  $$("[data-filter]").forEach((b) => b.addEventListener("click", () => filterCases(b.dataset.filter)));

  const cases = {
    "014-A": {
      name: "邮局门前的自行车",
      image: "street",
      work: "彩色相纸 · 014-A",
      info: "原片一直夹在集邮册的玻璃纸下，晒得只剩暖黄。我们以邮筒里侧没见过光的一块绿漆校色。车座下面那条发白的补丁，按来件人的意思留了下来。",
    },
    "27-B": {
      name: "院子里的最后一张合影",
      image: "front",
      work: "家庭留影 · 27-B",
      info: "相纸在窗格处有裂纹，藤编细处几乎吃进底色。修片时顺着藤皮的走向一点点补，扶手边绕的那截红线没有动。纸袋里还夹着一份等人核对的工单。",
    },
    "031-C": {
      name: "未冲印的那一卷",
      image: "enlarger",
      work: "35 毫米彩色负片 · 031-C",
      info: "底片在铁盒里卷了二十多年，边缘已向内收。我们在看片台上逐格压平扫描，连齿孔与片头一并交还。归档的人以后还能知道哪一格在前，哪一格在后。",
    },
  };
  const desk = $("#desk-dialog");
  const content = $("#desk-content");
  let opener = null;
  function showDesk(title, html) {
    if (!desk.open) opener = document.activeElement;
    $("#desk-heading").textContent = title;
    content.innerHTML = html;
    if (!desk.open) desk.showModal();
    desk.scrollTop = 0;
    $("#desk-heading").focus({ preventScroll: true });
  }
  function openCase(code) {
    const item = cases[code];
    showDesk(
      item.name,
      '<img class="dialog-photo" alt="" src="./assets/album/' +
        item.image +
        '.webp"><p class="work-label">' +
        item.work +
        "</p><p>" +
        item.info +
        "</p>" +
        (code === "27-B"
          ? '<a class="button rust" data-enter href="#intake">打开校样第一联</a>'
          : '<button class="button rust" data-dismiss>收好这份来件</button>'),
    );
  }
  $$("[data-case]").forEach((b) => b.addEventListener("click", () => openCase(b.dataset.case)));
  function showLookup() {
    showDesk(
      "查询修复工单",
      '<p>输入相纸袋上的编号。橱窗里这张家庭合影的编号是 <b>27-B</b>。</p><form class="lookup-form"><label for="ticket-code">工单编号</label><input id="ticket-code" name="code" value="27-B" required maxlength="12" autocomplete="off" spellcheck="false"><button class="button rust" type="submit">查找工单</button></form><div class="lookup-message" role="status"></div>',
    );
  }
  $$("[data-query]").forEach((b) => b.addEventListener("click", showLookup));
  content.addEventListener("submit", (event) => {
    if (!event.target.matches(".lookup-form")) return;
    event.preventDefault();
    const raw = $("#ticket-code").value.normalize("NFKC").toUpperCase().replace(/\s/g, "");
    const aliases = { "027-B": "27-B", "14-A": "014-A", "31-C": "031-C" };
    const code = hasKey(aliases, raw) ? aliases[raw] : raw;
    if (hasKey(cases, code)) openCase(code);
    else $(".lookup-message").textContent = "纸袋架上没有这个编号。可查 014-A、27-B 或 031-C。";
  });
  $$("[data-service]").forEach((b) =>
    b.addEventListener("click", () =>
      showDesk(
        "服务与修复流程",
        '<p>柜台接收纸基照片和已冲洗的底片。每一件先制工作副本，原件回到来件袋里。</p><ol class="service-list"><li><b>收件建档</b>记下相纸背面的字、尺寸和来件人的嘱托，原样扫描。</li><li><b>手工修复</b>在副本上处理折痕、霉斑和偏色。辨认不出的面部细节先留白。</li><li><b>校样取件</b>把修复稿与原片并排比较。经校样人确认后，照单冲印。</li></ol><a class="button rust" data-enter href="#cases">看已修复的样片</a>',
      ),
    ),
  );
  $("[data-about]").addEventListener("click", () =>
    showDesk(
      "关于拾相",
      '<p>《拾相修复所》是一部可交互的虚构影像档案。人物、照片、录音和工单均为本作创作。修复所的柜台只存在于这个故事里。</p><p>这一卷的观察和查到的痕迹保存在本标签页。磁带可独立播放，也可以只读逐字稿。重开底片后，所有签注会被清空。</p><button class="button rust" data-dismiss>收起说明</button>',
    ),
  );
  $("#dialog-close").addEventListener("click", () => desk.close());
  desk.addEventListener("click", (event) => {
    if (event.target === desk || event.target.closest("[data-dismiss], [data-enter]")) desk.close();
  });
  desk.addEventListener("close", () => {
    if (document.activeElement === document.body && opener?.isConnected)
      opener.focus({ preventScroll: true });
  });

  const flip = $(".flip");
  function flipPhoto(back) {
    $(".proof-front").hidden = back;
    $(".proof-back").hidden = !back;
    flip.setAttribute("aria-pressed", String(back));
    flip.querySelector("span").textContent = back ? "翻回校样正面" : "翻看照片背面";
  }
  flip.addEventListener("click", () => flipPhoto($(".proof-back").hidden));
  function drawObservation() {
    const quote = observationText[state.observation];
    $$("[data-observe]").forEach((b) => {
      b.disabled = Boolean(quote || state.ending);
      b.setAttribute("aria-pressed", String(state.observation === b.dataset.observe));
    });
    $("#observation-status").textContent = quote
      ? "第一联已封存。你写的是「" + quote + "」"
      : state.ending
        ? "已随底片归档。第一联保留空白。"
        : "也可以先不落笔，往下翻。";
    $("#first-quote").textContent = quote || "此栏未落笔";
  }
  $$("[data-observe]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.observation || state.ending) return;
      state.observation = b.dataset.observe;
      persist();
      drawObservation();
      drawCarbon();
      updateDark();
    }),
  );
  let lifted = state.evidence.includes("carbon");
  function drawCarbon() {
    $(".carbon-stack").classList.toggle("is-lifted", lifted);
    $("#lift-carbon").textContent = lifted ? "把复写纸放回去" : "揭开复写纸";
    $("#lift-carbon").setAttribute("aria-pressed", String(lifted));
    $("#second-quote").textContent = lifted ? "经本人确认，椅子从来就是空的。" : "隔着蜡纸，墨迹透不过来。";
    const readings = {
      empty: "你记的是一眼看见的东西。第二联把一个「是」改成了「从来就是」。那四个字落笔比其他字都深。",
      person: "第一联明明写着有人。第二联连墨水缺的一小截都复写对了，唯独把人擦掉了。",
      unsure: "你的「看不清楚」在这一联变成了「确认」。纸纤维没有被橡皮擦翻起过。",
      none: "上面没有人落笔，下面却已经有人以「本人」的名义确认了。",
    };
    $("#carbon-result").textContent = lifted
      ? readings[state.observation || "none"]
      : "复写纸的黑面朝上。墨本应落在另一面。";
  }
  $("#lift-carbon").addEventListener("click", () => {
    lifted = !lifted;
    if (lifted) record("carbon");
    drawCarbon();
  });

  // The development tray advances by distance through the room, with direct controls for each exposure.
  const darkroom = $("#darkroom");
  const stage = $(".dark-stage");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  darkroom.classList.add("enhanced");
  let currentPhase = -1;
  let queued = 0;
  const phases = [
    [
      "显影盘 · 白纸入液",
      "椅子在暗房里。",
      "红灯下面，那把椅子正对着放大机。右扶手的红线还湿着。托盘里的家人转头看向镜头，椅子却朝着洗照片的人。",
    ],
    ["停显盘 · 取出工作证", "有人替你坐过班。", ""],
    [
      "定影盘 · 乳剂见光",
      "纸后面有呼吸。",
      "你把相纸从晾衣绳上拨开。一张后面还有一张，耳朵就在纸缝里。你屏住气，它也停了。你还没吸下一口，它先替你吸了。",
    ],
  ];
  function drawPhase(index) {
    const [label, title, text] = phases[index];
    $("#dark-phase").textContent = label;
    $("#dark-title").textContent = title;
    $("#dark-text").textContent =
      index !== 1
        ? text
        : state.observation
          ? "椅背外侧挂着一张工牌。照片栏磨白了，签名栏却挤着一句话：「" +
            observationText[state.observation] +
            "」你刚写的字，已经被拇指磨得发亮。"
          : "椅背外侧挂着一张工牌。签字栏一个字也没有，空白处烫着一圈旧指印。你把工牌翻过来，背后是朝着椅子拍的柜台。";
    $$("[data-phase]").forEach((b) =>
      b.setAttribute("aria-pressed", String(Number(b.dataset.phase) === index)),
    );
    currentPhase = index;
  }
  function updateDark() {
    queued = 0;
    const rect = darkroom.getBoundingClientRect();
    $("#archive-index").hidden =
      $("#intake").getBoundingClientRect().top > innerHeight * 0.3 ||
      $("body>footer").getBoundingClientRect().top < innerHeight;
    const travel = Math.max(1, rect.height - stage.offsetHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const index = Math.min(2, Math.floor(progress * 3));
    const veil = reduced.matches ? Number(index === 2) : Math.max(0, Math.min(1, (progress - 0.48) / 0.33));
    stage.style.setProperty("--reverse", veil.toFixed(3));
    if (index !== currentPhase) drawPhase(index);
  }
  function scheduleDark() {
    if (!queued) queued = requestAnimationFrame(updateDark);
  }
  if ("IntersectionObserver" in window) {
    const glass = new IntersectionObserver(([entry]) =>
      $("#coda").classList.toggle("in-window", entry.isIntersecting),
    );
    glass.observe($("#coda"));
  }
  addEventListener("scroll", scheduleDark, { passive: true });
  addEventListener("resize", scheduleDark);
  reduced.addEventListener("change", scheduleDark);
  $$("[data-phase]").forEach((b) =>
    b.addEventListener("click", () => {
      const index = Number(b.dataset.phase);
      const top = scrollY + darkroom.getBoundingClientRect().top;
      const travel = darkroom.offsetHeight - stage.offsetHeight;
      scrollTo({ top: top + travel * [0.02, 0.5, 0.97][index], behavior: "instant" });
      drawPhase(index);
      scheduleDark();
    }),
  );
  function drawEvidence() {
    $$(".archive-index b").forEach((count) => {
      count.textContent = state.evidence.length + " / 4";
    });
    $$("[data-proof]").forEach((link) => {
      const found = state.evidence.includes(link.dataset.proof);
      link.classList.toggle("found", found);
      link.setAttribute("aria-label", link.textContent + (found ? "，已留存" : "，返回核对"));
    });
    const count = state.evidence.length;
    $("#both-hint").textContent =
      count >= 2
        ? "两种材料都留着，取件人留空。"
        : "已留存 " + count + " 处痕迹，还需 " + (2 - count) + " 处可复核原件。";
  }
  function openIndex() {
    const locations = [
      ["intake", "校样第一联", null],
      ["carbon", "复写联", "carbon"],
      ["negatives", "底片检验室", "negative"],
      ["tape", "来电留存", "splice"],
      ["letters", "退件柜", "letter"],
      ["recall", "复述校样", null],
      ["darkroom", "红灯暗房", null],
      ["delivery", "交件台", null],
    ];
    if (state.ending) locations.push(["aftermath", "取件回执", null]);
    const links = locations
      .map(([id, title, clue]) => {
        const status = clue ? (state.evidence.includes(clue) ? "已留存" : "可核对") : "27-B";
        return '<a data-enter href="#' + id + '"><small>' + status + "</small>" + title + "</a>";
      })
      .join("");
    showDesk(
      "本卷底片袋",
      '<p>装着本次校样的原话和已留存的痕迹。点一处夹页，回到那件材料。</p><nav class="index-list" aria-label="工单夹页">' +
        links +
        "</nav>",
    );
  }
  $("#archive-index").addEventListener("click", openIndex);
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      for (const id of ["intake", "carbon", "negatives", "tape", "letters", "recall"]) {
        const holder = document.createElement("div");
        holder.className = "archive-inline";
        const button = $("#archive-index").cloneNode(true);
        button.removeAttribute("id");
        button.hidden = false;
        button.addEventListener("click", openIndex);
        holder.append(button);
        document.getElementById(id).append(holder);
      }
    },
    { once: true },
  );
  const initialIntro = $("#hero-intro").innerHTML;
  const waitingCoda = [$("#coda-title").textContent, $("#coda-line").textContent];
  function drawEnding() {
    const ending = endings[state.ending];
    $("#aftermath").hidden = !ending;
    $("#coda-back").href = ending ? "#top" : "#delivery";
    $("#coda-back").textContent = ending ? "走回橱窗前" : "回到交件台";
    $$("[data-ending]").forEach((b) => {
      b.disabled = Boolean(ending);
      b.setAttribute("aria-pressed", String(b.dataset.ending === state.ending));
    });
    $("#hero-title span").textContent = ending?.headline[0] || "让旧照片，";
    $("#hero-title em").textContent = ending?.headline[1] || "重新显影。";
    if (ending) $("#hero-intro").textContent = ending.storefront;
    else $("#hero-intro").innerHTML = initialIntro;
    $("#sample-caption").textContent = ending?.sample || "南桥巷，院中合影";
    $("#hero-action").href = ending ? "#aftermath" : "#cases";
    $("#hero-action span").textContent = ending ? "查看本卷取件回执" : "浏览修复案例";
    $(".restored").src = "./assets/album/" + (state.ending === "restore" ? "occupied" : "front") + ".webp";
    $(".restored").alt =
      state.ending === "restore" ? "归档样片上多出一位坐在藤椅上的人" : "旧院里的双人合影，右边有一把空藤椅";
    if (!ending) {
      [$("#coda-title").textContent, $("#coda-line").textContent] = waitingCoda;
      return;
    }
    $("#return-photo").src = "./assets/album/" + ending.image + ".webp";
    $("#return-photo").alt = ending.sample;
    $("#end-title").textContent = ending.title;
    $("#end-text").textContent = ending.text;
    $("#end-last").textContent = ending.last;
    $("#return-stamp").textContent = ending.stamp;
    $("#return-caption").textContent = ending.caption;
    const afterClosing = {
      order: [
        "玻璃里还差一个。",
        "你走到街对面。两个人的倒影和空椅对得严丝合缝。等你侧过身让路，那块空出来的地方也跟着你动了一下。",
      ],
      restore: [
        "轮到谁按快门？",
        "门已经锁了。从玻璃外看，修片师傅坐在藤椅上。你抬手遮住眼睛，里面的那个人也抬起了手。",
      ],
      both: [
        "今晚，没有人签字。",
        "灯灭了。玻璃上只剩一截红线，轻轻往上绷紧，又松开了。有人沿着它，摸到了该坐的位置。",
      ],
    };
    [$("#coda-title").textContent, $("#coda-line").textContent] = afterClosing[state.ending];
    $("#decision-status").textContent = "本卷已归档。取件回执附在下面。";
  }
  $$("[data-ending]").forEach((b) =>
    b.addEventListener("click", () => {
      if (state.ending) return;
      const choice = b.dataset.ending;
      if (choice === "both" && state.evidence.length < 2) {
        $("#decision-status").textContent =
          "两格底片彼此矛盾。请从痕迹索引取回任意两处原件，再将它们一起封存。";
        $(".evidence-links a:not(.found)")?.focus({ preventScroll: true });
        return;
      }
      state.ending = choice;
      persist();
      drawObservation();
      drawEnding();
      $("#end-title").focus({ preventScroll: true });
      $("#aftermath").scrollIntoView({ block: "start" });
      window.dispatchEvent(new Event("studio-delivered"));
    }),
  );
  function resetRoll() {
    state = cleanState();
    persist();
    lifted = false;
    compare.value = 37;
    setCut();
    filterCases("all");
    flipPhoto(false);
    drawEnding();
    drawEvidence();
    drawObservation();
    drawCarbon();
    $("#decision-status").textContent = "";
    currentPhase = -1;
    window.dispatchEvent(new Event("studio-reset"));
    history.replaceState(null, "", location.pathname + location.search + "#top");
    scrollTo({ top: 0, behavior: "instant" });
    $(".brand").focus({ preventScroll: true });
    scheduleDark();
  }
  $$("[data-reset]").forEach((button) => button.addEventListener("click", resetRoll));
  drawObservation();
  drawCarbon();
  drawEvidence();
  drawEnding();
  updateDark();
})();
