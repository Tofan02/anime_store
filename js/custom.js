let animes = [];
let filteredAnimes = [];
let cart = JSON.parse(localStorage.getItem("animeCart")) || [];

const animeList = document.getElementById("animeList");
const checkoutList = document.getElementById("checkoutList");
const totalPriceEl = document.getElementById("totalPrice");
const totalSizeEl = document.getElementById("totalSize");
const paginationEl = document.getElementById("pagination");
const itemsPerPageSelect = document.getElementById("itemsPerPageSelect");
const sortSelect = document.getElementById("sortSelect");

let currentPage = 1;
let itemsPerPage = parseInt(itemsPerPageSelect.value);

// Load CSV
fetch("data/anime.csv")
  .then((response) => response.text())
  .then((csvText) => {
    const results = Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
    });
    animes = results.data.filter((a) => a.name && a.size);
    filteredAnimes = [...animes];
    renderAnimes();
    renderPagination();
    renderCheckout();
  });

// Render Anime
function renderAnimes() {
  animeList.innerHTML = "";

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageItems = filteredAnimes.slice(start, end);
  const totalPages = Math.ceil(filteredAnimes.length / itemsPerPage);

  document.getElementById(
    "animeCount"
  ).textContent = `Menampilkan ${pageItems.length} dari ${filteredAnimes.length} anime — Halaman ${currentPage}/${totalPages}`;

  pageItems.forEach((anime) => {
    const price = getAnimePrice(anime);
    const inCart = cart.find((item) => item.name === anime.name);

    const card = document.createElement("div");
    card.className =
      "bg-gray-50 rounded-xl p-4 shadow hover:shadow-lg transition cursor-pointer flex flex-col justify-between";
    card.onclick = () => toggleCart(anime.name);

    card.innerHTML = `
            <div>
              <h3 class="text-lg font-semibold">${anime.name}</h3>
              <p class="text-sm text-gray-600">Episode: ${anime.episodes}</p>
              <p class="text-sm text-gray-600">Size: ${formatSize(
                anime.size
              )} GB</p>
              <p class="text-sm text-gray-600">Kode: ${anime.code}</p>
              <p class="text-sm font-medium">
                Rp ${formatPrice(price)}
                ${
                  anime.discount && anime.discount > 0
                    ? `<span class="line-through text-gray-400 text-xs ml-2">
                        Rp ${formatPrice(Math.round(anime.size * 1000))}
                      </span>`
                    : ""
                }
              </p>
            </div>
            <button onclick="event.stopPropagation(); toggleCart('${
              anime.name
            }')" 
              class="mt-3 px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-medium
                transition-all duration-300 ease-in-out transform active:scale-95
                ${
                  inCart
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }">
              <i class="fa ${
                inCart ? "fa-times-circle" : "fa-plus-circle"
              }"></i> 
              <span>${inCart ? "Batalkan" : "Pilih"}</span>
            </button>
          `;

    animeList.appendChild(card);
  });
}

function toggleCart(animeName) {
  const anime = animes.find((a) => a.name === animeName);
  if (!anime) return;

  const inCart = cart.find((item) => item.name === anime.name);
  if (inCart) {
    cart = cart.filter((item) => item.name !== anime.name);
  } else {
    cart.push(anime);
  }

  localStorage.setItem("animeCart", JSON.stringify(cart));
  renderAnimes();
  renderCheckout();
}

// Pagination
function renderPagination() {
  paginationEl.innerHTML = "";
  const totalPages = Math.ceil(filteredAnimes.length / itemsPerPage);
  if (totalPages <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  if (start > 1) {
    paginationEl.appendChild(makePageButton(1));
    if (start > 2) paginationEl.appendChild(makeEllipsis());
  }
  for (let i = start; i <= end; i++) {
    paginationEl.appendChild(makePageButton(i, i === currentPage));
  }
  if (end < totalPages) {
    if (end < totalPages - 1) paginationEl.appendChild(makeEllipsis());
    paginationEl.appendChild(makePageButton(totalPages));
  }
}

function makePageButton(page, active = false) {
  const btn = document.createElement("button");
  btn.textContent = page;
  btn.className = `px-3 py-1 rounded ${
    active ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"
  }`;
  btn.onclick = () => {
    currentPage = page;
    renderAnimes();
    renderPagination();
  };
  return btn;
}

function makeEllipsis() {
  const span = document.createElement("span");
  span.textContent = "...";
  span.className = "px-2 text-gray-500";
  return span;
}

// Search
function searchAnimes() {
  const query = document.getElementById("searchInput").value.toLowerCase();
  filteredAnimes = animes.filter((anime) =>
    anime.name.toLowerCase().includes(query)
  );
  sortAnimes();
  currentPage = 1;
  renderAnimes();
  renderPagination();
}

// Ubah jumlah item
function changeItemsPerPage() {
  itemsPerPage = parseInt(itemsPerPageSelect.value);
  currentPage = 1;
  renderAnimes();
  renderPagination();
}

// Sorting
function sortAnimes() {
  const value = sortSelect.value;
  filteredAnimes.sort((a, b) => {
    const priceA = a.size * 1000;
    const priceB = b.size * 1000;

    switch (value) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "size-asc":
        return a.size - b.size;
      case "size-desc":
        return b.size - a.size;
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      case "episodes-asc":
        return a.episodes - b.episodes;
      case "episodes-desc":
        return b.episodes - a.episodes;
    }
  });
  currentPage = 1;
  renderAnimes();
  renderPagination();
}

// Checkout
function renderCheckout() {
  checkoutList.innerHTML = "";
  let total = 0;
  let totalSize = 0;
  cart.forEach((anime) => {
    const price = getAnimePrice(anime);
    total += price;
    totalSize += anime.size;
    const item = document.createElement("div");
    item.className =
      "flex justify-between items-center bg-gray-100 p-2 rounded-lg";
    item.innerHTML = `
            <div>
              <p class="font-medium">${anime.name}</p>
              <p class="text-xs text-gray-600">
                ${anime.episodes} eps — ${formatSize(
      anime.size
    )} GB — Rp ${formatPrice(price)}
              </p>
            </div>
            <button onclick="removeFromCart('${anime.name}')" 
              class="w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600">
              <i class="fa fa-times"></i>
            </button>
          `;
    checkoutList.appendChild(item);
  });

  totalPriceEl.textContent = "Rp " + formatPrice(total);
  totalSizeEl.textContent = formatSize(totalSize) + " GB";
}

function removeFromCart(name) {
  cart = cart.filter((item) => item.name !== name);
  localStorage.setItem("animeCart", JSON.stringify(cart));
  renderCheckout();
  renderAnimes();
}

// WhatsApp
function sendToWhatsApp() {
  if (cart.length === 0) {
    alert("Keranjang masih kosong!");
    return;
  }

  let message = "*List Beli Anime*\n\n";
  cart.forEach((anime, i) => {
    const price = getAnimePrice(anime);
    message += `${i + 1}. *${anime.name}* (${anime.code}) ${formatSize(
      anime.size
    )} GB - Rp ${formatPrice(price)}\n\n`;
  });

  let totalSize = cart.reduce((sum, a) => sum + a.size, 0);
  let totalPrice = cart.reduce((sum, a) => sum + getAnimePrice(a), 0);

  message += "────────────────────\n";
  message += `Total Size : *${formatSize(totalSize)} GB*\n`;
  message += `Total Bayar: *Rp ${formatPrice(totalPrice)}*`;

  const phone = "6283152898011"; // nomor WA tujuan
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank");
}

function getAnimePrice(anime) {
  const basePrice =
    Math.round(anime.size) * 1000 > 0 ? Math.round(anime.size) * 1000 : 1000;

  if (anime.discount && anime.discount > 0) {
    return Math.round(basePrice * (1 - anime.discount));
  }
  return basePrice;
}

function formatPrice(value) {
  return value.toLocaleString("id-ID");
}

function formatSize(value) {
  return value.toFixed(2).replace(".", ",");
}
