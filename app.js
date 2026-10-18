// --- Default Data Menu Dibuat Kosong ---
const DEFAULT_PRODUCTS = [];

// --- State Aplikasi ---
let products = JSON.parse(localStorage.getItem('snoopy_blue_products')) || DEFAULT_PRODUCTS;
let cart = JSON.parse(localStorage.getItem('snoopy_blue_cart')) || [];
let history = JSON.parse(localStorage.getItem('snoopy_blue_history')) || [];

let activeCategory = 'All';
let currentPaymentMethod = 'Cash';

// --- Efek Suara Web Audio API ---
function playBeep(type = 'add') {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'add') {
            osc.frequency.setValueAtTime(550, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.08);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(750, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.15);
        }
    } catch (e) {
        // Browser block audio without gesture
    }
}

// --- DOM References ---
const viewRegister = document.getElementById('view-register');
const viewHistory = document.getElementById('view-history');
const navRegister = document.getElementById('nav-register');
const navHistory = document.getElementById('nav-history');

const productGrid = document.getElementById('product-grid');
const categoryChips = document.getElementById('category-chips');
const searchInput = document.getElementById('search-input');

const cartPanel = document.getElementById('cart-panel');
const mobileCartToggle = document.getElementById('mobile-cart-toggle');
const closeCartMobile = document.getElementById('close-cart-mobile');
const mobileCartCount = document.getElementById('mobile-cart-count');
const mobileCartTotal = document.getElementById('mobile-cart-total');

const cartItemsContainer = document.getElementById('cart-items');
const cartSubtotalEl = document.getElementById('cart-subtotal');
const cartTaxEl = document.getElementById('cart-tax');
const cartTotalEl = document.getElementById('cart-total');
const taxRateSelect = document.getElementById('tax-rate-select');
const checkoutBtn = document.getElementById('checkout-btn');
const clearCartBtn = document.getElementById('clear-cart-btn');

const checkoutModal = document.getElementById('checkout-modal');
const closeCheckoutModalBtn = document.getElementById('close-checkout-modal');
const checkoutDueAmountEl = document.getElementById('checkout-due-amount');
const cashTenderedInput = document.getElementById('cash-tendered-input');
const cashChangeAmountEl = document.getElementById('cash-change-amount');
const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
const payMethodBtns = document.querySelectorAll('.pay-method-btn');

const receiptModal = document.getElementById('receipt-modal');
const closeReceiptBtn = document.getElementById('close-receipt-btn');
const printReceiptBtn = document.getElementById('print-receipt-btn');

const openAddModalBtn = document.getElementById('open-add-modal-btn');
const mobileAddBtn = document.getElementById('mobile-add-btn');
const addProductModal = document.getElementById('add-product-modal');
const closeAddModalBtn = document.getElementById('close-add-modal');
const addProductForm = document.getElementById('add-product-form');
const modalProductTitle = document.getElementById('modal-product-title');
const editItemIdInput = document.getElementById('edit-item-id');

const resetDataBtn = document.getElementById('reset-data-btn');
const exportExcelBtn = document.getElementById('export-excel-btn');

// --- Helper Functions ---
function saveToStorage() {
    localStorage.setItem('snoopy_blue_products', JSON.stringify(products));
    localStorage.setItem('snoopy_blue_cart', JSON.stringify(cart));
    localStorage.setItem('snoopy_blue_history', JSON.stringify(history));
}

function formatCurrency(amount) {
    return 'Rp ' + parseFloat(amount).toLocaleString('id-ID');
}

// --- Toggle Cart Mobile ---
mobileCartToggle.addEventListener('click', () => {
    cartPanel.classList.add('open');
});

closeCartMobile.addEventListener('click', () => {
    cartPanel.classList.remove('open');
});

// --- Navigasi Tab ---
navRegister.addEventListener('click', () => {
    navRegister.classList.add('active');
    navHistory.classList.remove('active');
    viewRegister.classList.remove('hidden');
    viewHistory.classList.add('hidden');
});

navHistory.addEventListener('click', () => {
    navHistory.classList.add('active');
    navRegister.classList.remove('active');
    viewHistory.classList.remove('hidden');
    viewRegister.classList.add('hidden');
    renderHistory();
});

// --- Kategori & Produk ---
function renderCategories() {
    const categories = ['All', ...new Set(products.map(p => p.category))];
    categoryChips.innerHTML = categories.map(cat => `
        <button onclick="selectCategory('${cat}')" class="category-chip px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 border-blue-900 bg-white text-black shadow-[2px_2px_0_0_#1e3a8a] transition ${cat === activeCategory ? 'active' : ''}">
            ${cat}
        </button>
    `).join('');
}

window.selectCategory = function(cat) {
    activeCategory = cat;
    renderCategories();
    renderProducts();
};

function renderProducts() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = products.filter(p => {
        const matchesCat = activeCategory === 'All' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(query);
        return matchesCat && matchesSearch;
    });

    if (filtered.length === 0) {
        productGrid.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center text-gray-500 py-12 font-bold text-center">
                <i class="fa-solid fa-dog text-blue-500 text-4xl mb-2"></i>
                <p class="text-sm">Belum ada menu. Klik tombol <b>"+"</b> di atas untuk mulai!</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = filtered.map(product => {
        const outOfStock = product.stock <= 0;
        return `
            <div class="bg-white border-2 border-blue-900 hover:border-blue-500 p-3.5 md:p-4 rounded-2xl flex flex-col justify-between transition select-none group relative overflow-hidden shadow-[3px_3px_0_0_#1e3a8a] ${outOfStock ? 'opacity-60' : ''}">
                <!-- Tombol Edit Menu di Sudut Kanan Atas Kartu -->
                <button onclick="openEditModal('${product.id}')" title="Edit Menu" class="absolute top-2 right-2 bg-blue-100 hover:bg-blue-200 border border-blue-900 text-blue-900 p-1.5 rounded-lg text-xs z-10 shadow-[1px_1px_0_0_#1e3a8a]">
                    <i class="fa-solid fa-pen"></i>
                </button>

                <!-- Area Klik untuk Masuk Keranjang -->
                <div onclick="${outOfStock ? '' : `addToCart('${product.id}')`}" class="cursor-pointer flex-1 flex flex-col justify-between">
                    <div>
                        <div class="flex items-start justify-between mb-2 pr-6">
                            <div class="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-blue-100 border-2 border-blue-900 flex items-center justify-center text-blue-700 group-hover:scale-105 transition shadow-[2px_2px_0_0_#1e3a8a]">
                                <i class="fa-solid ${product.icon || 'fa-bone'} text-sm md:text-base"></i>
                            </div>
                            <span class="text-[10px] md:text-xs px-2 py-0.5 rounded-lg ${outOfStock ? 'bg-red-200 text-red-700' : 'bg-blue-50 text-blue-950'} font-bold border border-blue-900 font-mono">
                                ${outOfStock ? 'Habis' : `Stok: ${product.stock}`}
                            </span>
                        </div>
                        <div>
                            <h4 class="font-bold text-xs md:text-sm text-blue-950 group-hover:text-blue-600 transition line-clamp-1">${product.name}</h4>
                            <p class="text-[10px] md:text-xs text-gray-600 font-bold mt-0.5">${product.category}</p>
                        </div>
                    </div>
                    <div class="mt-2 md:mt-3 flex items-center justify-between font-bold">
                        <span class="text-xs md:text-sm text-black">${formatCurrency(product.price)}</span>
                        <div class="w-6 h-6 md:w-7 md:h-7 bg-blue-300 hover:bg-blue-400 border-2 border-blue-900 text-blue-950 rounded-lg flex items-center justify-center text-xs transition shadow-[2px_2px_0_0_#1e3a8a]">
                            <i class="fa-solid fa-plus"></i>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

searchInput.addEventListener('input', renderProducts);

// --- Operasi Keranjang ---
window.addToCart = function(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.stock <= 0) return;

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
        if (cart[existingIndex].qty < product.stock) {
            cart[existingIndex].qty += 1;
        } else {
            alert(`Stok maksimal tercapai: ${product.stock}`);
            return;
        }
    } else {
        cart.push({ ...product, qty: 1 });
    }

    playBeep('add');
    saveToStorage();
    renderCart();
};

window.updateCartQty = function(productId, delta) {
    const cartItem = cart.find(item => item.id === productId);
    const product = products.find(p => p.id === productId);

    if (!cartItem || !product) return;

    const newQty = cartItem.qty + delta;
    if (newQty <= 0) {
        cart = cart.filter(item => item.id !== productId);
    } else if (newQty > product.stock) {
        alert(`Stok maksimal tercapai: ${product.stock}`);
    } else {
        cartItem.qty = newQty;
    }

    saveToStorage();
    renderCart();
};

clearCartBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan keranjang?')) {
        cart = [];
        saveToStorage();
        renderCart();
    }
});

function calculateCartTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const taxRate = parseFloat(taxRateSelect.value) || 0;
    const tax = subtotal * taxRate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
}

function renderCart() {
    const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
    const { subtotal, tax, total } = calculateCartTotals();

    mobileCartCount.textContent = `${totalItems} items`;
    mobileCartTotal.textContent = formatCurrency(total);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-gray-400 py-12 font-bold">
                <i class="fa-solid fa-basket-shopping text-blue-400 text-3xl mb-2"></i>
                <p class="text-xs">Keranjang masih kosong</p>
            </div>
        `;
        checkoutBtn.disabled = true;
    } else {
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="bg-blue-50/50 p-3 rounded-xl border-2 border-blue-900 flex items-center justify-between shadow-[2px_2px_0_0_#1e3a8a]">
                <div class="flex-1 pr-2">
                    <div class="font-bold text-sm text-blue-950 line-clamp-1">${item.name}</div>
                    <div class="text-xs text-gray-600 font-bold mt-0.5">${formatCurrency(item.price)}</div>
                </div>
                <div class="flex items-center space-x-1.5 font-bold">
                    <button onclick="updateCartQty('${item.id}', -1)" class="w-6 h-6 bg-white border-2 border-blue-900 rounded-lg flex items-center justify-center text-xs text-blue-950 shadow-[1px_1px_0_0_#1e3a8a]">
                        <i class="fa-solid fa-minus"></i>
                    </button>
                    <span class="text-xs w-5 text-center text-blue-950">${item.qty}</span>
                    <button onclick="updateCartQty('${item.id}', 1)" class="w-6 h-6 bg-white border-2 border-blue-900 rounded-lg flex items-center justify-center text-xs text-blue-950 shadow-[1px_1px_0_0_#1e3a8a]">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                    <span class="text-xs font-extrabold text-blue-950 w-16 text-right">${formatCurrency(item.price * item.qty)}</span>
                </div>
            </div>
        `).join('');
        checkoutBtn.disabled = false;
    }

    cartSubtotalEl.textContent = formatCurrency(subtotal);
    cartTaxEl.textContent = formatCurrency(tax);
    cartTotalEl.textContent = formatCurrency(total);
}

taxRateSelect.addEventListener('change', renderCart);

// --- Checkout Modal ---
checkoutBtn.addEventListener('click', () => {
    const { total } = calculateCartTotals();
    checkoutDueAmountEl.textContent = formatCurrency(total);
    cashTenderedInput.value = '';
    cashChangeAmountEl.textContent = formatCurrency(0);
    checkoutModal.classList.remove('hidden');
});

closeCheckoutModalBtn.addEventListener('click', () => {
    checkoutModal.classList.add('hidden');
});

payMethodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        payMethodBtns.forEach(b => b.classList.remove('active', 'bg-blue-300'));
        payMethodBtns.forEach(b => b.classList.add('bg-blue-50'));
        
        btn.classList.add('active', 'bg-blue-300');
        btn.classList.remove('bg-blue-50');
        
        currentPaymentMethod = btn.dataset.method;

        const cashSection = document.getElementById('cash-payment-section');
        if (currentPaymentMethod === 'Cash') {
            cashSection.classList.remove('hidden');
        } else {
            cashSection.classList.add('hidden');
        }
    });
});

cashTenderedInput.addEventListener('input', updateCashChange);

function updateCashChange() {
    const { total } = calculateCartTotals();
    const tendered = parseFloat(cashTenderedInput.value) || 0;
    const change = Math.max(0, tendered - total);
    cashChangeAmountEl.textContent = formatCurrency(change);
}

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const { total } = calculateCartTotals();
        if (btn.dataset.val) {
            cashTenderedInput.value = btn.dataset.val;
        } else {
            cashTenderedInput.value = total;
        }
        updateCashChange();
    });
});

confirmPaymentBtn.addEventListener('click', () => {
    const { subtotal, tax, total } = calculateCartTotals();
    let cashTendered = parseFloat(cashTenderedInput.value) || 0;

    if (currentPaymentMethod === 'Cash' && cashTendered < total) {
        alert('Uang tunai kurang!');
        return;
    }

    if (currentPaymentMethod !== 'Cash') {
        cashTendered = total;
    }

    const change = Math.max(0, cashTendered - total);

    cart.forEach(cartItem => {
        const prod = products.find(p => p.id === cartItem.id);
        if (prod) {
            prod.stock -= cartItem.qty;
        }
    });

    const transaction = {
        id: 'BLUE-' + Date.now().toString().slice(-6),
        date: new Date().toLocaleString(),
        items: [...cart],
        subtotal,
        tax,
        total,
        method: currentPaymentMethod,
        tendered: cashTendered,
        change
    };

    history.unshift(transaction);
    saveToStorage();

    playBeep('success');
    checkoutModal.classList.add('hidden');
    cartPanel.classList.remove('open');
    showReceiptModal(transaction);

    cart = [];
    saveToStorage();
    renderCart();
    renderProducts();
});

// --- Struk Modal ---
function showReceiptModal(trx) {
    document.getElementById('receipt-date').textContent = trx.date;
    document.getElementById('receipt-id').textContent = `Order #${trx.id}`;
    
    document.getElementById('receipt-items-list').innerHTML = trx.items.map(item => `
        <div class="flex justify-between font-bold">
            <span>${item.qty}x ${item.name}</span>
            <span>${formatCurrency(item.price * item.qty)}</span>
        </div>
    `).join('');

    document.getElementById('receipt-subtotal').textContent = formatCurrency(trx.subtotal);
    document.getElementById('receipt-tax').textContent = formatCurrency(trx.tax);
    document.getElementById('receipt-total').textContent = formatCurrency(trx.total);
    
    document.getElementById('receipt-method').textContent = `Bayar (${trx.method}):`;
    document.getElementById('receipt-paid').textContent = formatCurrency(trx.tendered);
    document.getElementById('receipt-change').textContent = formatCurrency(trx.change);

    receiptModal.classList.remove('hidden');
}

closeReceiptBtn.addEventListener('click', () => {
    receiptModal.classList.add('hidden');
});

printReceiptBtn.addEventListener('click', () => {
    window.print();
});

// --- History View ---
function renderHistory() {
    const totalRev = history.reduce((acc, item) => acc + item.total, 0);
    const totalOrders = history.length;
    const avgOrder = totalOrders > 0 ? totalRev / totalOrders : 0;

    document.getElementById('stat-revenue').textContent = formatCurrency(totalRev);
    document.getElementById('stat-orders').textContent = totalOrders;
    document.getElementById('stat-avg').textContent = formatCurrency(avgOrder);

    const historyTbody = document.getElementById('history-table-body');

    if (history.length === 0) {
        historyTbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-8 text-center text-gray-500 font-bold">Belum ada transaksi tercatat.</td>
            </tr>
        `;
        return;
    }

    historyTbody.innerHTML = history.map(trx => `
        <tr class="hover:bg-blue-50">
            <td class="p-3 md:p-4 font-mono text-xs font-bold text-blue-600">${trx.id}</td>
            <td class="p-3 md:p-4 text-xs font-bold text-gray-600">${trx.date}</td>
            <td class="p-3 md:p-4 text-xs font-bold text-black">${trx.items.map(i => `${i.qty}x${i.name}`).join(', ')}</td>
            <td class="p-3 md:p-4 text-xs"><span class="px-2 py-1 rounded-lg bg-blue-100 text-blue-950 border border-blue-900 font-bold">${trx.method}</span></td>
            <td class="p-3 md:p-4 font-extrabold text-xs md:text-sm text-green-600">${formatCurrency(trx.total)}</td>
            <td class="p-3 md:p-4 text-center">
                <button onclick='viewOldReceipt(${JSON.stringify(trx).replace(/'/g, "&apos;")})' class="text-blue-950 p-2 rounded-xl bg-blue-200 border-2 border-blue-900 shadow-[2px_2px_0_0_#1e3a8a] hover:bg-blue-300 transition">
                    <i class="fa-solid fa-receipt"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

window.viewOldReceipt = function(trx) {
    showReceiptModal(trx);
};

// --- Export History ke File Excel (.xlsx) ---
exportExcelBtn.addEventListener('click', () => {
    if (history.length === 0) {
        alert('Belum ada data history untuk diexport.');
        return;
    }

    const excelData = history.map(trx => ({
        "Order ID": trx.id,
        "Tanggal & Waktu": trx.date,
        "Detail Items": trx.items.map(i => `${i.qty}x ${i.name}`).join(', '),
        "Metode Pembayaran": trx.method,
        "Subtotal": trx.subtotal,
        "Pajak": trx.tax,
        "Total Pembayaran": trx.total,
        "Uang Diterima": trx.tendered,
        "Kembalian": trx.change
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Transaksi");

    XLSX.writeFile(workbook, `SnoopyBluePOS_Sales_${Date.now()}.xlsx`);
});

// --- Modal Tambah / Edit Produk ---
openAddModalBtn.addEventListener('click', () => {
    openAddProductModal();
});

mobileAddBtn.addEventListener('click', () => {
    openAddProductModal();
});

function openAddProductModal(product = null) {
    addProductForm.reset();
    if (product) {
        modalProductTitle.textContent = "Edit Menu";
        editItemIdInput.value = product.id;
        document.getElementById('new-item-name').value = product.name;
        document.getElementById('new-item-price').value = product.price;
        document.getElementById('new-item-stock').value = product.stock;
        document.getElementById('new-item-category').value = product.category;
        document.getElementById('new-item-icon').value = product.icon || '';
    } else {
        modalProductTitle.textContent = "Tambah Menu Baru";
        editItemIdInput.value = '';
    }
    addProductModal.classList.remove('hidden');
}

window.openEditModal = function(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        openAddProductModal(product);
    }
};

closeAddModalBtn.addEventListener('click', () => {
    addProductModal.classList.add('hidden');
});

addProductForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = editItemIdInput.value;
    const name = document.getElementById('new-item-name').value.trim();
    const price = parseFloat(document.getElementById('new-item-price').value);
    const stock = parseInt(document.getElementById('new-item-stock').value);
    const category = document.getElementById('new-item-category').value.trim();
    const icon = document.getElementById('new-item-icon').value.trim() || 'fa-bone';

    const formattedIcon = icon.startsWith('fa-') ? icon : `fa-${icon}`;

    if (id) {
        // Edit produk yang sudah ada
        const product = products.find(p => p.id === id);
        if (product) {
            product.name = name;
            product.price = price;
            product.stock = stock;
            product.category = category;
            product.icon = formattedIcon;
        }
    } else {
        // Tambah produk baru
        const newProduct = {
            id: 'prod-' + Date.now(),
            name,
            price,
            stock,
            category,
            icon: formattedIcon
        };
        products.push(newProduct);
    }

    saveToStorage();
    renderCategories();
    renderProducts();
    renderCart();

    addProductModal.classList.add('hidden');
});

resetDataBtn.addEventListener('click', () => {
    if (confirm('Kosongkan seluruh menu?')) {
        products = [];
        cart = [];
        saveToStorage();
        renderCategories();
        renderProducts();
        renderCart();
    }
});

// --- Inisialisasi ---
function init() {
    renderCategories();
    renderProducts();
    renderCart();
}

init();