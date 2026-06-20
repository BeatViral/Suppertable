const listings = {
  pakistani: {
    photo: "assets/dashboard/listing-pakistani.png",
    location: "Cumbalum, NSW",
    title: "Pakistani family dinner",
    rating: "4.96",
    risk: "Medium menu risk",
    price: 42,
    host: "Ayesha and family",
    hostNote: "Verified host. Food safety module complete. Local pathway in review.",
    description:
      "A small-batch family-style order with chicken karahi, daal, rice, raita, salad, roti, and chai. Best for customers who want a warm, authentic home-cooked meal without restaurant-style commercial cooking.",
    menu: ["Chicken karahi", "Daal with tempered spices", "Basmati rice, roti, salad, raita", "Chai after dinner"],
    rules: ["Dairy disclosed in raita and chai", "Pickup window: 6:30-7:00pm", "Delivery available within 8km", "Sealed packaging and reheating notes included"],
    review: '"The food tasted like a real family recipe, and the pickup instructions were simple and calm."',
  },
  lebanese: {
    photo: "assets/dashboard/listing-lebanese.png",
    location: "Ballina, NSW",
    title: "Lebanese mezze box",
    rating: "4.91",
    risk: "Low menu risk",
    price: 38,
    host: "Samira",
    hostNote: "Verified host. Local pathway complete. Insurance status covered.",
    description:
      "A generous mezze box built for sharing: dips, herbs, grilled skewers, warm bread, olives, and mint tea packed for pickup or delivery.",
    menu: ["Hummus and baba ghanoush", "Tabbouleh and pickles", "Grilled chicken skewers", "Warm bread and mint tea"],
    rules: ["Sesame disclosed in dips", "Pickup from front gate only", "Delivery available within 6km", "Cold and warm items packaged separately"],
    review: '"Everything was generous, clean, and exactly as described. The mezze felt impossible to get at a normal restaurant."',
  },
  thai: {
    photo: "assets/dashboard/listing-thai.png",
    location: "Lennox Head, NSW",
    title: "Thai home curry night",
    rating: "4.88",
    risk: "Medium menu risk",
    price: 46,
    host: "Mali",
    hostNote: "Verified host. Spice preferences supported before ordering.",
    description:
      "A colourful Thai home-cooked order with curry, noodles, herbs, grilled vegetables, and rice. Customers choose mild, medium, or hot before confirmation.",
    menu: ["Green curry with coconut rice", "Fresh herb noodle salad", "Grilled vegetables", "Mango and coconut dessert"],
    rules: ["Peanuts and fish sauce disclosed", "Spice level confirmed before cooking", "Delivery available within 10km", "Pickup window: 6:00-6:30pm"],
    review: '"The allergy prompts were clear and the spice level was exactly what we chose. Beautiful host, beautiful meal."',
  },
  italian: {
    photo: "assets/dashboard/listing-italian.png",
    location: "Byron Bay, NSW",
    title: "Italian pasta night",
    rating: "4.94",
    risk: "Low menu risk",
    price: 44,
    host: "Rosa",
    hostNote: "Verified host. Local pathway complete. Repeat customer favourite.",
    description:
      "A warm pasta order with handmade pasta, tomato sugo, basil, salad, and dessert. Best for couples, families, or travellers wanting a home-style meal.",
    menu: ["Handmade pasta with tomato sugo", "Seasonal salad", "Garlic bread", "Tiramisu"],
    rules: ["Gluten, egg, and dairy disclosed", "Pickup or delivery available", "Pickup address released after payment", "Best eaten within 30 minutes"],
    review: '"Rosa made us feel welcome without it feeling invasive. The pasta was simple, honest, and excellent."',
  },
};

const titleMap = {
  guest: "Customer dashboard",
  host: "Host dashboard",
  admin: "Admin dashboard",
};

const roleTabs = document.querySelectorAll(".role-tab");
const panels = document.querySelectorAll("[data-view-panel]");
const dashboardTitle = document.querySelector("#dashboard-title");
const listingCards = document.querySelectorAll(".listing-card");

function setRole(view) {
  roleTabs.forEach((tab) => {
    const isActive = tab.dataset.view === view;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", String(isActive));
  });

  panels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.viewPanel === view);
  });

  dashboardTitle.textContent = titleMap[view];
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateList(target, items) {
  target.replaceChildren(
    ...items.map((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      return li;
    }),
  );
}

function setListing(key) {
  const listing = listings[key];
  if (!listing) return;

  listingCards.forEach((card) => card.classList.toggle("active", card.dataset.listing === key));
  document.querySelector("#detail-photo").src = listing.photo;
  document.querySelector("#detail-location").textContent = listing.location;
  document.querySelector("#detail-title").textContent = listing.title;
  document.querySelector("#detail-rating").textContent = listing.rating;
  document.querySelector("#detail-risk").textContent = listing.risk;
  document.querySelector("#detail-description").textContent = listing.description;
  document.querySelector("#detail-host").textContent = listing.host;
  document.querySelector("#detail-host-note").textContent = listing.hostNote;
  document.querySelector("#detail-review").textContent = listing.review;
  document.querySelector("#detail-price").textContent = `$${listing.price} for 2 portions`;
  document.querySelector("#detail-total").textContent = `$${listing.price} total`;
  updateList(document.querySelector("#detail-menu"), listing.menu);
  updateList(document.querySelector("#detail-rules"), listing.rules);
}

roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => setRole(tab.dataset.view));
});

listingCards.forEach((card) => {
  card.addEventListener("click", () => setListing(card.dataset.listing));
});
