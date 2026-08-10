const nav = document.querySelector(".site-nav");
const waitlistForm = document.querySelector(".waitlist-form");
const formNote = document.querySelector(".form-note");

if (nav) {
  window.addEventListener("scroll", () => {
    nav.classList.toggle("scrolled", window.scrollY > 50);
  });
}

if (waitlistForm && formNote) {
  waitlistForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const email = new FormData(waitlistForm).get("email");

    formNote.textContent = email
      ? "Thanks - we have noted your interest in launching or discovering a SupperTable kitchen brand."
      : "Add your email to join the pilot list.";
  });
}
