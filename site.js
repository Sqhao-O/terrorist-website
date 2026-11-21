"use strict";

const gallery = [
  { src: "./assets/retreat.webp", caption: "山居晨雾" },
  { src: "./assets/room.webp", caption: "竹影客舍" },
  { src: "./assets/tea.webp", caption: "山窗茶席" }
];

const heroPhotos = document.querySelector(".hero-photos");
const slideElements = [heroPhotos.querySelector("img")];
let slideIndex = 0;
let slideRequest = 0;

async function showSlide(index) {
  slideIndex = (index + gallery.length) % gallery.length;
  const target = slideIndex;
  const request = ++slideRequest;
  const photo = gallery[target];
  if (!slideElements[target]) {
    const img = new Image();
    img.className = "hero-photo";
    img.alt = "";
    img.src = photo.src;
    slideElements[target] = img;
    heroPhotos.append(img);
  }
  try {
    await slideElements[target].decode();
  } catch {
    if (request === slideRequest) slideIndex = slideElements.findIndex(img => img?.classList.contains("is-current"));
    return;
  }
  if (request !== slideRequest) return;
  slideElements.forEach((img, position) => img.classList.toggle("is-current", position === target));
  document.querySelector(".photo-num").textContent = String(target + 1).padStart(2, "0");
  document.querySelector(".photo-name").textContent = photo.caption;
}
document.querySelectorAll("[data-slide]").forEach(button => {
  button.addEventListener("click", () => showSlide(slideIndex + Number(button.dataset.slide)));
});

const hamburger = document.querySelector(".hamburger");
const mobileNav = document.getElementById("mobile-nav");
function toggleMenu(open) {
  mobileNav.hidden = !open;
  hamburger.setAttribute("aria-expanded", String(open));
  hamburger.setAttribute("aria-label", open ? "收起导航" : "展开导航");
  hamburger.querySelector("use").setAttribute("href", open ? "#close" : "#menu");
}
hamburger.addEventListener("click", () => toggleMenu(mobileNav.hidden));
document.addEventListener("click", event => {
  if (!mobileNav.hidden && !event.target.closest(".hamburger")) toggleMenu(false);
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !mobileNav.hidden) {
    toggleMenu(false);
    hamburger.focus();
  }
});
window.matchMedia("(max-width: 650px)").addEventListener("change", () => toggleMenu(false));

const details = {
  room: {
    title: "枕山而居", label: "STAY", location: "东院 · 竹影客舍",
    story: "杉木房梁留着淡淡的木香。晨光从竹帘的缝里爬上床沿，推开移门，就能坐在廊下看山雾一点点退去。",
    action: "预约这间客房"
  },
  tea: {
    title: "山间茶事", label: "TASTE", location: "西窗 · 山泉茶席",
    story: "午后的第一壶水取自后山。茶师把温好的青瓷盏排在窗下，最后一盏总要留空。问起来，他只说是山里的老习惯。",
    action: "翻阅住客手记"
  },
  trail: {
    title: "循径入林", label: "WANDER", location: "后山 · 青石步道",
    story: "从客舍后门拾级而上，半程有一座歇脚的石亭。木牌背面刻着一行小字：若第二次经过这座亭子，就沿原路返回。",
    action: "翻阅住客手记"
  }
};
const detailDialog = document.getElementById("detail-dialog");
const detailAction = detailDialog.querySelector(".detail-action");
let selectedDetail;
document.querySelectorAll("[data-detail]").forEach(button => {
  button.addEventListener("click", () => {
    selectedDetail = button.dataset.detail;
    const detail = details[selectedDetail];
    const source = button.querySelector("img");
    const photo = detailDialog.querySelector(".detail-photo");
    photo.src = source.src;
    photo.alt = source.alt;
    detailDialog.querySelector("#detail-heading").textContent = detail.title;
    detailDialog.querySelector(".detail-kicker").textContent = detail.label;
    detailDialog.querySelector(".detail-story").textContent = detail.story;
    detailDialog.querySelector(".detail-info span").textContent = detail.location;
    detailAction.textContent = detail.action;
    if (selectedDetail === "room") detailAction.dataset.booking = "room";
    else delete detailAction.dataset.booking;
    detailDialog.showModal();
    detailDialog.scrollTop = 0;
  });
});
detailDialog.querySelector(".detail-close").addEventListener("click", () => detailDialog.close());
detailDialog.addEventListener("click", event => {
  if (event.target === detailDialog) detailDialog.close();
});
detailAction.addEventListener("click", () => {
  detailDialog.close();
  if (selectedDetail !== "room") window.location.hash = "journal";
});

const watch = document.getElementById("watch");
const threshold = document.getElementById("threshold");
const monitorTime = document.querySelector(".monitor-time");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let scrollFrame = 0;
const clamp = value => Math.min(1, Math.max(0, value));

function updateFilm() {
  scrollFrame = 0;
  const height = window.innerHeight;
  const corridor = watch.getBoundingClientRect();
  const door = threshold.getBoundingClientRect();
  const time = clamp((height - corridor.top) / (height + corridor.height));
  const seconds = Math.min(4, Math.floor(time * 6));
  monitorTime.textContent = "03:17:0" + seconds;
  if (reducedMotion.matches) {
    threshold.style.removeProperty("--approach");
    return;
  }
  const approach = clamp((height - door.top) / door.height);
  threshold.style.setProperty("--approach", approach.toFixed(3));
}
function scheduleFilm() {
  if (!scrollFrame) scrollFrame = requestAnimationFrame(updateFilm);
}
window.addEventListener("scroll", scheduleFilm, { passive: true });
window.addEventListener("resize", scheduleFilm);
reducedMotion.addEventListener("change", scheduleFilm);
document.querySelector(".return").addEventListener("click", () => showSlide(0));
updateFilm();
