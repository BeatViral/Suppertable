const paths = {
  guest: {
    kicker: "Guest app",
    title: "Find a table that feels personal, verified, and delicious.",
    steps: [
      "Browse verified listings by cuisine, date, price, dietary needs, and suburb.",
      "Open a meal page with photos, host story, set menu, allergens, seats, and house rules.",
      "Book prepaid seats, complete guest verification, and receive the exact address after confirmation.",
      "Arrive for a small on-premise meal, then review the host and dining experience.",
    ],
  },
  host: {
    kicker: "Host studio",
    title: "Turn a home kitchen into a controlled income stream.",
    steps: [
      "Create a host profile with identity, location, cooking background, and table capacity.",
      "Complete guided safety modules, kitchen photos, allergen prompts, and household boundaries.",
      "Submit fixed menus, dates, prices, seats, and local compliance checklist confirmations.",
      "Go live only after review, then manage bookings, payouts, reviews, and incidents.",
    ],
  },
  admin: {
    kicker: "Compliance cockpit",
    title: "Give operators, councils, and insurers a serious record of control.",
    steps: [
      "Review host applications, kitchen evidence, training state, menu risk, and insurance status.",
      "Mark hosts eligible, pause listings, reject applications, or request more information before anything is visible.",
      "Track incidents, guest reports, repeat complaints, menu changes, and audit history.",
      "Export compliance summaries for pilot reviews, insurance conversations, or council meetings.",
    ],
  },
};

const nav = document.querySelector(".site-nav");
const tabs = document.querySelectorAll(".tab");
const kicker = document.querySelector("#path-kicker");
const title = document.querySelector("#path-title");
const steps = document.querySelector("#path-steps");
const waitlistForm = document.querySelector(".waitlist-form");
const formNote = document.querySelector(".form-note");

window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 50);
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.path;
    const path = paths[key];

    tabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });

    kicker.textContent = path.kicker;
    title.textContent = path.title;
    steps.replaceChildren(
      ...path.steps.map((step) => {
        const item = document.createElement("li");
        item.textContent = step;
        return item;
      }),
    );
  });
});

waitlistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = new FormData(waitlistForm).get("email");
  formNote.textContent = email
    ? "Invite request staged for the real backend."
    : "Add an email address to stage an invite request.";
});
