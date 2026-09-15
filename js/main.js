// スクロールで要素をふわっと出す（画面下 8% を超えたら発火）
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ロゴを押したら一番上へ戻る
document.querySelector(".topbar-title").addEventListener("click", (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===== マストヘッドのタイプライター表示 =====
const typedWords = ["Traveller", "Programmer", "Collector"];
const typedEl = document.getElementById("typed");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

if (typedEl) {
  if (reduceMotion) {
    typedEl.textContent = typedWords[0];
  } else {
    let wordIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tick() {
      const word = typedWords[wordIndex];
      typedEl.textContent = word.slice(0, charIndex);

      if (!deleting) {
        if (charIndex < word.length) {
          charIndex++;
          setTimeout(tick, 90);
        } else {
          deleting = true;
          setTimeout(tick, 1500);
        }
      } else {
        if (charIndex > 0) {
          charIndex--;
          setTimeout(tick, 40);
        } else {
          deleting = false;
          wordIndex = (wordIndex + 1) % typedWords.length;
          setTimeout(tick, 350);
        }
      }
    }

    tick();
  }
}

// ===== タブのタイトルをタイプライター表示（MiyakoNet をループ） =====
const pageTitle = "MiyakoNet | ポートフォリオ・実績一覧"; // SEO・動作無効環境用
const loopTitle = "Miyako.Net";

if (reduceMotion) {
  document.title = pageTitle;
} else {
  // 空タイトルを避けるため 1 文字目から開始し、ループでも 1 文字は残す
  let titleIndex = 1;
  document.title = loopTitle.slice(0, titleIndex);

  function typeLoop() {
    if (titleIndex < loopTitle.length) {
      titleIndex++;
      document.title = loopTitle.slice(0, titleIndex);
      setTimeout(typeLoop, 180);
    } else {
      setTimeout(eraseLoop, 2000);
    }
  }

  function eraseLoop() {
    if (titleIndex > 1) {
      titleIndex--;
      document.title = loopTitle.slice(0, titleIndex);
      setTimeout(eraseLoop, 90);
    } else {
      setTimeout(typeLoop, 600);
    }
  }

  typeLoop();
}

// ===== タイトルを一文字ずつ浮かせる =====
const titleEl = document.querySelector(".masthead h1");
if (titleEl && !reduceMotion) {
  const chars = Array.from(titleEl.textContent);
  titleEl.textContent = "";
  chars.forEach((ch, i) => {
    const span = document.createElement("span");
    span.textContent = ch;
    span.style.animationDelay = (0.2 + i * 0.07) + "s";
    titleEl.appendChild(span);
  });
}

// 今見ているセクションに合わせてナビを光らせる
// （画面の上から 40% のラインを超えている一番下のセクション = 表示中）
const sections = document.querySelectorAll("main section[id]");
const navLinks = document.querySelectorAll(".topbar-nav a");

function setActive(id) {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === "#" + id);
  });
}

function updateActive() {
  const line = window.scrollY + window.innerHeight * 0.4;
  let current = sections[0] ? sections[0].id : null;

  sections.forEach((s) => {
    if (s.offsetTop <= line) {
      current = s.id;
    }
  });

  // ページの一番下では Contact
  const atBottom =
    Math.ceil(window.scrollY + window.innerHeight) >=
    document.documentElement.scrollHeight - 2;
  if (atBottom) {
    current = "contact";
  }

  if (current) {
    setActive(current);
  }
}

window.addEventListener("scroll", updateActive, { passive: true });
window.addEventListener("resize", updateActive);
updateActive();

// ===== 環境変数から生成された config.js でリンクを差し替え =====
const cfg = window.SITE_CONFIG || {};
document.querySelectorAll("[data-cfg]").forEach((el) => {
  const value = cfg[el.dataset.cfg];
  if (!value) return;
  if (el.dataset.cfgPrefix === "mailto") {
    el.href = "mailto:" + value;
  } else {
    el.href = value;
  }
});

// ===== スクリーンショットのライトボックス =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightbox-img");
const lightboxCount = document.getElementById("lightbox-count");
const shots = Array.from(document.querySelectorAll(".p-gallery img"));

let lbIndex = 0;

function showShot() {
  lightboxImg.src = shots[lbIndex].src;
  lightboxImg.alt = shots[lbIndex].alt;
  lightboxCount.textContent = (lbIndex + 1) + " / " + shots.length;
}

function openLightbox(index) {
  lbIndex = index;
  showShot();
  lightbox.classList.add("open");
  lightbox.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.classList.remove("open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

shots.forEach((img, i) => {
  img.addEventListener("click", (e) => {
    // パネル自体のリンク（サイトへ移動）を止めてライトボックスを開く
    e.preventDefault();
    e.stopPropagation();
    openLightbox(i);
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector("[data-lb-prev]").addEventListener("click", () => {
  lbIndex = (lbIndex - 1 + shots.length) % shots.length;
  showShot();
});
lightbox.querySelector("[data-lb-next]").addEventListener("click", () => {
  lbIndex = (lbIndex + 1) % shots.length;
  showShot();
});

// 背景をクリックしたら閉じる
lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox) {
    closeLightbox();
  }
});

// Esc / 矢印キーでも操作
window.addEventListener("keydown", (e) => {
  if (!lightbox.classList.contains("open")) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") {
    lbIndex = (lbIndex - 1 + shots.length) % shots.length;
    showShot();
  }
  if (e.key === "ArrowRight") {
    lbIndex = (lbIndex + 1) % shots.length;
    showShot();
  }
});
