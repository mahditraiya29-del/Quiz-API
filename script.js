import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC56JLEqoOhQo194L8cv33nI7o5m04Ya9g",
    authDomain: "kef-muscle-store-b3ba0.firebaseapp.com",
    projectId: "kef-muscle-store-b3ba0",
    storageBucket: "kef-muscle-store-b3ba0.firebasestorage.app",
    messagingSenderId: "57477768198",
    appId: "1:57477768198:web:40ba3c97a67fd2ea3a0f87",
    measurementId: "G-CYZ5PW5G99"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
let allProducts = [];
let currentModalProduct = null;

const productsRef = ref(db, 'products');
onValue(productsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allProducts = Object.entries(data).map(([id, product]) => ({ ...product, firebaseId: id }));
        renderMainProducts();
        renderFullProducts();
    } else {
        document.getElementById('productsScroll').innerHTML = '<div style="text-align: center; width: 100%; padding: 40px;">Aucun produit disponible</div>';
        document.getElementById('productsFullGrid').innerHTML = '<div style="text-align: center; padding: 40px;">Aucun produit disponible</div>';
    }
});

// Hero Image Slideshow
(function initHeroSlideshow() {
    const heroImg = document.getElementById('heroImage');
    if (!heroImg) return;
    const images = ['qq.webp', 'cc.webp'];
    let currentImageIndex = 0;
    setInterval(function() {
        heroImg.style.opacity = '0.5';
        setTimeout(() => {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            heroImg.src = images[currentImageIndex];
            heroImg.style.opacity = '1';
        }, 300);
    }, 10000);
})();

function formatPrice(product) {
    const hasDiscount = product.discountPercent && product.discountPercent > 0;
    const originalPrice = product.originalPrice || product.price;
    const finalPrice = product.price;
    const discountPercent = product.discountPercent || 0;
    if (hasDiscount) {
        return `<div class="product-price-wrapper"><span class="original-price">${originalPrice.toFixed(2)} DT</span><span class="final-price">${finalPrice.toFixed(2)} DT</span><span class="discount-badge">-${discountPercent}%</span></div>`;
    } else {
        return `<div class="final-price" style="font-size: 14px;">${finalPrice.toFixed(2)} DT</div>`;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function generateProductCard(product) {
    return `<div class="product-card" data-product-id="${product.firebaseId}">
                <div class="product-img"><img src="${product.imageUrl}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/150'"></div>
                <div class="product-rating"><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i></div>
                <div class="product-title">${escapeHtml(product.name)}</div>
                <div class="product-category">${product.category}</div>
                ${formatPrice(product)}
                <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCartFromCard(this)"><i class="fas fa-cart-plus"></i> Ajouter</button>
            </div>`;
}

function getProductById(id) {
    return allProducts.find(p => p.firebaseId === id);
}

function renderMainProducts() {
    const container = document.getElementById('productsScroll');
    if (!allProducts.length) {
        container.innerHTML = '<div style="text-align: center; width: 100%; padding: 40px;">Aucun produit disponible</div>';
        return;
    }
    container.innerHTML = allProducts.slice(0, 8).map(product => generateProductCard(product)).join('');
    attachProductClickEvents();
}

function renderFullProducts() {
    const container = document.getElementById('productsFullGrid');
    if (!allProducts.length) {
        container.innerHTML = '<div style="text-align: center; padding: 40px;">Aucun produit disponible</div>';
        return;
    }
    container.innerHTML = allProducts.map(product => generateProductCard(product)).join('');
    attachProductClickEvents();
}

function attachProductClickEvents() {
    document.querySelectorAll('.product-card').forEach(card => {
        card.removeEventListener('click', card.clickHandler);
        const handler = (e) => {
            if (e.target.classList.contains('add-to-cart-btn')) return;
            const productId = card.dataset.productId;
            const product = getProductById(productId);
            if (product) showProductModal(product);
        };
        card.addEventListener('click', handler);
        card.clickHandler = handler;
    });
}

function showProductModal(product) {
    currentModalProduct = product;
    document.getElementById('modalImg').src = product.imageUrl;
    document.getElementById('modalTitle').innerText = product.name;
    document.getElementById('modalCategory').innerText = product.category;
    const hasDiscount = product.discountPercent && product.discountPercent > 0;
    if (hasDiscount) {
        document.getElementById('modalPrice').innerHTML = `<div style="display: flex; align-items: center; gap: 12px;"><span style="text-decoration: line-through; font-size: 20px; color: #9ca3af;">${(product.originalPrice || product.price).toFixed(2)} DT</span><span style="font-size: 28px; font-weight: 800; color: var(--primary);">${product.price.toFixed(2)} DT</span><span style="background: #ef4444; color: white; padding: 4px 10px; border-radius: 20px;">-${product.discountPercent}%</span></div>`;
    } else {
        document.getElementById('modalPrice').innerHTML = `${product.price.toFixed(2)} DT`;
    }
    const descText = product.desc || 'Aucune description disponible.';
    document.getElementById('modalDesc').innerHTML = descText.replace(/\n/g, '<br>');
    document.getElementById('productModal').classList.add('show');
}

function addToCart(product) {
    if (!product || !product.name || product.price === undefined) {
        console.error("Produit invalide pour l'ajout au panier", product);
        return;
    }
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existing = cart.find(item => item.name === product.name);
    const productToAdd = {
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice || product.price,
        discountPercent: product.discountPercent || 0,
        img: product.imageUrl,
        imageUrl: product.imageUrl,
        quantity: 1
    };
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push(productToAdd);
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    const btn = document.getElementById('modalAddBtn');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    setTimeout(() => { btn.innerHTML = original; }, 1500);
}

window.addToCartModal = function() { if (currentModalProduct) addToCart(currentModalProduct); };
document.getElementById('modalAddBtn').addEventListener('click', window.addToCartModal);
document.getElementById('closeModalBtn').addEventListener('click', () => document.getElementById('productModal').classList.remove('show'));
document.getElementById('productModal').addEventListener('click', (e) => { if (e.target === document.getElementById('productModal')) document.getElementById('productModal').classList.remove('show'); });

window.addToCartFromCard = function(btn) {
    const card = btn.closest('.product-card');
    if (!card) return;
    const productId = card.dataset.productId;
    const product = getProductById(productId);
    if (!product) {
        console.error("Produit non trouvé pour l'ID:", productId);
        return;
    }
    addToCart(product);
    btn.innerHTML = '<i class="fas fa-check"></i> Ajouté !';
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-cart-plus"></i> Ajouter'; }, 1500);
};

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountElements = document.querySelectorAll('#cartCountSidebar, #cartCountFixed');
    cartCountElements.forEach(el => { if (el) el.innerText = count; });
}

function navigateToPanier() { window.location.href = 'panier.html'; }
document.getElementById('sidebarCartBtn')?.addEventListener('click', navigateToPanier);
document.getElementById('fixedCartBtn')?.addEventListener('click', navigateToPanier);
document.getElementById('assistantNavBtn')?.addEventListener('click', () => { window.location.href = 'assistant.html'; });
updateCartCount();

// Search Panel Logic
const searchPanel = document.getElementById('searchPanel');
const openSearchBtn = document.getElementById('openSearchBtn');
const closeSearchPanel = document.getElementById('closeSearchPanel');
const globalSearchInput = document.getElementById('globalSearchInput');
const globalSearchSubmit = document.getElementById('globalSearchSubmit');
const searchResultsDiv = document.getElementById('searchResults');

function performSearch() {
    const term = globalSearchInput.value.toLowerCase().trim();
    if (!term) { searchResultsDiv.innerHTML = '<div class="no-results">🔍 Entrez un terme de recherche</div>'; return; }
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term) || (p.category && p.category.toLowerCase().includes(term)));
    if (filtered.length === 0) { searchResultsDiv.innerHTML = '<div class="no-results">😕 Aucun produit trouvé pour "' + escapeHtml(term) + '"</div>'; return; }
    searchResultsDiv.innerHTML = filtered.map(p => `
        <div class="search-result-item" data-product-id="${p.firebaseId}">
            <img src="${p.imageUrl}" onerror="this.src='https://via.placeholder.com/50'">
            <div class="info"><div class="name">${escapeHtml(p.name)}</div><div class="price">${p.price} DT</div></div>
            <i class="fas fa-arrow-right" style="color: var(--primary);"></i>
        </div>
    `).join('');
    document.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const productId = item.dataset.productId;
            const product = getProductById(productId);
            if (product) {
                searchPanel.classList.remove('active');
                showProductModal(product);
            }
        });
    });
}

openSearchBtn?.addEventListener('click', () => { searchPanel.classList.add('active'); globalSearchInput.focus(); });
closeSearchPanel?.addEventListener('click', () => searchPanel.classList.remove('active'));
globalSearchSubmit?.addEventListener('click', performSearch);
globalSearchInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
searchPanel?.addEventListener('click', (e) => { if (e.target === searchPanel) searchPanel.classList.remove('active'); });

// Ads
const adsRef = ref(db, 'ads');
onValue(adsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const now = Date.now();
        let activeAd = null;
        for (let key in data) { if (data[key].expireTime > now) { activeAd = data[key]; break; } }
        if (activeAd) showAd(activeAd);
    }
});

function showAd(ad) {
    const overlay = document.getElementById('adOverlay');
    document.getElementById('adImage').src = ad.imageUrl || ad.image;
    document.getElementById('adTitle').innerText = ad.title;
    document.getElementById('adDesc').innerText = ad.desc;
    document.getElementById('newPrice').innerHTML = ad.price;
    document.getElementById('adBadge').innerText = ad.qty || 'Offre limitée';
    if (ad.oldPrice) {
        document.getElementById('oldPriceDiv').style.display = 'flex';
        document.getElementById('oldPrice').innerText = ad.oldPrice + ' DT';
    } else { document.getElementById('oldPriceDiv').style.display = 'none'; }
    overlay.style.display = 'flex';
    setTimeout(() => { overlay.style.display = 'none'; }, 10000);
}
document.getElementById('closeAdBtn')?.addEventListener('click', () => { document.getElementById('adOverlay').style.display = 'none'; });

// Category filter & navigation
function scrollToProductsTop() {
    window.scrollTo({ top: 0, behavior: 'auto' });
}

function filterAndShowProductsByCategory(categoryName) {
    scrollToProductsTop();
    document.getElementById('productsFullPage').classList.add('active');
    document.getElementById('mainProductsSection').style.display = 'none';
    document.getElementById('homeSection').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'none';
    
    const filtered = allProducts.filter(p => p.category === categoryName);
    const container = document.getElementById('productsFullGrid');
    
    if (filtered.length) {
        container.innerHTML = filtered.map(product => generateProductCard(product)).join('');
        attachProductClickEvents();
    } else {
        container.innerHTML = `<div style="text-align: center; padding: 40px;">Aucun produit dans la catégorie "${categoryName}"</div>`;
    }
}

document.querySelectorAll('.category-card').forEach(cat => {
    cat.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const categoryName = this.querySelector('.category-name')?.innerText || this.dataset.category;
        if (categoryName) {
            filterAndShowProductsByCategory(categoryName);
        }
    });
});

document.getElementById('discoverBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    scrollToProductsTop();
    document.getElementById('productsFullPage').classList.add('active');
    document.getElementById('mainProductsSection').style.display = 'none';
    document.getElementById('homeSection').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'none';
    renderFullProducts();
});

document.getElementById('viewAllBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    scrollToProductsTop();
    document.getElementById('productsFullPage').classList.add('active');
    document.getElementById('mainProductsSection').style.display = 'none';
    document.getElementById('homeSection').style.display = 'none';
    document.querySelector('.categories-section').style.display = 'none';
    renderFullProducts();
});

document.getElementById('backToHomeBtn')?.addEventListener('click', function(e) {
    e.preventDefault();
    document.getElementById('productsFullPage').classList.remove('active');
    document.getElementById('mainProductsSection').style.display = 'block';
    document.getElementById('homeSection').style.display = 'block';
    document.querySelector('.categories-section').style.display = 'block';
    renderMainProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Sidebar
const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const closeSidebarBtn = document.getElementById('closeSidebar');
function closeSidebarFunc() { sidebar.classList.remove('open'); }
menuToggle?.addEventListener('click', () => sidebar.classList.add('open'));
closeSidebarBtn?.addEventListener('click', closeSidebarFunc);
document.addEventListener('click', (e) => { if (!sidebar.contains(e.target) && !menuToggle.contains(e.target) && sidebar.classList.contains('open')) closeSidebarFunc(); });

document.querySelectorAll('.nav-item').forEach(item => {
    if (item.id === 'sidebarCartBtn' || item.id === 'assistantNavBtn') return;
    item.addEventListener('click', function(e) {
        e.preventDefault();
        const section = this.dataset.section;
        if (section === 'home') {
            document.getElementById('productsFullPage').classList.remove('active');
            document.getElementById('mainProductsSection').style.display = 'block';
            document.getElementById('homeSection').style.display = 'block';
            document.querySelector('.categories-section').style.display = 'block';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (section === 'products-full-page') {
            scrollToProductsTop();
            document.getElementById('productsFullPage').classList.add('active');
            document.getElementById('mainProductsSection').style.display = 'none';
            document.getElementById('homeSection').style.display = 'none';
            document.querySelector('.categories-section').style.display = 'none';
            renderFullProducts();
        } else if (section === 'contact') { 
            document.getElementById('contactSection').scrollIntoView({ behavior: 'smooth' }); 
        }
        closeSidebarFunc();
    });
});

// ============================================================
// تعديل وإصلاح منطق الثيم (الوضع النهاري والليلي المتزامن ومستمر الحفظ)
// ============================================================
function applyTheme(theme) {
    const themeToggle = document.getElementById('themeToggle');
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-theme');
        if (themeToggle) themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// فحص وتطبيق الثيم المحفوظ عند فتح الصفحة مباشرة
const savedTheme = localStorage.getItem('kef-theme') || 'light';
applyTheme(savedTheme);

// عند الضغط على زر التغيير يتم الحفظ في الـ localStorage لتستجيب بقية الصفحات
document.getElementById('themeToggle')?.addEventListener('click', () => {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
    localStorage.setItem('kef-theme', currentTheme);
    applyTheme(currentTheme);
});

// استماع للتغييرات إذا قام المستخدم بتعديله من صفحة أخرى بنفس الوقت
window.addEventListener('storage', (e) => {
    if (e.key === 'kef-theme') {
        applyTheme(e.newValue);
    }
});

// Category Scroll
const categoriesGrid = document.getElementById('categoriesGrid');
const scrollLeftBtn = document.getElementById('scrollLeftBtn');
const scrollRightBtn = document.getElementById('scrollRightBtn');
const scrollIndicator = document.getElementById('scrollIndicator');

function updateScrollIndicator() {
    if (!categoriesGrid || !scrollIndicator) return;
    const scrollWidth = categoriesGrid.scrollWidth - categoriesGrid.clientWidth;
    const scrollLeft = categoriesGrid.scrollLeft;
    const progress = scrollWidth > 0 ? (scrollLeft / scrollWidth) : 0;
    const dots = scrollIndicator.querySelectorAll('.scroll-dot');
    const dotIndex = Math.round(progress * (dots.length - 1));
    dots.forEach((dot, index) => { if (index === dotIndex) dot.classList.add('active'); else dot.classList.remove('active'); });
}
function createScrollDots() {
    if (!categoriesGrid || !scrollIndicator) return;
    const itemCount = categoriesGrid.children.length;
    scrollIndicator.innerHTML = '';
    for (let i = 0; i < itemCount; i++) {
        const dot = document.createElement('div');
        dot.classList.add('scroll-dot');
        if (i === 0) dot.classList.add('active');
        dot.addEventListener('click', () => { categoriesGrid.scrollTo({ left: categoriesGrid.children[i].offsetLeft - categoriesGrid.offsetLeft, behavior: 'smooth' }); });
        scrollIndicator.appendChild(dot);
    }
}
if (scrollLeftBtn && scrollRightBtn && categoriesGrid) {
    scrollLeftBtn.addEventListener('click', () => categoriesGrid.scrollBy({ left: -250, behavior: 'smooth' }));
    scrollRightBtn.addEventListener('click', () => categoriesGrid.scrollBy({ left: 250, behavior: 'smooth' }));
    categoriesGrid.addEventListener('scroll', updateScrollIndicator);
    createScrollDots();
    updateScrollIndicator();
    window.addEventListener('resize', () => { createScrollDots(); updateScrollIndicator(); });
}

// Welcome Slideshow
(function initWelcomeSlideshow() {
    const slides = document.querySelectorAll('#welcomeSlideshow .welcome-slide');
    if (slides.length === 0) return;
    let currentIndex = 0;
    slides[currentIndex].classList.add('active');
    setInterval(function() {
        slides[currentIndex].classList.remove('active');
        currentIndex = (currentIndex + 1) % slides.length;
        slides[currentIndex].classList.add('active');
    }, 3000);
})();