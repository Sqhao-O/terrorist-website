(() => {
  "use strict";
  const section = document.getElementById("recall");
  if (!section) return;

  const key = "shixiang-recall-27b-v1";
  const phrases = Object.freeze({
    empty: "椅子是空的。",
    person: "椅子上坐着一个人。",
    unsure: "我看不清楚。",
    planted: "椅子从来就是空的。",
    blank: "我没有落笔。",
  });
  const originals = new Set(["empty", "person", "unsure"]);
  const matchedReadings = {
    empty: "你只写了那一刻的椅面。印在下面的那一句，却要你替以往每一天的椅面也作证。",
    person: "两次落笔，椅子上都有人。你写完以后才看见，机器预留的签字处恰好压在「空的」下面。",
    unsure: "你两次都把看不清写得很清楚。留给这几个字的位置倒是很宽，底下的结论却已经排好版了。",
  };
  let chosen = null;
  let initialAtCheck = null;
  try {
    const saved = sessionStorage.getItem(key);
    if (saved && Object.hasOwn(phrases, saved)) {
      chosen = saved;
    } else if (saved) {
      const previous = JSON.parse(saved);
      if (previous && Object.hasOwn(phrases, previous.pick)) {
        chosen = previous.pick;
        initialAtCheck = previous.original;
      }
    }
  } catch {
    /* A private tab can still compare the two cards in memory. */
  }

  section.innerHTML = `
    <div class="frame recall-frame">
      <div class="recall-intro"><p class="recall-kicker">口述复核 <span lang="en">/ WITNESS COPY</span></p>
        <h2 id="recall-title">第二次落笔</h2>
        <p>柜台换了班。夜班的人把原单反扣在桌上，请你再抄一遍刚才写过的话。笔还是刚才那支。</p>
      </div>
      <div class="recall-pad">
        <header class="recall-strip"><span>南桥照相馆 · 口述复核卡</span><b>27-B</b></header>
        <div class="recall-question">
          <h3 id="recall-question">不翻第一联，你还记得自己落了哪一句吗？</h3>
          <div class="recall-options" role="group" aria-labelledby="recall-question"></div>
          <p class="recall-note">可以留着这张卡，直接进暗房。</p>
        </div>
        <div class="recall-result" hidden>
          <h3 class="recall-verdict" tabindex="-1"></h3>
          <div class="recall-cards">
            <div class="recall-card recall-original"><span>第一联 · 原始落笔</span><p></p></div>
            <div class="recall-card recall-copy"><span>复核卡 · 本次记得</span><p></p></div>
          </div>
          <div class="recall-imprint"><span>相馆预印栏</span><p>经本人确认，椅子<mark>从来就是</mark>空的。</p></div>
          <p class="recall-reading"></p>
          <a class="recall-return" href="#intake">回看第一联原件</a>
        </div>
      </div>
    </div>`;
  const find = (selector) => section.querySelector(selector);
  const options = find(".recall-options");
  const verdict = find(".recall-verdict");

  function originalNow() {
    const value = document.querySelector('[data-observe][aria-pressed="true"]')?.dataset.observe;
    return originals.has(value) ? value : "blank";
  }
  function interpretation(original) {
    if (initialAtCheck === "blank" && original !== "blank") {
      return [
        "第一联后来补了字。",
        "你填复核卡时，第一联还是空的。第一栏现在显示的是你回去以后补写的原话，第二栏仍留着这次的回答。下面印好的那行字，两次都没有动。",
      ];
    }
    if (chosen === "planted") {
      return [
        "这四个字，有出处。",
        "「从来就是」四个字，复写联上有，磁带背面也有人念过。现在它们又一次出现在你的笔尖底下。这是相馆的话。原单还在，朝下扣着。",
      ];
    }
    if (original === "blank") {
      return chosen === "blank"
        ? [
            "第一联确实是空白的。",
            "你记得自己没有落笔。透过这张空白，你仍能读清下面那句「经本人确认」。墨已经干透了。",
          ]
        : [
            "先前那一栏没有笔迹。",
            "复核卡上的这一句，第一次落在纸上就是现在。把第一联举到灯前，纸面很平，连圆珠笔的压痕都没有。",
          ];
    }
    if (chosen === original) return ["两处笔迹，一字不差。", matchedReadings[original]];
    if (chosen === "blank") {
      return [
        "原件上留着一句话。",
        "你记得自己没有落笔。夜班的人把纸向灯一斜，第一联上的笔道还凹着。他没有问你要留下哪一联，只把两张纸一齐按在印章下面。",
      ];
    }
    return [
      "两张卡没有抄成同一句。",
      "两句话都在这里，可以逐字对。收件人却已经把卡角对齐，把签字线也对齐了。盖过章，柜外的人只看得见最上面那张。",
    ];
  }
  function render() {
    find(".recall-question").hidden = Boolean(chosen);
    find(".recall-result").hidden = !chosen;
    if (!chosen) return;
    const original = originalNow();
    const reading = interpretation(original);
    verdict.textContent = reading[0];
    const originalCard = find(".recall-original");
    originalCard.classList.toggle("is-blank", original === "blank");
    originalCard.querySelector("p").textContent = original === "blank" ? "此栏未落笔" : phrases[original];
    find(".recall-copy p").textContent = phrases[chosen];
    find(".recall-reading").textContent = reading[1];
  }
  Object.entries(phrases).forEach(([id, phrase]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = phrase;
    button.addEventListener("click", () => {
      if (chosen) return;
      initialAtCheck = originalNow();
      chosen = id;
      try {
        sessionStorage.setItem(key, JSON.stringify({ pick: chosen, original: initialAtCheck }));
      } catch {
        /* Current-page replay remains available. */
      }
      render();
      verdict.focus({ preventScroll: true });
    });
    options.append(button);
  });
  // The original can be filled later if the visitor first left it unsigned.
  const observer = new MutationObserver(() => {
    if (chosen) render();
  });
  document
    .querySelectorAll("[data-observe]")
    .forEach((button) => observer.observe(button, { attributes: true, attributeFilter: ["aria-pressed"] }));
  window.addEventListener("studio-reset", () => {
    chosen = null;
    initialAtCheck = null;
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* No persistent storage in this tab. */
    }
    render();
  });
  render();
})();
