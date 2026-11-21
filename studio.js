"use strict";
(() => {
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const hasKey = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
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
    compare.setAttribute(
      "aria-valuetext",
      "原片占 " + (ShiftRun.night ? 100 - Number(compare.value) : compare.value) + "%",
    );
  }
  compare.addEventListener("input", () => {
    setCut();
    if (+compare.value === 0 && !ShiftRun.night) ShiftRun.markLeft();
  });
  setCut();
  window.addEventListener("shift-night", setCut);
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
    const links = ShiftRun.night
      ? { "014-A": "post", "27-B": "family", "031-C": "apprentice" }
      : { "014-A": "today", "27-B": "intake", "031-C": "day-tape" };
    showDesk(
      item.name,
      '<img class="dialog-photo" alt="" src="./assets/album/' +
        item.image +
        '.webp"><p class="work-label">' +
        item.work +
        "</p><p>" +
        item.info +
        '</p><a class="button rust" data-enter href="#' +
        links[code] +
        '">' +
        (ShiftRun.night ? "到夜班复核" : "打开白班工作台") +
        "</a>",
    );
  }
  $$("[data-case]").forEach((b) => b.addEventListener("click", () => openCase(b.dataset.case)));
  function showLookup() {
    showDesk(
      "查询修复工单",
      '<p>输入相纸袋上的编号。橱窗里这张家庭合影的编号是 <b>27-B</b>。</p><form class="lookup-form"><label for="ticket-code">工单编号</label><input id="ticket-code" name="code" value="27-B" required maxlength="12" autocomplete="off" spellcheck="false"><button class="button rust" type="submit">查找工单</button></form><div class="lookup-message" role="status"></div>',
    );
  }
  $$("[data-query]").forEach((b) =>
    b.addEventListener("click", () => (ShiftRun.recast ? ShiftRun.doRole("liang") : showLookup())),
  );
  content.addEventListener("submit", (event) => {
    if (!event.target.matches(".lookup-form")) return;
    event.preventDefault();
    const raw = $("#ticket-code").value.normalize("NFKC").toUpperCase().replace(/\s/g, "");
    const aliases = { "027-B": "27-B", "14-A": "014-A", "31-C": "031-C" };
    const code = hasKey(aliases, raw) ? aliases[raw] : raw;
    if (ShiftRun.invaded && ["004", "第四项", "棠"].includes(raw)) ShiftRun.fourth();
    else if (hasKey(cases, code)) openCase(code);
    else $(".lookup-message").textContent = "纸袋架上没有这个编号。可查 014-A、27-B 或 031-C。";
  });
  $$("[data-service]").forEach((b) =>
    b.addEventListener("click", () =>
      ShiftRun.recast && b.closest(".hero-actions")
        ? ShiftRun.doRole("mother")
        : showDesk(
            "服务与修复流程",
            '<p>柜台接收纸基照片和已冲洗的底片。每一件先制工作副本，原件回到来件袋里。</p><ol class="service-list"><li><b>收件建档</b>记下相纸背面的字、尺寸和来件人的嘱托，原样扫描。</li><li><b>手工修复</b>在副本上处理折痕、霉斑和偏色。辨认不出的面部细节先留白。</li><li><b>校样取件</b>把修复稿与原片并排比较。经校样人确认后，照单冲印。</li></ol><a class="button rust" data-enter href="#cases">看已修复的样片</a>',
          ),
    ),
  );
  $("[data-about]").addEventListener("click", () =>
    showDesk(
      "关于拾相",
      '<p>《拾相修复所：请本人签收》是一部两轮营业的虚构影像作品。人物、照片、录音和工单均为本作创作。修复所的柜台只存在于这个故事里。</p><p>这一卷的观察和查到的痕迹保存在本标签页。磁带可独立播放，也可以只读逐字稿。重开底片后，所有签注会被清空。</p><button class="button rust" data-dismiss>收起说明</button>',
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

  window.StudioDesk = { show: showDesk, close: () => desk.close() };
})();
