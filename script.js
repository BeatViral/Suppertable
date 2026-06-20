const paths = {
  guest: {
    kicker: "Customer app",
    title: "Find a home kitchen that feels personal, verified, and delicious.",
    steps: [
      "Browse verified home kitchens by cuisine, pickup window, delivery radius, price, dietary needs, and suburb.",
      "Open a meal page with photos, host story, set menu, allergens, portions, packaging, and fulfilment options.",
      "Place a prepaid pickup or delivery order, complete account verification, and receive order updates after confirmation.",
      "Collect or receive a home-cooked meal, then review the host, food accuracy, packaging, and fulfilment experience.",
    ],
  },
  host: {
    kicker: "Host studio",
    title: "Turn a home kitchen into a controlled income stream.",
    steps: [
      "Create a host profile with identity, location, cooking background, and batch capacity.",
      "Complete guided safety modules, kitchen photos, allergen prompts, packaging setup, pickup windows, and delivery radius.",
      "Submit fixed menus, dates, prices, portions, fulfilment options, and local compliance checklist confirmations.",
      "Go live only after review, then manage orders, payouts, reviews, and incidents.",
    ],
  },
  admin: {
    kicker: "Compliance cockpit",
    title: "Give operators, councils, and insurers a serious record of control.",
    steps: [
      "Review host applications, kitchen evidence, training state, menu risk, and insurance status.",
      "Mark hosts eligible, pause listings, reject applications, or request more information before anything is visible.",
      "Track incidents, customer reports, repeat complaints, menu changes, and audit history.",
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
