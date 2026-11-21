(() => {
  const inspector = document.querySelector("#negatives");
  if (!inspector) return;

  const frames = [
    {
      number: 26,
      file: "front",
      alt: "第 26 格，两位成人在院子里，右边的藤椅空着。右上窗格有一道细小的半月形划伤。",
      note: "「椅子留着，等她回来一起照。」",
      detail: "右侧藤椅空着。窗格上有一道细白弧线，铅笔在底片袋上圈出了它的位置。",
    },
    {
      number: 27,
      file: "occupied",
      alt: "第 27 格翻拍了一张纸质合影。同一处院子里有三位成人，灰开衫的人坐在藤椅上，脸的位置是一片露出纸纹的白斑。",
      note: "「好了，都在。现在可以松手了。」",
      detail:
        "灰开衫的扣眼还在，脸上却露出了相纸纤维。这格底片翻拍过一张纸质照片。在有人把它重新拍下来之前，那张脸就已经被擦掉了。",
    },
    {
      number: 28,
      file: "front",
      alt: "第 28 格，两位成人和一把空藤椅，右上窗格也有一道半月形划伤。",
      note: "「椅子留着，等她回来一起照。」",
      detail: "这句铅笔字连顿笔的位置都和第 26 格一样。相馆把这一张装在了写着「第二次补拍」的袋里。",
    },
  ];
  const source = (frame) => "./assets/album/" + frame.file + ".webp";

  inspector.innerHTML = `
    <div class="frame neg-frame">
      <header class="neg-head">
        <div><p class="section-kicker">底片检验室 <span lang="en">/ CONTACT SHEET</span></p><h2 id="negative-title">夹在中间的那一格。</h2></div>
        <p class="neg-intro">纸袋里夹着三格底片。取件单上打过两个勾，一个给了头一格，一个给了末一格。</p>
      </header>
      <div class="neg-bench">
        <figure class="neg-monitor">
          <figcaption><span class="neg-power"></span>透看片台<span class="neg-monitor-readout" lang="en"></span></figcaption>
          <div class="neg-window">
            <div class="neg-base"><img class="neg-photo" loading="lazy" width="1448" height="1086" src="./assets/album/front.webp" alt=""><i class="neg-scratch" aria-hidden="true"></i></div>
            <div class="neg-overlay" hidden aria-hidden="true"><img class="neg-photo" loading="lazy" width="1448" height="1086" src="./assets/album/front.webp" alt=""><i class="neg-scratch"></i></div>
            <div class="neg-mark" aria-hidden="true" hidden></div>
          </div>
          <div class="neg-monitor-foot"><span>35 mm</span><span class="neg-projection-label"></span></div>
        </figure>
        <div class="neg-console">
          <h3 class="neg-label">底片袋里的铅笔字</h3>
          <blockquote class="neg-pencil"></blockquote>
          <div class="neg-roll" role="group" aria-label="选择底片">${frames
            .map(
              (frame) => `
            <button type="button" class="neg-thumb" data-neg-frame="${frame.number}" aria-label="查看第 ${frame.number} 格">
              <span class="neg-thumb-photo"><img loading="lazy" src="${source(frame)}" width="1448" height="1086" alt=""></span>
              <span class="neg-thumb-number">${frame.number}</span>
            </button>`,
            )
            .join("")}</div>
          <p class="neg-detail" aria-live="polite"></p>
          <button type="button" class="neg-compare" aria-controls="neg-alignment" aria-expanded="false"><i aria-hidden="true"></i><span>叠看 26 / 28</span></button>
          <div id="neg-alignment" hidden>
            <label class="neg-offset-label" for="neg-offset">第 28 格 · 横向偏移 <output for="neg-offset"></output></label>
            <input type="range" id="neg-offset" min="-5" max="5" value="4" step="1">
            <button type="button" class="neg-snap">对准齿孔</button>
          </div>
          <p class="neg-finding" role="status" hidden></p>
        </div>
      </div>
    </div>`;

  const get = (selector) => inspector.querySelector(selector);
  const previews = [...inspector.querySelectorAll(".neg-thumb")];
  const base = get(".neg-base img");
  const scratch = get(".neg-base .neg-scratch");
  const overlay = get(".neg-overlay");
  const marker = get(".neg-mark");
  const compareButton = get(".neg-compare");
  const offset = get("#neg-offset");
  const finding = get(".neg-finding");
  let selected = 0;
  let comparing = false;
  let confirmed = ShiftRun.evidence.includes("negative");
  const findingText = "两格的白痕合成了同一个缺口。两张「空椅」都翻自同一张底片。那中间的一格，为什么没交给取件人？";
  if (confirmed) {
    finding.hidden = false;
    finding.textContent = findingText;
  }

  function setOffset(value) {
    offset.value = String(value);
    const signed = value > 0 ? "+" + value : String(value);
    get(".neg-offset-label output").textContent = signed;
    offset.setAttribute("aria-valuetext", value === 0 ? "齿孔重合" : signed + " 格");
    overlay.style.transform = "translateX(" + value * 1.5 + "%)";
    get(".neg-projection-label").textContent = value === 0 ? "齿孔已重合" : "双影 · 齿孔未齐";
    if (value === 0 && !confirmed) {
      confirmed = true;
      finding.hidden = false;
      finding.textContent = findingText;
      window.dispatchEvent(new CustomEvent("studio-evidence", { detail: "negative" }));
    }
  }

  function display() {
    const frame = frames[selected];
    const baseFrame = comparing ? frames[0] : frame;
    base.src = source(baseFrame);
    base.alt = comparing ? "26 与 28 格透叠，右上窗框内可核对同一道半月形痕迹。" : frame.alt;
    scratch.hidden = baseFrame.number === 27;
    overlay.hidden = !comparing;
    marker.hidden = !comparing;
    get("#neg-alignment").hidden = !comparing;
    compareButton.setAttribute("aria-expanded", String(comparing));
    compareButton.querySelector("span").textContent = comparing ? "收起叠片夹" : "叠看 26 / 28";
    get(".neg-monitor-readout").textContent = comparing ? "26 + 28" : "FRAME / " + frame.number;
    get(".neg-pencil").textContent = comparing ? "「一卷拍了两张，总不至于都记错。」" : frame.note;
    get(".neg-detail").textContent = comparing
      ? "把第 28 格移到第 26 格正上方。留意右上窗框，那里有一道指甲月牙似的白痕。"
      : frame.detail;
    get(".neg-projection-label").textContent = "正像透看";
    previews.forEach((button, index) =>
      button.setAttribute("aria-pressed", String(!comparing && index === selected)),
    );
    if (comparing) setOffset(confirmed ? 0 : 4);
  }

  previews.forEach((button, index) =>
    button.addEventListener("click", () => {
      selected = index;
      comparing = false;
      display();
    }),
  );
  compareButton.addEventListener("click", () => {
    comparing = !comparing;
    display();
  });
  offset.addEventListener("input", () => setOffset(Number(offset.value)));
  get(".neg-snap").addEventListener("click", () => setOffset(0));
  window.addEventListener("studio-reset", () => {
    selected = 0;
    comparing = false;
    confirmed = false;
    finding.hidden = true;
    finding.textContent = "";
    display();
  });
  display();
})();
