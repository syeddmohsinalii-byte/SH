// SH. SAEED Art n Craft - Main Interactive Application Logic

// ==========================================
// 1. Persistent Cart Management (localStorage)
// ==========================================
const CART_STORAGE_KEY = 'sh_saeed_cart_v1';

class CartManager {
  static getCart() {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to read cart from localStorage", e);
      return [];
    }
  }

  static saveCart(cart) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      CartManager.updateUI();
    } catch (e) {
      console.error("Failed to save cart to localStorage", e);
    }
  }

  static addItem(productId, quantity = 1, customDetails = null) {
    const cart = CartManager.getCart();
    let product = PRODUCT_CATALOG.find(p => p.id === productId);
    
    if (customDetails) {
      const existingCustom = cart.find(item => item.id === productId && item.isCustom);
      if (existingCustom) {
        existingCustom.quantity += quantity;
      } else {
        cart.push({
          id: productId,
          name: customDetails.name,
          categoryName: "Custom Crafted",
          price: customDetails.price,
          image: customDetails.image || "assets/images/products/custom-sketchbook-a4.jpg",
          description: customDetails.description,
          quantity: quantity,
          isCustom: true
        });
      }
    } else if (product) {
      const existing = cart.find(item => item.id === productId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.push({
          id: product.id,
          name: product.name,
          categoryName: product.categoryName,
          price: product.price,
          image: product.image,
          description: product.description,
          quantity: quantity
        });
      }
    } else {
      showToast("Product not found in catalog", "warning");
      return;
    }

    CartManager.saveCart(cart);
    showToast(`Added to cart: ${product ? product.name : customDetails.name}`, 'success');
  }

  static removeItem(productId) {
    let cart = CartManager.getCart();
    cart = cart.filter(item => item.id !== productId);
    CartManager.saveCart(cart);
    showToast("Item removed from cart", "info");
  }

  static updateQuantity(productId, quantity) {
    let cart = CartManager.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      if (quantity <= 0) {
        CartManager.removeItem(productId);
        return;
      }
      item.quantity = quantity;
      CartManager.saveCart(cart);
    }
  }

  static clearCart() {
    localStorage.removeItem(CART_STORAGE_KEY);
    CartManager.updateUI();
    showToast("Cart cleared", "info");
  }

  static getTotalCount() {
    const cart = CartManager.getCart();
    return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  static getTotalPrice() {
    const cart = CartManager.getCart();
    return cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  }

  static updateUI() {
    const count = CartManager.getTotalCount();
    const total = CartManager.getTotalPrice();

    const badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(badge => {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });

    const totalEls = document.querySelectorAll('.cart-total-amount');
    totalEls.forEach(el => {
      el.textContent = `Rs. ${total.toLocaleString()}`;
    });

    CartManager.renderDrawer();
    
    if (typeof renderCheckoutPage === 'function') {
      renderCheckoutPage();
    }
  }

  static renderDrawer() {
    const drawerList = document.getElementById('cart-drawer-items');
    if (!drawerList) return;

    const cart = CartManager.getCart();
    const emptyState = document.getElementById('cart-drawer-empty');
    const footer = document.getElementById('cart-drawer-footer');

    if (cart.length === 0) {
      drawerList.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      if (footer) footer.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (footer) footer.classList.remove('hidden');

    let html = '';
    cart.forEach(item => {
      html += `
        <div class="flex items-center gap-3.5 py-3 border-b border-slate-100 last:border-b-0">
          <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0 bg-white shadow-sm" />
          <div class="flex-1 min-w-0">
            <h4 class="text-xs sm:text-sm font-bold text-slate-800 truncate">${item.name}</h4>
            <div class="text-xs text-indigo-600 font-extrabold mt-0.5">Rs. ${item.price.toLocaleString()}</div>
            <div class="flex items-center gap-2 mt-2">
              <div class="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                <button onclick="CartManager.updateQuantity('${item.id}', ${item.quantity - 1})" class="w-6 h-6 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">-</button>
                <span class="text-xs font-bold px-2 text-slate-800">${item.quantity}</span>
                <button onclick="CartManager.updateQuantity('${item.id}', ${item.quantity + 1})" class="w-6 h-6 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">+</button>
              </div>
              <button onclick="CartManager.removeItem('${item.id}')" class="ml-auto text-xs text-rose-500 hover:text-rose-700 hover:underline font-semibold">Remove</button>
            </div>
          </div>
        </div>
      `;
    });
    drawerList.innerHTML = html;
  }
}

// ==========================================
// 2. WhatsApp Order Message Generator
// ==========================================
function generateWhatsAppOrderLink(customerInfo = null) {
  const cart = CartManager.getCart();
  if (cart.length === 0 && !customerInfo?.quickItem) {
    showToast("Your cart is empty! Add items first.", "warning");
    return null;
  }

  let text = `🎨 *ORDER INQUIRY - SH. SAEED ART N CRAFT*\n`;
  text += `📍 *Store:* Gulshan-e-Iqbal, Rashid Minhas Rd, Karachi\n`;
  text += `------------------------------------\n`;

  if (customerInfo?.quickItem) {
    const item = customerInfo.quickItem;
    text += `*QUICK ORDER ITEM:*\n`;
    text += `▪️ *${item.name}*\n`;
    text += `   Qty: 1 | Price: Rs. ${item.price.toLocaleString()}\n`;
  } else {
    text += `*ITEMS REQUESTED:*\n`;
    let subtotal = 0;
    cart.forEach((item, idx) => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;
      text += `${idx + 1}. *${item.name}*\n`;
      text += `   Qty: ${item.quantity} x Rs. ${item.price.toLocaleString()} = Rs. ${lineTotal.toLocaleString()}\n`;
      if (item.isCustom && item.description) {
        text += `   (Specs: ${item.description})\n`;
      }
    });
    text += `------------------------------------\n`;
    text += `*Estimated Subtotal:* Rs. ${subtotal.toLocaleString()}\n`;
  }

  if (customerInfo) {
    text += `\n*CUSTOMER DETAILS:*\n`;
    if (customerInfo.name) text += `👤 Name: ${customerInfo.name}\n`;
    if (customerInfo.phone) text += `📞 Phone: ${customerInfo.phone}\n`;
    if (customerInfo.area) text += `📍 Karachi Area: ${customerInfo.area}\n`;
    if (customerInfo.deliveryType) text += `🚚 Delivery Method: ${customerInfo.deliveryType}\n`;
    if (customerInfo.notes) text += `📝 Special Note: ${customerInfo.notes}\n`;
  } else {
    text += `\n*Delivery Request:* Please quote delivery via Bykea/Rider in Karachi or confirm shop pickup.\n`;
  }

  text += `\nSalam Faiz Bhai / Mehtab Bhai, please confirm stock availability and final payment instructions!`;

  return `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
}

function sendWhatsAppOrder(customerInfo = null) {
  const link = generateWhatsAppOrderLink(customerInfo);
  if (link) {
    window.open(link, '_blank');
  }
}

function quickBuyOnWhatsApp(productId) {
  const product = PRODUCT_CATALOG.find(p => p.id === productId);
  if (!product) return;

  const text = `🎨 *QUICK INQUIRY - SH. SAEED ART N CRAFT*\n` +
    `Salam Faiz Bhai, I saw this on your website and want to buy it:\n\n` +
    `▪️ *Product:* ${product.name}\n` +
    `▪️ *Category:* ${product.categoryName}\n` +
    `▪️ *Website Price:* Rs. ${product.price.toLocaleString()}\n` +
    `▪️ *Stock Status:* ${product.stock}\n\n` +
    `Please confirm if this is available for pickup at your Gulshan shop or rider delivery across Karachi!`;

  window.open(`https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
}

// ==========================================
// 3. Product Quick View Modal
// ==========================================
function openQuickView(productId) {
  const product = PRODUCT_CATALOG.find(p => p.id === productId);
  if (!product) return;

  let modal = document.getElementById('quick-view-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'quick-view-modal';
    modal.className = 'modal-backdrop fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
      
      <button onclick="closeQuickView()" class="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <div class="grid grid-cols-1 md:grid-cols-2">
        <div class="p-6 bg-slate-50 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
          <img src="${product.image}" alt="${product.name}" class="max-h-72 w-full object-contain rounded-2xl drop-shadow-md" />
        </div>

        <div class="p-6 flex flex-col justify-between space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                ${product.categoryName}
              </span>
              <span class="text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1">
                ★ ${product.rating} (Verified)
              </span>
            </div>

            <h3 class="font-heading font-black text-xl text-slate-900 leading-tight">${product.name}</h3>
            <p class="text-xs text-slate-500 mt-2 leading-relaxed">${product.description}</p>
            
            <div class="mt-3 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
              <span class="pulse-badge"></span>
              <span>${product.stock}</span>
            </div>
          </div>

          <div class="pt-4 border-t border-slate-100 space-y-3">
            <div class="flex items-baseline gap-3">
              <span class="text-2xl font-black text-slate-900">Rs. ${product.price.toLocaleString()}</span>
              <span class="text-xs text-slate-400 line-through">Rs. ${product.originalPrice.toLocaleString()}</span>
              <span class="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Save Rs. ${(product.originalPrice - product.price).toLocaleString()}</span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1">
              <button onclick="CartManager.addItem('${product.id}'); closeQuickView();" class="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition">
                <i data-lucide="shopping-cart" class="w-4 h-4"></i> Add to Order
              </button>
              <button onclick="quickBuyOnWhatsApp('${product.id}'); closeQuickView();" class="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow transition">
                <i data-lucide="message-circle" class="w-4 h-4"></i> Order on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  modal.classList.add('active');
  lucide.createIcons();
}

function closeQuickView() {
  const modal = document.getElementById('quick-view-modal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// ==========================================
// 4. Live Store Status (Karachi Time GMT+5)
// ==========================================
function updateStoreStatus() {
  const statusPills = document.querySelectorAll('.live-store-status');
  if (statusPills.length === 0) return;

  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const karachiTime = new Date(utc + (3600000 * 5));

  const day = karachiTime.getDay();
  const hours = karachiTime.getHours();
  const minutes = karachiTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const openMinutes = 10 * 60 + 30; // 10:30 AM
  const closeMinutes = 20 * 60;      // 8:00 PM

  let isOpen = false;
  let statusText = "";
  let badgeColor = "";

  if (day === 0) {
    statusText = "Closed on Sunday • Opens Mon 10:30 AM";
    badgeColor = "bg-amber-500";
  } else if (timeInMinutes >= openMinutes && timeInMinutes <= closeMinutes) {
    if (day === 5 && timeInMinutes >= (13 * 60 + 15) && timeInMinutes <= (14 * 60 + 15)) {
      statusText = "Juma Prayer Pause • Reopens 2:15 PM";
      badgeColor = "bg-amber-500";
    } else {
      isOpen = true;
      statusText = "Open Today until 8:00 PM";
      badgeColor = "bg-emerald-500";
    }
  } else if (timeInMinutes < openMinutes) {
    statusText = "Opens Today at 10:30 AM";
    badgeColor = "bg-slate-400";
  } else {
    statusText = "Closed for Today • Opens Tomorrow 10:30 AM";
    badgeColor = "bg-slate-400";
  }

  statusPills.forEach(el => {
    el.innerHTML = `
      <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${isOpen ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">
        <span class="w-2 h-2 rounded-full ${badgeColor} ${isOpen ? 'animate-ping' : ''}"></span>
        ${statusText}
      </span>
    `;
  });
}

// ==========================================
// 5. Drawer & Search Controls
// ==========================================
function toggleCartDrawer(open = null) {
  const drawer = document.getElementById('cart-drawer');
  const overlay = document.getElementById('cart-drawer-overlay');
  if (!drawer || !overlay) return;

  const shouldOpen = open !== null ? open : !drawer.classList.contains('active');
  if (shouldOpen) {
    CartManager.renderDrawer();
    drawer.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  } else {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function toggleSearchModal(open = null) {
  const modal = document.getElementById('search-modal');
  if (!modal) return;

  const shouldOpen = open !== null ? open : !modal.classList.contains('active');
  if (shouldOpen) {
    modal.classList.add('active');
    const input = document.getElementById('search-input');
    if (input) {
      setTimeout(() => input.focus(), 100);
      handleLiveSearch(input.value);
    }
  } else {
    modal.classList.remove('active');
  }
}

function handleLiveSearch(query) {
  const resultsContainer = document.getElementById('search-results');
  if (!resultsContainer) return;

  const clean = (query || '').trim().toLowerCase();
  if (clean.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-8 text-slate-400">
        <p class="text-sm">Start typing to search 40+ products, Cadence paints, canvases, brushes & stationery...</p>
        <div class="flex flex-wrap justify-center gap-2 mt-4">
          <span onclick="document.getElementById('search-input').value='Acrylic'; handleLiveSearch('Acrylic');" class="cursor-pointer text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1 rounded-full text-slate-600 font-semibold">Acrylic</span>
          <span onclick="document.getElementById('search-input').value='Canvas'; handleLiveSearch('Canvas');" class="cursor-pointer text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1 rounded-full text-slate-600 font-semibold">Canvas</span>
          <span onclick="document.getElementById('search-input').value='Sketchbook'; handleLiveSearch('Sketchbook');" class="cursor-pointer text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1 rounded-full text-slate-600 font-semibold">Sketchbook</span>
          <span onclick="document.getElementById('search-input').value='UHU'; handleLiveSearch('UHU');" class="cursor-pointer text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1 rounded-full text-slate-600 font-semibold">UHU</span>
          <span onclick="document.getElementById('search-input').value='Balsa Wood'; handleLiveSearch('Balsa Wood');" class="cursor-pointer text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 px-3 py-1 rounded-full text-slate-600 font-semibold">Balsa Wood</span>
        </div>
      </div>
    `;
    return;
  }

  const matches = PRODUCT_CATALOG.filter(p => {
    return p.name.toLowerCase().includes(clean) ||
           p.categoryName.toLowerCase().includes(clean) ||
           p.description.toLowerCase().includes(clean) ||
           (p.tags && p.tags.some(t => t.toLowerCase().includes(clean)));
  });

  if (matches.length === 0) {
    resultsContainer.innerHTML = `
      <div class="text-center py-8">
        <p class="text-sm text-slate-600">No exact matches found for "<strong>${query}</strong>".</p>
        <p class="text-xs text-slate-400 mt-1">Don't worry! We have over 15,000 items in our physical Gulshan store.</p>
        <a href="https://wa.me/${STORE_CONFIG.whatsappNumber}?text=Salam%20Faiz%20Bhai,%20do%20you%20have%20${encodeURIComponent(query)}%20in%20stock%20at%20SH%20Saeed?" target="_blank" class="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold">
          Ask Faiz Bhai on WhatsApp
        </a>
      </div>
    `;
    return;
  }

  let html = `<div class="divide-y divide-slate-100">`;
  matches.forEach(item => {
    html += `
      <div class="flex items-center justify-between p-3 hover:bg-slate-50 transition rounded-xl">
        <div class="flex items-center gap-3 cursor-pointer" onclick="openQuickView('${item.id}'); toggleSearchModal(false);">
          <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-contain bg-white rounded-lg border border-slate-200 p-0.5" />
          <div>
            <div class="text-sm font-semibold text-slate-900">${item.name}</div>
            <div class="text-xs text-slate-500">${item.categoryName} • <span class="text-emerald-600 font-medium">${item.stock}</span></div>
          </div>
        </div>
        <div class="text-right">
          <div class="text-sm font-bold text-indigo-600">Rs. ${item.price.toLocaleString()}</div>
          <button onclick="CartManager.addItem('${item.id}'); toggleSearchModal(false);" class="text-xs text-indigo-600 hover:text-indigo-800 font-bold mt-1">Add to Cart</button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  resultsContainer.innerHTML = html;
}

// ==========================================
// 6. Toast Notification Helper
// ==========================================
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '🔔';
  if (type === 'success') icon = '✅';
  if (type === 'warning') icon = '⚠️';
  if (type === 'info') icon = 'ℹ️';

  toast.innerHTML = `
    <span class="text-base">${icon}</span>
    <span class="text-xs font-semibold">${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ==========================================
// 7. Recent Verified Order Urgency Ticker
// ==========================================
function startRecentOrderTicker() {
  const recentOrders = [
    { name: "Ayesha M.", area: "PECHS", item: "Cadence Heavy Texture Modeling Paste", time: "2 mins ago" },
    { name: "Zainab K.", area: "IVS Campus", item: "Custom Hand-Bound Artist Sketchbook", time: "5 mins ago" },
    { name: "Hamza R.", area: "Gulistan-e-Johar", item: "Triple-Primed Stretched Canvas 18x24", time: "8 mins ago" },
    { name: "Bilal S.", area: "DHA Phase 6", item: "Pro Artist Filbert Brush Set 12-Piece", time: "12 mins ago" },
    { name: "Mariam T.", area: "North Nazimabad", item: "Winsor & Newton Cotman Watercolor Box", time: "16 mins ago" },
    { name: "Farhan A.", area: "KU Campus", item: "Architectural Balsa Wood Sheets Pack", time: "22 mins ago" }
  ];

  let orderIndex = 0;
  setInterval(() => {
    const order = recentOrders[orderIndex];
    orderIndex = (orderIndex + 1) % recentOrders.length;

    let ticker = document.getElementById('recent-order-pill');
    if (!ticker) {
      ticker = document.createElement('div');
      ticker.id = 'recent-order-pill';
      ticker.className = 'fixed bottom-6 right-6 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 p-3 rounded-2xl shadow-xl max-w-xs transition-all duration-500 transform translate-y-10 opacity-0 hidden sm:flex items-center gap-3';
      document.body.appendChild(ticker);
    }

    ticker.innerHTML = `
      <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
        <i data-lucide="package-check" class="w-5 h-5"></i>
      </div>
      <div class="min-w-0 flex-1 text-left">
        <div class="text-[11px] font-bold text-slate-900 truncate">
          ${order.name} (${order.area})
        </div>
        <div class="text-[10px] text-slate-500 truncate">
          Ordered <span class="font-semibold text-indigo-600">${order.item}</span>
        </div>
      </div>
      <span class="text-[9px] text-slate-400 shrink-0">${order.time}</span>
    `;
    lucide.createIcons();

    ticker.classList.remove('translate-y-10', 'opacity-0');
    setTimeout(() => {
      ticker.classList.add('translate-y-10', 'opacity-0');
    }, 4500);
  }, 14000);
}

// ==========================================
// 8. Mobile Navigation Toggle
// ==========================================
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) {
    menu.classList.toggle('hidden');
  }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  CartManager.updateUI();
  updateStoreStatus();
  setInterval(updateStoreStatus, 60000);
  startRecentOrderTicker();

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleSearchModal();
    }
    if (e.key === 'Escape') {
      toggleSearchModal(false);
      toggleCartDrawer(false);
      closeQuickView();
    }
  });
});
