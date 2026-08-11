const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("[data-nav-links]");

menuToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    navLinks.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }
});

const lightbox = document.querySelector("[data-lightbox]");
const lightboxImage = document.querySelector("[data-lightbox-image]");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const lightboxDownload = document.querySelector("[data-lightbox-download]");
const galleryPhotos = document.querySelectorAll(".gallery-photo");
const matchPhotos = document.querySelectorAll(".match-photo-link");
const galleryItems = [];
const matchItems = [];
let activeLightboxItems = galleryItems;
let currentGalleryIndex = 0;
let touchStartX = 0;

galleryPhotos.forEach((photo) => {
  const index = Number(photo.dataset.galleryIndex);
  const image = photo.querySelector("img");

  if (!galleryItems[index]) {
    galleryItems[index] = {
      src: photo.href,
      alt: image.alt
    };
  }
});

function showGalleryImage(index) {
  currentGalleryIndex = (index + activeLightboxItems.length) % activeLightboxItems.length;
  const item = activeLightboxItems[currentGalleryIndex];

  lightboxImage.src = item.src;
  lightboxImage.alt = item.alt;
  lightboxDownload.href = item.src;
  lightboxDownload.setAttribute("download", item.src.split("/").pop());
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightboxImage.removeAttribute("src");
  lightboxImage.removeAttribute("alt");
  lightboxDownload.removeAttribute("href");
}

galleryPhotos.forEach((photo) => {
  photo.addEventListener("click", (event) => {
    event.preventDefault();

    activeLightboxItems = galleryItems;
    showGalleryImage(Number(photo.dataset.galleryIndex));
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

matchPhotos.forEach((photo) => {
  const image = photo.querySelector("img");

  matchItems.push({
    src: photo.href,
    alt: image.alt
  });

  photo.addEventListener("click", (event) => {
    event.preventDefault();
    activeLightboxItems = matchItems;
    showGalleryImage(matchItems.findIndex((item) => item.src === photo.href));
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  });
});

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

lightboxClose.addEventListener("click", closeLightbox);
lightboxPrev.addEventListener("click", () => showGalleryImage(currentGalleryIndex - 1));
lightboxNext.addEventListener("click", () => showGalleryImage(currentGalleryIndex + 1));

lightbox.addEventListener("touchstart", (event) => {
  touchStartX = event.changedTouches[0].clientX;
});

lightbox.addEventListener("touchend", (event) => {
  const touchEndX = event.changedTouches[0].clientX;
  const distance = touchEndX - touchStartX;

  if (Math.abs(distance) < 40) {
    return;
  }

  showGalleryImage(currentGalleryIndex + (distance < 0 ? 1 : -1));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
    closeLightbox();
  }

  if (event.key === "ArrowLeft" && lightbox.classList.contains("is-open")) {
    showGalleryImage(currentGalleryIndex - 1);
  }

  if (event.key === "ArrowRight" && lightbox.classList.contains("is-open")) {
    showGalleryImage(currentGalleryIndex + 1);
  }
});
