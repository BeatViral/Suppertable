const kitchens = {
  pakistani: {
    photo: "assets/dashboard/listing-pakistani.png",
    location: "Cumbalum, NSW",
    title: "Matloob Kitchen",
    rating: "4.96",
    risk: "Medium menu risk",
    price: 42,
    owner: "Ayesha Matloob",
    ownerNote: "Kitchen reviewed before opening. Food safety module complete. Local pathway in review.",
    description:
      "A branded local kitchen serving Pakistani cooking in small batches. Customers can order the current menu ahead for pickup or local delivery where offered.",
    menu: ["Friday Karahi Dinner", "Daal with tempered spices", "Basmati rice, roti, salad, raita", "Chai add-on"],
    rules: ["Dairy disclosed in raita and chai", "Pickup window: 6:30-7:00pm", "Delivery available within 8km", "Sealed packaging and reheating notes included"],
    review: '"Matloob Kitchen felt like a proper local food brand, and the pickup instructions were simple."',
  },
  lebanese: {
    photo: "assets/dashboard/listing-lebanese.png",
    location: "Ballina, NSW",
    title: "Haddad Kitchen",
    rating: "4.91",
    risk: "Low menu risk",
    price: 38,
    owner: "Samira Haddad",
    ownerNote: "Kitchen reviewed before opening. Local pathway complete. Insurance status covered.",
    description:
      "A branded Lebanese kitchen with mezze boxes, kafta, dips, herbs, warm bread, olives, and mint tea packed for pickup or delivery.",
    menu: ["Lebanese Family Box", "Hummus and baba ghanoush", "Tabbouleh and pickles", "Warm bread and mint tea"],
    rules: ["Sesame disclosed in dips", "Pickup from front gate only", "Delivery available within 6km", "Cold and warm items packaged separately"],
    review: '"A generous local kitchen with a clear menu and careful packaging."',
  },
  thai: {
    photo: "assets/dashboard/listing-thai.png",
    location: "Lennox Head, NSW",
    title: "Nok's Kitchen",
    rating: "4.88",
    risk: "Medium menu risk",
    price: 46,
    owner: "Nok Mali",
    ownerNote: "Kitchen reviewed before opening. Spice preferences supported before ordering.",
    description:
      "A branded Thai kitchen with curry, noodles, herbs, grilled vegetables, and rice. Customers choose mild, medium, or hot before confirmation.",
    menu: ["Saturday Thai Kitchen", "Green curry with coconut rice", "Fresh herb noodle salad", "Mango and coconut dessert"],
    rules: ["Peanuts and fish sauce disclosed", "Spice level confirmed before cooking", "Delivery available within 10km", "Pickup window: 6:00-6:30pm"],
    review: '"The allergy prompts were clear and the spice level was exactly what we chose."',
  },
  italian: {
    photo: "assets/dashboard/listing-italian.png",
    location: "Byron Bay, NSW",
    title: "Rosa's Pasta Room",
    rating: "4.94",
    risk: "Low menu risk",
    price: 44,
    owner: "Rosa Romano",
    ownerNote: "Kitchen reviewed before opening. Local pathway complete. Repeat customer favourite.",
    description:
      "A branded pasta kitchen with handmade pasta, tomato sugo, basil, salad, and dessert.",
    menu: ["Handmade pasta with tomato sugo", "Seasonal salad", "Garlic bread", "Tiramisu"],
    rules: ["Gluten, egg, and dairy disclosed", "Pickup or delivery available", "Pickup instructions sent after payment", "Best eaten within 30 minutes"],
    review: "\"Rosa's Pasta Room has a clear identity. The pasta was simple, honest, and excellent.\"",
  },
};

const titleMap = {
  guest: "Customer workspace",
  owner: "Kitchen owner workspace",
  admin: "Admin review workspace",
};

const roleTabs = document.querySelectorAll(".role-tab");
const panels = document.querySelectorAll("[data-view-panel]");
const dashboardTitle = document.querySelector("#dashboard-title");
const kitchenCards = document.querySelectorAll(".kitchen-result-card");

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

function setKitchen(key) {
  const kitchen = kitchens[key];
  if (!kitchen) return;

  kitchenCards.forEach((card) => card.classList.toggle("active", card.dataset.kitchen === key));
  document.querySelector("#detail-photo").src = kitchen.photo;
  document.querySelector("#detail-location").textContent = kitchen.location;
  document.querySelector("#detail-title").textContent = kitchen.title;
  document.querySelector("#detail-rating").textContent = kitchen.rating;
  document.querySelector("#detail-risk").textContent = kitchen.risk;
  document.querySelector("#detail-description").textContent = kitchen.description;
  document.querySelector("#detail-owner").textContent = kitchen.owner;
  document.querySelector("#detail-owner-note").textContent = kitchen.ownerNote;
  document.querySelector("#detail-review").textContent = kitchen.review;
  document.querySelector("#detail-price").textContent = `$${kitchen.price} for 2 portions`;
  document.querySelector("#detail-total").textContent = `$${kitchen.price} total`;
  updateList(document.querySelector("#detail-menu"), kitchen.menu);
  updateList(document.querySelector("#detail-rules"), kitchen.rules);
}

roleTabs.forEach((tab) => {
  tab.addEventListener("click", () => setRole(tab.dataset.view));
});

kitchenCards.forEach((card) => {
  card.addEventListener("click", () => setKitchen(card.dataset.kitchen));
});
