(() => {
  "use strict";

  const section = document.getElementById("letters");
  if (!section) return;

  const letters = [
    {
      date: "1998.12.07",
      title: "母亲的托付",
      stock: "stationery",
      address: "南桥照相馆　修片师傅收",
      source: "从原底袋夹层中取出，信边粘着干米粒。",
      salutation: "师傅，",
      lines: [
        "那天您喊看镜头，阿禾偏把头扭向我。歪就歪了，别给扶正。藤椅扶手上那一小截红线也给留着，那是我打的结。",
        "阿禾这两年眼睛看不清，顺着藤皮摸到那个结才知道坐稳了。说好的两张，第二张先缓缓。头一张拿回来，我们三个传着看。周四收摊早，我把上回借您盛馄饨的搪瓷碗也带来。",
      ],
      signature: "阿禾妈",
      mark: "南桥所",
    },
    {
      date: "2004.06.11",
      title: "父亲给妹妹的便条",
      stock: "memo",
      address: "春梅亲启　交东巷修鞋铺转",
      source: "夹在第二次加洗的纸袋里，背面印着半张进货单。",
      salutation: "小梅，",
      lines: [
        "你嫂子昨天把椅背刷了，说扶手上尽是断线头。我上街本来是买盐，回来兜里又多了一绺红线。坐下就会打那个结，问给谁系的，怎么也想不起来。",
        "你寄回的照片我看了。你嫂子的左手悬在膝盖旁边，手指还弯着。她自己端详半天，说她那天一定是忘了把碗放下。你那儿最早洗的那张还在吗？",
      ],
      signature: "哥",
      mark: "东巷递",
    },
    {
      date: "2016.09.03",
      title: "无人具名的退件",
      stock: "return",
      address: "请转保管原底的人",
      source: "退回柜中的最后一件。回邮栏的纸毛被刮起过。",
      salutation: "收件的人，",
      lines: [
        "这张纸薄，我从背面写，你看见的字才能是正的。每加洗一次，我能坐的地方就窄一点。上一次过水，妈的手指从我的手里穿过去了。",
        "我还听得见她。现在有人问红线是谁系的，她就用柜台里那个人的腔调说：「已按原样交付。」底片请留下。取件人一栏也请空着。要是他们问我的名字，劳驾，说没核对过。",
      ],
      signature: "",
      mark: "积压件",
    },
  ];

  section.innerHTML = `
    <div class="frame letters-frame">
      <div class="letters-intro">
        <div class="letters-heading-copy">
          <p class="letters-tag">退件保管室 <span lang="en">/ CORRESPONDENCE</span></p>
          <h2 id="letters-title">退件柜里的信</h2>
        </div>
        <p class="letters-lead">装底片的牛皮纸袋裂过一次。有人把封口重新缝好，顺手把十八年间的三封信都留在里面。</p>
      </div>
      <div class="letters-drawer">
        <div class="letters-index">
          <div class="letters-drawer-label"><span>来往函件</span><span>27-B</span></div>
          <div class="letters-tabs" role="tablist" aria-label="选择信件"></div>
          <div class="letters-provenance"><span>归档附注</span><p></p></div>
        </div>
        <div class="letters-document-well" id="letter-document" role="tabpanel" tabindex="0"></div>
      </div>
      <div class="letters-lamp" hidden>
        <div class="letters-lamp-copy">
          <div class="letters-lamp-head"><span></span> 退件附件 · 纸背检视</div>
          <h3>刮掉的回邮栏</h3>
          <p>墨迹刮干净了，钢笔的力道还在。把信封放在透光台上，可以看见纸背的凹痕。</p>
          <button type="button" class="letters-lamp-switch" aria-pressed="false" aria-controls="letters-imprint">点亮透光台</button>
        </div>
        <div class="letters-lightbox">
          <div class="letters-return-slip"><span class="letters-return-label">寄件人姓名</span><div class="letters-scrape"><span id="letters-imprint" hidden>阿禾</span></div><span class="letters-lamp-foot">原件背面 / 27-B</span></div>
        </div>
      </div>
      <p class="letters-sr" role="status" aria-live="polite" aria-atomic="true"></p>
    </div>`;

  const tablist = section.querySelector(".letters-tabs");
  const panel = section.querySelector("#letter-document");
  const provenance = section.querySelector(".letters-provenance p");
  const lamp = section.querySelector(".letters-lamp");
  const lampSwitch = section.querySelector(".letters-lamp-switch");
  const imprint = section.querySelector("#letters-imprint");
  const status = section.querySelector(".letters-sr");
  let lightOn = false;
  let evidenceSent = false;

  const tabs = letters.map((letter, index) => {
    const tab = document.createElement("button");
    tab.type = "button";
    tab.id = "letter-tab-" + index;
    tab.className = "letters-tab";
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    tab.innerHTML = `<time datetime="${letter.date.replaceAll(".", "-")}">${letter.date}</time><span>${letter.title}</span>`;
    tab.addEventListener("click", () => openLetter(index));
    tablist.append(tab);
    return tab;
  });

  function setLight(on) {
    lightOn = on;
    lamp.classList.toggle("is-lit", on);
    imprint.hidden = !on;
    lampSwitch.setAttribute("aria-pressed", String(on));
    lampSwitch.textContent = on ? "关掉透光台" : "点亮透光台";
  }

  function openLetter(index) {
    const letter = letters[index];
    tabs.forEach((tab, position) => {
      tab.tabIndex = position === index ? 0 : -1;
      tab.setAttribute("aria-selected", String(position === index));
    });
    panel.setAttribute("aria-labelledby", tabs[index].id);
    provenance.textContent = letter.source;
    panel.innerHTML = `
      <article class="letters-paper letters-paper--${letter.stock}">
        <div class="letters-paper-top"><span class="letters-address">${letter.address}</span><span aria-hidden="true" class="letters-stamp">${letter.mark}<small>${letter.date.slice(0, 4)}</small></span></div>
        <p class="letters-salutation">${letter.salutation}</p>
        <div class="letters-body">${letter.lines.map((line) => "<p>" + line + "</p>").join("")}</div>
        <footer>${letter.signature ? "<span>" + letter.signature + "</span>" : ""}<time datetime="${letter.date.replaceAll(".", "-")}">${letter.date}</time></footer>
      </article>`;
    lamp.hidden = index !== letters.length - 1;
    setLight(false);
    status.textContent = "";
  }

  tablist.addEventListener("keydown", (event) => {
    const index = tabs.indexOf(event.target);
    if (index < 0) return;
    const forward = ["ArrowRight", "ArrowDown"].includes(event.key);
    const backward = ["ArrowLeft", "ArrowUp"].includes(event.key);
    let target;
    if (forward || backward) target = (index + (forward ? 1 : -1) + tabs.length) % tabs.length;
    else if (event.key === "Home") target = 0;
    else if (event.key === "End") target = tabs.length - 1;
    else return;
    event.preventDefault();
    openLetter(target);
    tabs[target].focus();
  });

  lampSwitch.addEventListener("click", () => {
    setLight(!lightOn);
    status.textContent = lightOn ? "透光检查：回邮栏被刮去的名字是阿禾。" : "透光台已关闭。";
    if (lightOn && !evidenceSent) {
      evidenceSent = true;
      window.dispatchEvent(new CustomEvent("studio-evidence", { detail: "letter" }));
    }
  });
  window.addEventListener("studio-reset", () => {
    evidenceSent = false;
    openLetter(0);
  });
  openLetter(0);
})();
