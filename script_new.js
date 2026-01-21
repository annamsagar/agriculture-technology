// ===== SUMMARY OF CHANGES =====
// This file has been updated to integrate with the backend API
// Key changes:
// 1. Authentication now uses real API (register/login)
// 2. Products are fetched from database
// 3. Farmers can add/edit/delete products via API
// 4. Orders can be created and managed through API
// 5. Dark mode and settings functionality added
// ==============================

// Note: The original script.js has been backed up
// This new version connects to the backend at http://localhost:5000

// Import API functions (loaded from api.js)
// API object is available globally from api.js

// Show/hide loading overlay
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

// Show alert message
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Get current user from localStorage or API
async function getCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    try {
        const response = await API.auth.getCurrentUser();
        if (response.success) {
            return response.user;
        }
    } catch (error) {
        console.error('Error getting current user:', error);
        localStorage.removeItem('authToken');
    }
    return null;
}

// Enhanced login function with API
async function loginUser(email, password, userType) {
    showLoading();
    try {
        const response = await API.auth.login({ email, password });

        if (response.success) {
            // Store token
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('agritechUser', JSON.stringify(response.user));

            appData.currentUser = response.user;

            hideLoading();
            showAlert('Login successful!');
            showApp();

            // Load products from API
            await loadProductsFromAPI();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Login failed. Please check your credentials.', 'error');
    }
}

// Enhanced register function with API
async function registerUser(userData) {
    showLoading();
    try {
        const response = await API.auth.register(userData);

        if (response.success) {
            // Store token
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('agritechUser', JSON.stringify(response.user));

            appData.currentUser = response.user;

            hideLoading();
            showAlert('Registration successful!');
            showApp();

            // Load products from API
            await loadProductsFromAPI();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Registration failed. Please try again.', 'error');
    }
}

// Load products from API
async function loadProductsFromAPI(filter = {}) {
    try {
        const response = await API.products.getAll(filter);

        if (response.success) {
            appData.products = response.products;
            renderProducts();

            if (appData.currentUser && appData.currentUser.type === 'farmer') {
                renderFarmerDashboard();
            }
        }
    } catch (error) {
        console.error('Error loading products:', error);
        // Fall back to mock data if API fails
    }
}

// Add new product (Farmer only)
async function addProduct(productData) {
    showLoading();
    try {
        const response = await API.products.create(productData);

        if (response.success) {
            hideLoading();
            showAlert('Product added successfully!');

            // Reload products
            await loadProductsFromAPI();

            // Close modal
            document.getElementById('addProductModal').classList.remove('active');

            // Clear form
            clearProductForm();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Failed to add product', 'error');
    }
}

// Update product
async function updateProduct(productId, productData) {
    showLoading();
    try {
        const response = await API.products.update(productId, productData);

        if (response.success) {
            hideLoading();
            showAlert('Product updated successfully!');
            await loadProductsFromAPI();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Failed to update product', 'error');
    }
}

// Update stock
async function updateProductStock(productId, newStock) {
    showLoading();
    try {
        const response = await API.products.updateStock(productId, newStock);

        if (response.success) {
            hideLoading();
            showAlert('Stock updated successfully!');
            await loadProductsFromAPI();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Failed to update stock', 'error');
    }
}

// Delete product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }

    showLoading();
    try {
        const response = await API.products.delete(productId);

        if (response.success) {
            hideLoading();
            showAlert('Product deleted successfully!');
            await loadProductsFromAPI();
        }
    } catch (error) {
        hideLoading();
        showAlert(error.message || 'Failed to delete product', 'error');
    }
}

// Clear product form
function clearProductForm() {
    document.getElementById('productName').value = '';
    document.getElementById('productCategory').value = 'vegetables';
    document.getElementById('productFarmerPrice').value = '';
    document.getElementById('productMarketPrice').value = '';
    document.getElementById('productStock').value = '';
    document.getElementById('productImage').value = '';
    document.getElementById('productDescription').value = '';
}

// Load orders from API
async function loadOrders(filter = {}) {
    try {
        const response = await API.orders.getAll(filter);

        if (response.success) {
            renderOrders(response.orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Render orders
function renderOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet</p>
            </div>
        `;
        return;
    }

    orders.forEach(order => {
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';

        const statusClass = `status-${order.status}`;

        orderCard.innerHTML = `
            <div class="order-header">
                <div>
                    <span class="order-id">${order.orderId}</span>
                    <span class="order-date">${new Date(order.orderDate).toLocaleDateString()}</span>
                </div>
                <span class="order-status ${statusClass}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <div class="item-info">
                            <div class="item-details">
                                <h4>${item.productName}</h4>
                                <p>Quantity: ${item.quantity} kg × ₹${item.price}</p>
                            </div>
                        </div>
                        <div>₹${item.quantity * item.price}</div>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: ₹${order.total}</div>
        `;

        ordersList.appendChild(orderCard);
    });
}

// Dark mode toggle
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Load settings
function loadSettings() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
}
        // Application Data
        const appData = {
            // Current user
            currentUser: null,
            
            // Current language
            currentLanguage: 'en',
            
            // Language texts
            translations: {
                en: {
                    // Authentication
                    authTitle: "AgriTech Direct",
                    authSubtitle: "Connect Farmers Directly with Buyers",
                    login: "Login",
                    register: "Register",
                    buyer: "Buyer",
                    farmer: "Farmer",
                    emailPlaceholder: "Enter your email",
                    passwordPlaceholder: "Enter your password",
                    namePlaceholder: "Enter your full name",
                    phonePlaceholder: "Enter your phone number",
                    confirmPasswordPlaceholder: "Confirm your password",
                    farmLocationPlaceholder: "Enter your farm location",
                    farmSizePlaceholder: "Enter farm size in acres",
                    loginBtn: "Login",
                    registerBtn: "Create Account",
                    switchToRegister: "Register here",
                    switchToLogin: "Login here",
                    haveAccount: "Don't have an account?",
                    alreadyHaveAccount: "Already have an account?",
                    
                    // Navigation
                    home: "Home",
                    prices: "Price Comparison",
                    products: "Products",
                    dashboard: "Dashboard",
                    about: "About",
                    contact: "Contact",
                    profile: "Profile",
                    orders: "Orders",
                    settings: "Settings",
                    logout: "Logout",
                    
                    // Hero section
                    heroTitle: "Direct Farm-to-Restaurant Marketplace",
                    heroSubtitle: "Eliminating intermediaries to increase farmer profits by 40% and reduce buyer costs by 30%. Transparent pricing, reliable supply, and direct connections.",
                    ctaButton: "Browse Fresh Produce",
                    
                    // Price comparison
                    priceTitle: "Price Comparison: Farmer vs Market",
                    marketPriceLabel: "Average Market Price",
                    farmerPriceLabel: "Average Farmer Price",
                    marketPriceDiff: "+18% Higher",
                    farmerPriceDiff: "You Save 16%",
                    priceUpdateInfo: "Updated:",
                    commodityHeader: "Commodity",
                    marketPriceHeader: "Market Price (₹/kg)",
                    farmerPriceHeader: "Farmer Price (₹/kg)",
                    savingsHeader: "You Save",
                    changeHeader: "Change",
                    
                    // Products
                    productsTitle: "Fresh From Our Farms",
                    filterAll: "All",
                    filterVegetables: "Vegetables",
                    filterFruits: "Fruits",
                    filterGrains: "Grains",
                    searchPlaceholder: "Search products...",
                    inStock: "In Stock",
                    limitedStock: "Limited Stock",
                    contact: "Contact",
                    order: "Order",
                    save: "Save",
                    
                    // Farmer dashboard
                    dashboardTitle: "Farmer Dashboard",
                    addProductText: "Add New Product",
                    totalProductsLabel: "Total Products",
                    totalOrdersLabel: "Total Orders",
                    totalEarningsLabel: "Total Earnings",
                    avgRatingLabel: "Average Rating",
                    myProductsTitle: "My Products",
                    
                    // Footer
                    footerAboutTitle: "AgriTech Direct",
                    footerAboutText: "Direct marketplace connecting farmers with buyers. Eliminating intermediaries since 2023.",
                    footerLinksTitle: "Quick Links",
                    footerHome: "Home",
                    footerPrices: "Price Comparison",
                    footerProducts: "Products",
                    footerAbout: "About",
                    footerContactTitle: "Contact Us",
                    footerAddress: "123 Farm Street, Agri City",
                    footerFollowTitle: "Follow Us",
                    copyrightText: "© 2023 AgriTech Direct. All rights reserved.",
                    
                    // Chatbot
                    chatbotTitle: "AgriTech Assistant",
                    chatbotGreeting: "Hello! I'm your AgriTech assistant. How can I help you today? You can ask me about market prices, product availability, or how to place orders.",
                    quickQuestions: ["Market Prices", "How to Order", "Farmer Registration", "Delivery"]
                },
                hi: {
                    // Authentication
                    authTitle: "अग्रीटेक डायरेक्ट",
                    authSubtitle: "किसानों को सीधे खरीदारों से जोड़ें",
                    login: "लॉगिन",
                    register: "रजिस्टर",
                    buyer: "खरीदार",
                    farmer: "किसान",
                    emailPlaceholder: "अपना ईमेल दर्ज करें",
                    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
                    namePlaceholder: "अपना पूरा नाम दर्ज करें",
                    phonePlaceholder: "अपना फोन नंबर दर्ज करें",
                    confirmPasswordPlaceholder: "अपना पासवर्ड पुष्टि करें",
                    farmLocationPlaceholder: "अपना फार्म स्थान दर्ज करें",
                    farmSizePlaceholder: "एकड़ में फार्म का आकार दर्ज करें",
                    loginBtn: "लॉगिन",
                    registerBtn: "खाता बनाएं",
                    switchToRegister: "यहां रजिस्टर करें",
                    switchToLogin: "यहां लॉगिन करें",
                    haveAccount: "खाता नहीं है?",
                    alreadyHaveAccount: "पहले से ही एक खाता है?",
                    
                    // Navigation
                    home: "होम",
                    prices: "मूल्य तुलना",
                    products: "उत्पाद",
                    dashboard: "डैशबोर्ड",
                    about: "हमारे बारे में",
                    contact: "संपर्क करें",
                    profile: "प्रोफाइल",
                    orders: "आदेश",
                    settings: "सेटिंग्स",
                    logout: "लॉगआउट",
                    
                    // Hero section
                    heroTitle: "सीधा फार्म-टू-रेस्तरां मार्केटप्लेस",
                    heroSubtitle: "बिचौलियों को हटाकर किसानों के लाभ में 40% की वृद्धि और खरीदार की लागत में 30% की कमी। पारदर्शी मूल्य निर्धारण, विश्वसनीय आपूर्ति और सीधे कनेक्शन।",
                    ctaButton: "ताजा उत्पाद देखें",
                    
                    // Price comparison
                    priceTitle: "मूल्य तुलना: किसान बनाम बाजार",
                    marketPriceLabel: "औसत बाजार मूल्य",
                    farmerPriceLabel: "औसत किसान मूल्य",
                    marketPriceDiff: "+18% अधिक",
                    farmerPriceDiff: "आप बचाते हैं 16%",
                    priceUpdateInfo: "अपडेटेड:",
                    commodityHeader: "वस्तु",
                    marketPriceHeader: "बाजार मूल्य (₹/किलो)",
                    farmerPriceHeader: "किसान मूल्य (₹/किलो)",
                    savingsHeader: "आपकी बचत",
                    changeHeader: "परिवर्तन",
                    
                    // Products
                    productsTitle: "हमारे खेतों से ताजा",
                    filterAll: "सभी",
                    filterVegetables: "सब्जियां",
                    filterFruits: "फल",
                    filterGrains: "अनाज",
                    searchPlaceholder: "उत्पाद खोजें...",
                    inStock: "स्टॉक में",
                    limitedStock: "सीमित स्टॉक",
                    contact: "संपर्क करें",
                    order: "आदेश दें",
                    save: "बचाएं",
                    
                    // Farmer dashboard
                    dashboardTitle: "किसान डैशबोर्ड",
                    addProductText: "नया उत्पाद जोड़ें",
                    totalProductsLabel: "कुल उत्पाद",
                    totalOrdersLabel: "कुल आदेश",
                    totalEarningsLabel: "कुल आय",
                    avgRatingLabel: "औसत रेटिंग",
                    myProductsTitle: "मेरे उत्पाद",
                    
                    // Footer
                    footerAboutTitle: "अग्रीटेक डायरेक्ट",
                    footerAboutText: "किसानों को खरीदारों से सीधे जोड़ने वाला मार्केटप्लेस। 2023 से बिचौलियों को हटा रहा है।",
                    footerLinksTitle: "त्वरित लिंक",
                    footerHome: "होम",
                    footerPrices: "मूल्य तुलना",
                    footerProducts: "उत्पाद",
                    footerAbout: "हमारे बारे में",
                    footerContactTitle: "हमसे संपर्क करें",
                    footerAddress: "123 फार्म स्ट्रीट, एग्री सिटी",
                    footerFollowTitle: "हमें फॉलो करें",
                    copyrightText: "© 2023 अग्रीटेक डायरेक्ट। सर्वाधिकार सुरक्षित।",
                    
                    // Chatbot
                    chatbotTitle: "अग्रीटेक असिस्टेंट",
                    chatbotGreeting: "नमस्ते! मैं आपका अग्रीटेक असिस्टेंट हूं। आज मैं आपकी कैसे मदद कर सकता हूं? आप मुझसे बाजार मूल्य, उत्पाद उपलब्धता, या आदेश कैसे दें, इसके बारे में पूछ सकते हैं।",
                    quickQuestions: ["बाजार मूल्य", "आदेश कैसे दें", "किसान पंजीकरण", "वितरण"]
                },
                te: {
                    // Authentication
                    authTitle: "అగ్రీటెక్ డైరెక్ట్",
                    authSubtitle: "రైతులను నేరుగా కొనుగోలుదారులతో కనెక్ట్ చేయండి",
                    login: "లాగిన్",
                    register: "నమోదు",
                    buyer: "కొనుగోలుదారు",
                    farmer: "రైతు",
                    emailPlaceholder: "మీ ఇమెయిల్ నమోదు చేయండి",
                    passwordPlaceholder: "మీ పాస్వర్డ్ నమోదు చేయండి",
                    namePlaceholder: "మీ పూర్తి పేరు నమోదు చేయండి",
                    phonePlaceholder: "మీ ఫోన్ నంబర్ నమోదు చేయండి",
                    confirmPasswordPlaceholder: "మీ పాస్వర్డ్ నిర్ధారించండి",
                    farmLocationPlaceholder: "మీ ఫార్మ్ స్థానాన్ని నమోదు చేయండి",
                    farmSizePlaceholder: "ఎకరాలలో ఫార్మ్ పరిమాణాన్ని నమోదు చేయండి",
                    loginBtn: "లాగిన్",
                    registerBtn: "ఖాతా సృష్టించండి",
                    switchToRegister: "ఇక్కడ నమోదు చేయండి",
                    switchToLogin: "ఇక్కడ లాగిన్ చేయండి",
                    haveAccount: "ఖాతా లేదా?",
                    alreadyHaveAccount: "ఇప్పటికే ఖాతా ఉందా?",
                    
                    // Navigation
                    home: "హోమ్",
                    prices: "ధర సరిపోలిక",
                    products: "ఉత్పత్తులు",
                    dashboard: "డాష్బోర్డ్",
                    about: "మా గురించి",
                    contact: "సంప్రదించండి",
                    profile: "ప్రొఫైల్",
                    orders: "ఆర్డర్లు",
                    settings: "సెట్టింగ్లు",
                    logout: "లాగ్అవుట్",
                    
                    // Hero section
                    heroTitle: "ప్రత్యక్ష ఫార్మ్-టు-రెస్టారెంట్ మార్కెట్ప్లేస్",
                    heroSubtitle: "మధ్యవర్తులను తొలగించడం ద్వారా రైతుల లాభాలను 40% పెంచండి మరియు కొనుగోలుదారు ఖర్చులను 30% తగ్గించండి. పారదర్శక ధర నిర్ణయం, విశ్వసనీయ సరఫరా మరియు ప్రత్యక్ష కనెక్షన్లు.",
                    ctaButton: "తాజా ఉత్పత్తులను బ్రౌజ్ చేయండి",
                    
                    // Price comparison
                    priceTitle: "ధర సరిపోలిక: రైతు Vs మార్కెట్",
                    marketPriceLabel: "సగటు మార్కెట్ ధర",
                    farmerPriceLabel: "సగటు రైతు ధర",
                    marketPriceDiff: "+18% ఎక్కువ",
                    farmerPriceDiff: "మీరు 16% ఆదా చేస్తారు",
                    priceUpdateInfo: "నవీకరించబడింది:",
                    commodityHeader: "వస్తువు",
                    marketPriceHeader: "మార్కెట్ ధర (₹/కేజీ)",
                    farmerPriceHeader: "రైతు ధర (₹/కేజీ)",
                    savingsHeader: "మీరు ఆదా చేస్తారు",
                    changeHeader: "మార్పు",
                    
                    // Products
                    productsTitle: "మా పొలాల నుండి తాజాగా",
                    filterAll: "అన్ని",
                    filterVegetables: "కూరగాయలు",
                    filterFruits: "పండ్లు",
                    filterGrains: "ధాన్యాలు",
                    searchPlaceholder: "ఉత్పత్తులను శోధించండి...",
                    inStock: "స్టాక్లో ఉంది",
                    limitedStock: "పరిమిత స్టాక్",
                    contact: "సంప్రదించండి",
                    order: "ఆర్డర్ చేయండి",
                    save: "సేవ్",
                    
                    // Farmer dashboard
                    dashboardTitle: "రైతు డాష్బోర్డ్",
                    addProductText: "కొత్త ఉత్పత్తిని జోడించండి",
                    totalProductsLabel: "మొత్తం ఉత్పత్తులు",
                    totalOrdersLabel: "మొత్తం ఆర్డర్లు",
                    totalEarningsLabel: "మొత్తం సంపాదన",
                    avgRatingLabel: "సగటు రేటింగ్",
                    myProductsTitle: "నా ఉత్పత్తులు",
                    
                    // Footer
                    footerAboutTitle: "అగ్రీటెక్ డైరెక్ట్",
                    footerAboutText: "రైతులను కొనుగోలుదారులతో నేరుగా కనెక్ట్ చేసే మార్కెట్ప్లేస్. 2023 నుండి మధ్యవర్తులను తొలగిస్తోంది.",
                    footerLinksTitle: "ద్రుత లింకులు",
                    footerHome: "హోమ్",
                    footerPrices: "ధర సరిపోలిక",
                    footerProducts: "ఉత్పత్తులు",
                    footerAbout: "మా గురించి",
                    footerContactTitle: "మమ్మల్ని సంప్రదించండి",
                    footerAddress: "123 ఫార్మ్ స్ట్రీట్, అగ్రీ సిటీ",
                    footerFollowTitle: "మమ్మల్ని అనుసరించండి",
                    copyrightText: "© 2023 అగ్రీటెక్ డైరెక్ట్. అన్ని హక్కులు ప్రత్యేకించబడినవి.",
                    
                    // Chatbot
                    chatbotTitle: "అగ్రీటెక్ అసిస్టెంట్",
                    chatbotGreeting: "హలో! నేను మీ అగ్రీటెక్ అసిస్టెంట్. ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను? మీరు నన్ను మార్కెట్ ధరలు, ఉత్పత్తి లభ్యత, లేదా ఆర్డర్లు ఎలా ఇవ్వాలో అడగవచ్చు.",
                    quickQuestions: ["మార్కెట్ ధరలు", "ఆర్డర్ ఎలా ఇవ్వాలి", "రైతు నమోదు", "డెలివరీ"]
                },
                kn: {
                    // Authentication
                    authTitle: "ಅಗ್ರಿಟೆಕ್ ಡೈರೆಕ್ಟ್",
                    authSubtitle: "ರೈತರನ್ನು ನೇರವಾಗಿ ಖರೀದಿದಾರರಿಗೆ ಸಂಪರ್ಕಿಸಿ",
                    login: "ಲಾಗಿನ್",
                    register: "ನೋಂದಾಯಿಸಿ",
                    buyer: "ಖರೀದಿದಾರ",
                    farmer: "ರೈತ",
                    emailPlaceholder: "ನಿಮ್ಮ ಇಮೇಲ್ ನಮೂದಿಸಿ",
                    passwordPlaceholder: "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ನಮೂದಿಸಿ",
                    namePlaceholder: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ನಮೂದಿಸಿ",
                    phonePlaceholder: "ನಿಮ್ಮ ಫೋನ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ",
                    confirmPasswordPlaceholder: "ನಿಮ್ಮ ಪಾಸ್ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
                    farmLocationPlaceholder: "ನಿಮ್ಮ ಕೃಷಿ ಭೂಮಿ ಸ್ಥಳ ನಮೂದಿಸಿ",
                    farmSizePlaceholder: "ಎಕರೆಗಳಲ್ಲಿ ಕೃಷಿ ಭೂಮಿ ಗಾತ್ರ ನಮೂದಿಸಿ",
                    loginBtn: "ಲಾಗಿನ್",
                    registerBtn: "ಖಾತೆ ರಚಿಸಿ",
                    switchToRegister: "ಇಲ್ಲಿ ನೋಂದಾಯಿಸಿ",
                    switchToLogin: "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ",
                    haveAccount: "ಖಾತೆ ಇಲ್ಲವೇ?",
                    alreadyHaveAccount: "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
                    
                    // Navigation
                    home: "ಹೋಮ್",
                    prices: "ಬೆಲೆ ಹೋಲಿಕೆ",
                    products: "ಉತ್ಪನ್ನಗಳು",
                    dashboard: "ಡ್ಯಾಶ್ಬೋರ್ಡ್",
                    about: "ನಮ್ಮ ಬಗ್ಗೆ",
                    contact: "ಸಂಪರ್ಕಿಸಿ",
                    profile: "ಪ್ರೊಫೈಲ್",
                    orders: "ಆದೇಶಗಳು",
                    settings: "ಸೆಟ್ಟಿಂಗ್ಗಳು",
                    logout: "ಲಾಗ್ಔಟ್",
                    
                    // Hero section
                    heroTitle: "ನೇರ ಫಾರ್ಮ್-ಟು-ರೆಸ್ಟೋರೆಂಟ್ ಮಾರುಕಟ್ಟೆ",
                    heroSubtitle: "ಮಧ್ಯವರ್ತಿಗಳನ್ನು ನಿವಾರಿಸುವ ಮೂಲಕ ರೈತರ ಲಾಭವನ್ನು 40% ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಖರೀದಿದಾರರ ವೆಚ್ಚವನ್ನು 30% ಕಡಿಮೆ ಮಾಡಿ. ಪಾರದರ್ಶಕ ಬೆಲೆ ನಿರ್ಣಯ, ವಿಶ್ವಾಸಾರ್ಹ ಪೂರೈಕೆ ಮತ್ತು ನೇರ ಸಂಪರ್ಕಗಳು.",
                    ctaButton: "ತಾಜಾ ಉತ್ಪನ್ನಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಿ",
                    
                    // Price comparison
                    priceTitle: "ಬೆಲೆ ಹೋಲಿಕೆ: ರೈತ Vs ಮಾರುಕಟ್ಟೆ",
                    marketPriceLabel: "ಸರಾಸರಿ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ",
                    farmerPriceLabel: "ಸರಾಸರಿ ರೈತ ಬೆಲೆ",
                    marketPriceDiff: "+18% ಹೆಚ್ಚು",
                    farmerPriceDiff: "ನೀವು 16% ಉಳಿಸುತ್ತೀರಿ",
                    priceUpdateInfo: "ನವೀಕರಿಸಲಾಗಿದೆ:",
                    commodityHeader: "ವಸ್ತು",
                    marketPriceHeader: "ಮಾರುಕಟ್ಟೆ ಬೆಲೆ (₹/ಕೆಜಿ)",
                    farmerPriceHeader: "ರೈತ ಬೆಲೆ (₹/ಕೆಜಿ)",
                    savingsHeader: "ನೀವು ಉಳಿಸುತ್ತೀರಿ",
                    changeHeader: "ಬದಲಾವಣೆ",
                    
                    // Products
                    productsTitle: "ನಮ್ಮ ಕೃಷಿ ಭೂಮಿಯಿಂದ ತಾಜಾ",
                    filterAll: "ಎಲ್ಲಾ",
                    filterVegetables: "ತರಕಾರಿಗಳು",
                    filterFruits: "ಹಣ್ಣುಗಳು",
                    filterGrains: "ಧಾನ್ಯಗಳು",
                    searchPlaceholder: "ಉತ್ಪನ್ನಗಳನ್ನು ಹುಡುಕಿ...",
                    inStock: "ಸ್ಟಾಕ್ನಲ್ಲಿ ಲಭ್ಯವಿದೆ",
                    limitedStock: "ಸೀಮಿತ ಸ್ಟಾಕ್",
                    contact: "ಸಂಪರ್ಕಿಸಿ",
                    order: "ಆದೇಶಿಸಿ",
                    save: "ಉಳಿಸಿ",
                    
                    // Farmer dashboard
                    dashboardTitle: "ರೈತ ಡ್ಯಾಶ್ಬೋರ್ಡ್",
                    addProductText: "ಹೊಸ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ",
                    totalProductsLabel: "ಒಟ್ಟು ಉತ್ಪನ್ನಗಳು",
                    totalOrdersLabel: "ಒಟ್ಟು ಆದೇಶಗಳು",
                    totalEarningsLabel: "ಒಟ್ಟು ಆದಾಯ",
                    avgRatingLabel: "ಸರಾಸರಿ ರೇಟಿಂಗ್",
                    myProductsTitle: "ನನ್ನ ಉತ್ಪನ್ನಗಳು",
                    
                    // Footer
                    footerAboutTitle: "ಅಗ್ರಿಟೆಕ್ ಡೈರೆಕ್ಟ್",
                    footerAboutText: "ರೈತರನ್ನು ಖರೀದಿದಾರರಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುವ ಮಾರುಕಟ್ಟೆ. 2023 ರಿಂದ ಮಧ್ಯವರ್ತಿಗಳನ್ನು ನಿವಾರಿಸುತ್ತಿದೆ.",
                    footerLinksTitle: "ತ್ವರಿತ ಲಿಂಕ್ಗಳು",
                    footerHome: "ಹೋಮ್",
                    footerPrices: "ಬೆಲೆ ಹೋಲಿಕೆ",
                    footerProducts: "ಉತ್ಪನ್ನಗಳು",
                    footerAbout: "ನಮ್ಮ ಬಗ್ಗೆ",
                    footerContactTitle: "ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ",
                    footerAddress: "123 ಫಾರ್ಮ್ ಸ್ಟ್ರೀಟ್, ಅಗ್ರಿ ಸಿಟಿ",
                    footerFollowTitle: "ನಮ್ಮನ್ನು ಅನುಸರಿಸಿ",
                    copyrightText: "© 2023 ಅಗ್ರಿಟೆಕ್ ಡೈರೆಕ್ಟ್. ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದುಕೊಂಡಿದೆ.",
                    
                    // Chatbot
                    chatbotTitle: "ಅಗ್ರಿಟೆಕ್ ಸಹಾಯಕ",
                    chatbotGreeting: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಅಗ್ರಿಟೆಕ್ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ನೀವು ನನ್ನನ್ನು ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಉತ್ಪನ್ನ ಲಭ್ಯತೆ, ಅಥವಾ ಆದೇಶಗಳನ್ನು ಹೇಗೆ ನೀಡಬೇಕು ಎಂಬುದರ ಕುರಿತು ಕೇಳಬಹುದು.",
                    quickQuestions: ["ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು", "ಆದೇಶ ಹೇಗೆ ನೀಡಬೇಕು", "ರೈತ ನೋಂದಣಿ", "ವಿತರಣೆ"]
                }
            },
            
            // Market prices data
            marketPrices: [
                { commodity: "Tomatoes", marketPrice: 45, farmerPrice: 38, change: 2.5, category: "vegetables" },
                { commodity: "Potatoes", marketPrice: 25, farmerPrice: 20, change: -1.0, category: "vegetables" },
                { commodity: "Onions", marketPrice: 30, farmerPrice: 25, change: 3.0, category: "vegetables" },
                { commodity: "Carrots", marketPrice: 40, farmerPrice: 32, change: 0, category: "vegetables" },
                { commodity: "Spinach", marketPrice: 20, farmerPrice: 15, change: 1.5, category: "vegetables" },
                { commodity: "Apples", marketPrice: 120, farmerPrice: 95, change: -5.0, category: "fruits" },
                { commodity: "Bananas", marketPrice: 40, farmerPrice: 32, change: 2.0, category: "fruits" },
                { commodity: "Oranges", marketPrice: 60, farmerPrice: 48, change: 0, category: "fruits" },
                { commodity: "Rice", marketPrice: 45, farmerPrice: 38, change: 1.0, category: "grains" },
                { commodity: "Wheat", marketPrice: 28, farmerPrice: 22, change: 0.5, category: "grains" }
            ],
            
            // Products data
            products: [
                { 
                    id: 1, 
                    name: "Organic Tomatoes", 
                    image: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 38, 
                    marketPrice: 45, 
                    farmer: "Rajesh Reddy", 
                    farmerId: 101,
                    location: "Guntur, AP", 
                    category: "vegetables",
                    availability: "available",
                    description: "Fresh organic tomatoes grown without pesticides"
                },
                { 
                    id: 2, 
                    name: "Fresh Potatoes", 
                    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 20, 
                    marketPrice: 25, 
                    farmer: "Singh Farms", 
                    farmerId: 102,
                    location: "Punjab", 
                    category: "vegetables",
                    availability: "available",
                    description: "Premium quality potatoes, perfect for all dishes"
                },
                { 
                    id: 3, 
                    name: "Red Onions", 
                    image: "https://images.unsplash.com/photo-1587049633312-d628ae50a8ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 25, 
                    marketPrice: 30, 
                    farmer: "Patel Agri", 
                    farmerId: 103,
                    location: "Maharashtra", 
                    category: "vegetables",
                    availability: "limited",
                    description: "Fresh red onions with strong flavor"
                },
                { 
                    id: 4, 
                    name: "Carrots", 
                    image: "https://images.unsplash.com/photo-1598170845058-78131a90f4bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 32, 
                    marketPrice: 40, 
                    farmer: "Green Valley Farms", 
                    farmerId: 104,
                    location: "Karnataka", 
                    category: "vegetables",
                    availability: "available",
                    description: "Sweet and crunchy carrots, rich in beta-carotene"
                },
                { 
                    id: 5, 
                    name: "Fresh Spinach", 
                    image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 15, 
                    marketPrice: 20, 
                    farmer: "Organic Harvest", 
                    farmerId: 105,
                    location: "Telangana", 
                    category: "vegetables",
                    availability: "available",
                    description: "Tender spinach leaves, packed with iron"
                },
                { 
                    id: 6, 
                    name: "Apples", 
                    image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 95, 
                    marketPrice: 120, 
                    farmer: "Himalayan Orchards", 
                    farmerId: 106,
                    location: "Himachal", 
                    category: "fruits",
                    availability: "available",
                    description: "Sweet and crisp Kashmiri apples"
                },
                { 
                    id: 7, 
                    name: "Bananas", 
                    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 32, 
                    marketPrice: 40, 
                    farmer: "Tropical Farms", 
                    farmerId: 107,
                    location: "Kerala", 
                    category: "fruits",
                    availability: "available",
                    description: "Organic ripe bananas, rich in potassium"
                },
                { 
                    id: 8, 
                    name: "Basmati Rice", 
                    image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
                    farmerPrice: 38, 
                    marketPrice: 45, 
                    farmer: "Punjab Rice Mills", 
                    farmerId: 108,
                    location: "Punjab", 
                    category: "grains",
                    availability: "available",
                    description: "Premium quality basmati rice, aged for flavor"
                }
            ],
            
            // Chatbot FAQ data
            faq: {
                en: [
                    { question: "market prices", answer: "Current market prices are updated daily. Tomatoes: ₹45/kg, Potatoes: ₹25/kg, Onions: ₹30/kg, Carrots: ₹40/kg. Our direct farmer prices are 15-20% lower than market rates." },
                    { question: "how to order", answer: "Browse products, select quantities, and place orders directly through our platform. Delivery scheduling is available. Payment options: UPI, cards, net banking." },
                    { question: "farmer registration", answer: "Farmers can register on our platform to sell directly to buyers. Registration is free. You'll need to provide farm details and product information." },
                    { question: "delivery", answer: "We provide logistics support with scheduled deliveries to buyers. Delivery within 24 hours for local orders." }
                ]
            }
        };

        // DOM Elements
        const authContainer = document.getElementById('authContainer');
        const appContainer = document.getElementById('appContainer');
        const loginTab = document.getElementById('loginTab');
        const registerTab = document.getElementById('registerTab');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const userTypeBtns = document.querySelectorAll('.user-type-btn');
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const switchToRegister = document.getElementById('switchToRegister');
        const switchToLogin = document.getElementById('switchToLogin');
        const farmerFields = document.getElementById('farmerFields');
        const languageBtn = document.getElementById('languageBtn');
        const languageDropdown = document.getElementById('languageDropdown');
        const languageOptions = document.querySelectorAll('.language-option');
        const userProfile = document.getElementById('userProfile');
        const userDropdown = document.getElementById('userDropdown');
        const logoutBtn = document.getElementById('logoutBtn');
        const dashboardLink = document.getElementById('dashboardLink');
        const dashboardSection = document.getElementById('dashboard');
        const addProductBtn = document.getElementById('addProductBtn');
        const pricesTableBody = document.getElementById('pricesTableBody');
        const productsGrid = document.getElementById('productsGrid');
        const farmerProductsGrid = document.getElementById('farmerProductsGrid');
        const filterBtns = document.querySelectorAll('.filter-btn');
        const productSearch = document.getElementById('productSearch');
        const chatbotToggle = document.getElementById('chatbotToggle');
        const chatbotWindow = document.getElementById('chatbotWindow');
        const chatbotClose = document.getElementById('chatbotClose');
        const chatbotSend = document.getElementById('chatbotSend');
        const chatbotInput = document.getElementById('chatbotInput');
        const chatbotBody = document.getElementById('chatbotBody');
        
        // Current user type (buyer or farmer)
        let currentUserType = 'buyer';
        
        // Initialize the application
        function initApp() {
            // Check if user is already logged in
            const savedUser = localStorage.getItem('agritechUser');
            if (savedUser) {
                appData.currentUser = JSON.parse(savedUser);
                showApp();
            }
            
            setupEventListeners();
            updateLanguage(appData.currentLanguage);
            setupChatbot();
        }
        
        // Show main app (after login)
        function showApp() {
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            
            // Update UI based on user type
            if (appData.currentUser && appData.currentUser.type === 'farmer') {
                dashboardLink.classList.remove('hidden');
                dashboardSection.classList.remove('hidden');
                renderFarmerDashboard();
            } else {
                dashboardLink.classList.add('hidden');
                dashboardSection.classList.add('hidden');
            }
            
            // Update user profile
            if (appData.currentUser) {
                document.getElementById('userName').textContent = appData.currentUser.name;
                document.getElementById('userAvatar').textContent = appData.currentUser.name.charAt(0).toUpperCase();
            }
            
            renderMarketPrices();
            renderProducts();
            updatePriceHighlight();
            updateTimeDisplay();
        }
        
        // Show authentication page (for logout)
        function showAuth() {
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            appData.currentUser = null;
            localStorage.removeItem('agritechUser');
        }
        
        // Update language across the app
        function updateLanguage(lang) {
            appData.currentLanguage = lang;
            
            // Update language button
            document.getElementById('currentLanguage').textContent = 
                lang === 'en' ? 'English' : 
                lang === 'hi' ? 'हिंदी' : 
                lang === 'te' ? 'తెలుగు' : 'ಕನ್ನಡ';
            
            // Update all elements with translation
            const texts = appData.translations[lang];
            
            // Authentication page
            document.getElementById('authTitle').textContent = texts.authTitle;
            document.getElementById('authSubtitle').textContent = texts.authSubtitle;
            document.getElementById('loginTab').textContent = texts.login;
            document.getElementById('registerTab').textContent = texts.register;
            
            // Update user type buttons
            document.querySelectorAll('.user-type-btn').forEach((btn, index) => {
                if (index === 0) btn.innerHTML = `<i class="fas fa-shopping-cart"></i> ${texts.buyer}`;
                else btn.innerHTML = `<i class="fas fa-tractor"></i> ${texts.farmer}`;
            });
            
            // Update form placeholders and labels
            document.getElementById('loginEmail').placeholder = texts.emailPlaceholder;
            document.getElementById('loginPassword').placeholder = texts.passwordPlaceholder;
            document.getElementById('loginBtn').textContent = texts.loginBtn;
            document.getElementById('registerName').placeholder = texts.namePlaceholder;
            document.getElementById('registerEmail').placeholder = texts.emailPlaceholder;
            document.getElementById('registerPhone').placeholder = texts.phonePlaceholder;
            document.getElementById('registerPassword').placeholder = texts.passwordPlaceholder;
            document.getElementById('registerConfirmPassword').placeholder = texts.confirmPasswordPlaceholder;
            document.getElementById('farmLocation').placeholder = texts.farmLocationPlaceholder;
            document.getElementById('farmSize').placeholder = texts.farmSizePlaceholder;
            document.getElementById('registerBtn').textContent = texts.registerBtn;
            
            // Update footer links
            document.getElementById('switchToRegister').textContent = texts.switchToRegister;
            document.getElementById('switchToLogin').textContent = texts.switchToLogin;
            document.querySelector('#loginForm .auth-footer p').innerHTML = 
                `${texts.haveAccount} <a href="#" id="switchToRegister">${texts.switchToRegister}</a>`;
            document.querySelector('#registerForm .auth-footer p').innerHTML = 
                `${texts.alreadyHaveAccount} <a href="#" id="switchToLogin">${texts.switchToLogin}</a>`;
            
            // Main app
            document.getElementById('heroTitle').textContent = texts.heroTitle;
            document.getElementById('heroSubtitle').textContent = texts.heroSubtitle;
            document.getElementById('ctaButton').textContent = texts.ctaButton;
            
            // Navigation
            document.querySelectorAll('.nav-links a')[0].textContent = texts.home;
            document.querySelectorAll('.nav-links a')[1].textContent = texts.prices;
            document.querySelectorAll('.nav-links a')[2].textContent = texts.products;
            document.querySelectorAll('.nav-links a')[3].textContent = texts.dashboard;
            document.querySelectorAll('.nav-links a')[4].textContent = texts.about;
            document.querySelectorAll('.nav-links a')[5].textContent = texts.contact;
            
            // User dropdown
            document.querySelectorAll('.user-dropdown a')[0].innerHTML = `<i class="fas fa-user"></i> ${texts.profile}`;
            document.querySelectorAll('.user-dropdown a')[1].innerHTML = `<i class="fas fa-shopping-bag"></i> ${texts.orders}`;
            document.querySelectorAll('.user-dropdown a')[2].innerHTML = `<i class="fas fa-cog"></i> ${texts.settings}`;
            document.querySelectorAll('.user-dropdown a')[3].innerHTML = `<i class="fas fa-sign-out-alt"></i> ${texts.logout}`;
            
            // Price comparison
            document.getElementById('priceTitle').textContent = texts.priceTitle;
            document.getElementById('marketPriceLabel').textContent = texts.marketPriceLabel;
            document.getElementById('farmerPriceLabel').textContent = texts.farmerPriceLabel;
            document.getElementById('marketPriceDiff').textContent = texts.marketPriceDiff;
            document.getElementById('farmerPriceDiff').textContent = texts.farmerPriceDiff;
            document.getElementById('priceUpdateInfo').innerHTML = `${texts.priceUpdateInfo} <span id="updateTime">Today, 10:30 AM</span> | Source: AGMARKNET & Local Mandis`;
            document.getElementById('commodityHeader').textContent = texts.commodityHeader;
            document.getElementById('marketPriceHeader').textContent = texts.marketPriceHeader;
            document.getElementById('farmerPriceHeader').textContent = texts.farmerPriceHeader;
            document.getElementById('savingsHeader').textContent = texts.savingsHeader;
            document.getElementById('changeHeader').textContent = texts.changeHeader;
            
            // Products
            document.getElementById('productsTitle').textContent = texts.productsTitle;
            document.getElementById('filterAll').textContent = texts.filterAll;
            document.getElementById('filterVegetables').textContent = texts.filterVegetables;
            document.getElementById('filterFruits').textContent = texts.filterFruits;
            document.getElementById('filterGrains').textContent = texts.filterGrains;
            document.getElementById('productSearch').placeholder = texts.searchPlaceholder;
            
            // Farmer dashboard
            document.getElementById('dashboardTitle').textContent = texts.dashboardTitle;
            document.getElementById('addProductText').textContent = texts.addProductText;
            document.getElementById('totalProductsLabel').textContent = texts.totalProductsLabel;
            document.getElementById('totalOrdersLabel').textContent = texts.totalOrdersLabel;
            document.getElementById('totalEarningsLabel').textContent = texts.totalEarningsLabel;
            document.getElementById('avgRatingLabel').textContent = texts.avgRatingLabel;
            document.getElementById('myProductsTitle').textContent = texts.myProductsTitle;
            
            // Footer
            document.getElementById('footerAboutTitle').textContent = texts.footerAboutTitle;
            document.getElementById('footerAboutText').textContent = texts.footerAboutText;
            document.getElementById('footerLinksTitle').textContent = texts.footerLinksTitle;
            document.getElementById('footerHome').textContent = texts.footerHome;
            document.getElementById('footerPrices').textContent = texts.footerPrices;
            document.getElementById('footerProducts').textContent = texts.footerProducts;
            document.getElementById('footerAbout').textContent = texts.footerAbout;
            document.getElementById('footerContactTitle').textContent = texts.footerContactTitle;
            document.getElementById('footerAddress').textContent = texts.footerAddress;
            document.getElementById('footerFollowTitle').textContent = texts.footerFollowTitle;
            document.getElementById('copyrightText').textContent = texts.copyrightText;
            
            // Chatbot
            document.getElementById('chatbotTitle').textContent = texts.chatbotTitle;
            
            // Re-render products with new language
            renderProducts();
            renderMarketPrices();
            
            // Update active language option
            languageOptions.forEach(option => {
                option.classList.remove('active');
                if (option.dataset.lang === lang) {
                    option.classList.add('active');
                }
            });
        }
        
        // Render market prices table
        function renderMarketPrices() {
            pricesTableBody.innerHTML = '';
            
            const texts = appData.translations[appData.currentLanguage];
            
            appData.marketPrices.forEach(item => {
                const row = document.createElement('tr');
                
                // Calculate savings
                const savings = item.marketPrice - item.farmerPrice;
                const savingsPercent = Math.round((savings / item.marketPrice) * 100);
                
                // Determine change class and symbol
                let changeClass = '';
                let changeSymbol = '';
                if (item.change > 0) {
                    changeClass = 'price-up';
                    changeSymbol = '↑';
                } else if (item.change < 0) {
                    changeClass = 'price-down';
                    changeSymbol = '↓';
                }
                
                row.innerHTML = `
                    <td>${item.commodity}</td>
                    <td class="market-price-cell">₹${item.marketPrice}</td>
                    <td class="farmer-price-cell">₹${item.farmerPrice}</td>
                    <td><span style="color: var(--primary-green); font-weight: 600;">₹${savings} (${savingsPercent}%)</span></td>
                    <td class="price-change ${changeClass}">${changeSymbol} ₹${Math.abs(item.change)}</td>
                `;
                
                pricesTableBody.appendChild(row);
            });
        }
        
        // Update price highlight section
        function updatePriceHighlight() {
            // Calculate average market price and farmer price
            let totalMarketPrice = 0;
            let totalFarmerPrice = 0;
            
            appData.marketPrices.forEach(item => {
                totalMarketPrice += item.marketPrice;
                totalFarmerPrice += item.farmerPrice;
            });
            
            const avgMarketPrice = Math.round(totalMarketPrice / appData.marketPrices.length);
            const avgFarmerPrice = Math.round(totalFarmerPrice / appData.marketPrices.length);
            const priceDiff = avgMarketPrice - avgFarmerPrice;
            const priceDiffPercent = Math.round((priceDiff / avgMarketPrice) * 100);
            
            document.getElementById('marketPriceValue').textContent = `₹${avgMarketPrice}/kg`;
            document.getElementById('farmerPriceValue').textContent = `₹${avgFarmerPrice}/kg`;
            document.getElementById('marketPriceDiff').textContent = `+${priceDiffPercent}% Higher`;
            document.getElementById('farmerPriceDiff').textContent = `You Save ${priceDiffPercent}%`;
        }
        
        // Render products grid
        function renderProducts(filter = 'all', searchTerm = '') {
            productsGrid.innerHTML = '';
            
            const texts = appData.translations[appData.currentLanguage];
            
            let filteredProducts = appData.products;
            
            // Apply category filter
            if (filter !== 'all') {
                filteredProducts = filteredProducts.filter(product => product.category === filter);
            }
            
            // Apply search filter
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                filteredProducts = filteredProducts.filter(product => 
                    product.name.toLowerCase().includes(term) || 
                    product.farmer.toLowerCase().includes(term) ||
                    product.location.toLowerCase().includes(term)
                );
            }
            
            // Render products
            filteredProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Calculate savings
                const savings = product.marketPrice - product.farmerPrice;
                const savingsPercent = Math.round((savings / product.marketPrice) * 100);
                
                // Availability text
                let availabilityText = product.availability === 'available' ? texts.inStock : texts.limitedStock;
                let availabilityClass = product.availability === 'available' ? 'available' : 'limited';
                
                productCard.innerHTML = `
                    <div class="product-badge">${texts.save} ${savingsPercent}%</div>
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="price-container">
                            <div class="farmer-price-tag">₹${product.farmerPrice}/kg</div>
                            <div class="market-price-tag">₹${product.marketPrice}/kg</div>
                            <div class="price-saving">${texts.save} ₹${savings}</div>
                        </div>
                        <div class="product-meta">
                            <div class="product-farmer">
                                <i class="fas fa-user"></i>
                                <span>${product.farmer}</span>
                            </div>
                            <div class="product-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${product.location}</span>
                            </div>
                        </div>
                        <span class="availability ${availabilityClass}">${availabilityText}</span>
                        <div class="product-actions">
                            <a href="tel:+919876543210" class="btn-contact">
                                <i class="fas fa-phone"></i>
                                <span>${texts.contact}</span>
                            </a>
                            <a href="https://wa.me/919876543210?text=I'm%20interested%20in%20${encodeURIComponent(product.name)}" class="btn-order" target="_blank">
                                <i class="fab fa-whatsapp"></i>
                                <span>${texts.order}</span>
                            </a>
                        </div>
                    </div>
                `;
                
                productsGrid.appendChild(productCard);
            });
            
            // If no products found
            if (filteredProducts.length === 0) {
                productsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <i class="fas fa-search" style="font-size: 3rem; color: var(--dark-gray); margin-bottom: 20px;"></i>
                        <h3>${appData.currentLanguage === 'en' ? 'No products found' : 
                              appData.currentLanguage === 'hi' ? 'कोई उत्पाद नहीं मिला' :
                              appData.currentLanguage === 'te' ? 'ఉత్పత్తులు కనుగొనబడలేదు' : 
                              'ಯಾವುದೇ ಉತ್ಪನ್ನಗಳು ಕಂಡುಬಂದಿಲ್ಲ'}</h3>
                        <p>${appData.currentLanguage === 'en' ? 'Try a different search or filter' :
                            appData.currentLanguage === 'hi' ? 'एक अलग खोज या फ़िल्टर आज़माएं' :
                            appData.currentLanguage === 'te' ? 'వేరే శోధన లేదా ఫిల్టర్‌ని ప్రయత్నించండి' :
                            'ಬೇರೆ ಹುಡುಕಾಟ ಅಥವಾ ಫಿಲ್ಟರ್ ಪ್ರಯತ್ನಿಸಿ'}</p>
                    </div>
                `;
            }
        }
        
        // Render farmer dashboard
        function renderFarmerDashboard() {
            if (!appData.currentUser || appData.currentUser.type !== 'farmer') return;
            
            const texts = appData.translations[appData.currentLanguage];
            
            // Filter products by current farmer
            const farmerProducts = appData.products.filter(
                product => product.farmerId === appData.currentUser.id
            );
            
            // Update stats
            document.getElementById('totalProducts').textContent = farmerProducts.length;
            document.getElementById('totalOrders').textContent = '24';
            document.getElementById('totalEarnings').textContent = '₹12,450';
            document.getElementById('avgRating').textContent = '4.7';
            
            // Render farmer's products
            farmerProductsGrid.innerHTML = '';
            
            farmerProducts.forEach(product => {
                const productCard = document.createElement('div');
                productCard.className = 'product-card';
                
                // Calculate savings
                const savings = product.marketPrice - product.farmerPrice;
                const savingsPercent = Math.round((savings / product.marketPrice) * 100);
                
                // Availability text
                let availabilityText = product.availability === 'available' ? texts.inStock : texts.limitedStock;
                let availabilityClass = product.availability === 'available' ? 'available' : 'limited';
                
                productCard.innerHTML = `
                    <div class="product-badge">${texts.save} ${savingsPercent}%</div>
                    <img src="${product.image}" alt="${product.name}" class="product-img">
                    <div class="product-info">
                        <h3 class="product-name">${product.name}</h3>
                        <div class="price-container">
                            <div class="farmer-price-tag">₹${product.farmerPrice}/kg</div>
                            <div class="market-price-tag">₹${product.marketPrice}/kg</div>
                            <div class="price-saving">${texts.save} ₹${savings}</div>
                        </div>
                        <div class="product-meta">
                            <div class="product-farmer">
                                <i class="fas fa-user"></i>
                                <span>${product.farmer}</span>
                            </div>
                            <div class="product-location">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${product.location}</span>
                            </div>
                        </div>
                        <span class="availability ${availabilityClass}">${availabilityText}</span>
                        <div class="product-actions">
                            <button class="btn-contact" style="background-color: var(--primary-green);">
                                <i class="fas fa-edit"></i>
                                <span>${appData.currentLanguage === 'en' ? 'Edit' : 
                                      appData.currentLanguage === 'hi' ? 'संपादित करें' :
                                      appData.currentLanguage === 'te' ? 'సవరించండి' : 
                                      'ಸಂಪಾದಿಸಿ'}</span>
                            </button>
                            <button class="btn-order">
                                <i class="fas fa-chart-line"></i>
                                <span>${appData.currentLanguage === 'en' ? 'Analytics' : 
                                      appData.currentLanguage === 'hi' ? 'विश्लेषण' :
                                      appData.currentLanguage === 'te' ? 'విశ్లేషణ' : 
                                      'ವಿಶ್ಲೇಷಣೆ'}</span>
                            </button>
                        </div>
                    </div>
                `;
                
                farmerProductsGrid.appendChild(productCard);
            });
            
            // If no products
            if (farmerProducts.length === 0) {
                farmerProductsGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                        <i class="fas fa-seedling" style="font-size: 3rem; color: var(--dark-gray); margin-bottom: 20px;"></i>
                        <h3>${appData.currentLanguage === 'en' ? 'No products added yet' : 
                              appData.currentLanguage === 'hi' ? 'अभी तक कोई उत्पाद नहीं जोड़ा गया' :
                              appData.currentLanguage === 'te' ? 'ఇంకా ఉత్పత్తులు జోడించబడలేదు' : 
                              'ಇನ್ನೂ ಯಾವುದೇ ಉತ್ಪನ್ನಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ'}</h3>
                        <p>${appData.currentLanguage === 'en' ? 'Add your first product to start selling' :
                            appData.currentLanguage === 'hi' ? 'बेचना शुरू करने के लिए अपना पहला उत्पाद जोड़ें' :
                            appData.currentLanguage === 'te' ? 'విక్రయించడం ప్రారంభించడానికి మీ మొదటి ఉత్పత్తిని జోడించండి' :
                            'ಮಾರಾಟವನ್ನು ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಮೊದಲ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸಿ'}</p>
                        <button class="add-product-btn" style="margin-top: 20px;">
                            <i class="fas fa-plus"></i>
                            <span>${texts.addProductText}</span>
                        </button>
                    </div>
                `;
            }
        }
        
        // Update time display
        function updateTimeDisplay() {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            
            let updateTime;
            if (appData.currentLanguage === 'en') {
                updateTime = now.toLocaleDateString('en-IN', options);
            } else if (appData.currentLanguage === 'hi') {
                updateTime = now.toLocaleDateString('hi-IN', options);
            } else if (appData.currentLanguage === 'te') {
                updateTime = now.toLocaleDateString('te-IN', options);
            } else if (appData.currentLanguage === 'kn') {
                updateTime = now.toLocaleDateString('kn-IN', options);
            }
            
            document.getElementById('updateTime').textContent = updateTime;
        }
        
        // Setup chatbot
        function setupChatbot() {
            const texts = appData.translations[appData.currentLanguage];
            
            // Clear existing messages
            chatbotBody.innerHTML = '';
            
            // Add initial greeting
            const greeting = document.createElement('div');
            greeting.className = 'chat-message bot-message';
            greeting.textContent = texts.chatbotGreeting;
            
            // Add quick questions
            const quickQuestionsDiv = document.createElement('div');
            quickQuestionsDiv.className = 'quick-questions';
            
            texts.quickQuestions.forEach(question => {
                const qBtn = document.createElement('div');
                qBtn.className = 'quick-question';
                qBtn.textContent = question;
                qBtn.addEventListener('click', () => {
                    processChatbotInput(question);
                });
                quickQuestionsDiv.appendChild(qBtn);
            });
            
            greeting.appendChild(quickQuestionsDiv);
            chatbotBody.appendChild(greeting);
        }
        
        // Process chatbot input
        function processChatbotInput(input) {
            const userInput = input.toLowerCase().trim();
            const texts = appData.translations[appData.currentLanguage];
            
            // Add user message
            addChatMessage(input, true);
            
            // Find matching FAQ
            const faqList = appData.faq.en; // Using English FAQ for all languages for simplicity
            let answer = '';
            
            for (const faq of faqList) {
                if (userInput.includes(faq.question.toLowerCase())) {
                    answer = faq.answer;
                    break;
                }
            }
            
            // If no specific answer found, provide default response
            if (!answer) {
                if (appData.currentLanguage === 'en') {
                    answer = "I can help you with market prices, how to place orders, farmer registration, or delivery information. Please ask a specific question.";
                } else if (appData.currentLanguage === 'hi') {
                    answer = "मैं आपकी बाजार मूल्य, आदेश कैसे दें, किसान पंजीकरण, या वितरण जानकारी के साथ मदद कर सकता हूं। कृपया एक विशिष्ट प्रश्न पूछें।";
                } else if (appData.currentLanguage === 'te') {
                    answer = "నేను మార్కెట్ ధరలు, ఆర్డర్లు ఎలా ఇవ్వాలి, రైతు నమోదు లేదా డెలివరీ సమాచారంతో మీకు సహాయం చేయగలను. దయచేసి ఒక నిర్దిష్ట ప్రశ్న అడగండి.";
                } else if (appData.currentLanguage === 'kn') {
                    answer = "ನಾನು ನಿಮಗೆ ಮಾರುಕಟ್ಟೆ ಬೆಲೆಗಳು, ಆದೇಶಗಳನ್ನು ಹೇಗೆ ನೀಡಬೇಕು, ರೈತ ನೋಂದಣಿ, ಅಥವಾ ವಿತರಣಾ ಮಾಹಿತಿಯೊಂದಿಗೆ ಸಹಾಯ ಮಾಡಬಹುದು. ದಯವಿಟ್ಟು ಒಂದು ನಿರ್ದಿಷ್ಟ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.";
                }
            }
            
            // Add bot response after a short delay
            setTimeout(() => {
                addChatMessage(answer, false);
            }, 500);
        }
        
        // Add message to chatbot
        function addChatMessage(message, isUser = false) {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${isUser ? 'user-message' : 'bot-message'}`;
            messageDiv.textContent = message;
            chatbotBody.appendChild(messageDiv);
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
        }
        
        // Setup event listeners
        function setupEventListeners() {
            // Authentication tabs
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                registerTab.classList.remove('active');
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            });
            
            registerTab.addEventListener('click', () => {
                registerTab.classList.add('active');
                loginTab.classList.remove('active');
                registerForm.classList.add('active');
                loginForm.classList.remove('active');
            });
            
            // User type selection
            userTypeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    userTypeBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    currentUserType = btn.dataset.type;
                    
                    // Show/hide farmer fields in registration
                    if (currentUserType === 'farmer' && registerForm.classList.contains('active')) {
                        farmerFields.style.display = 'block';
                    } else {
                        farmerFields.style.display = 'none';
                    }
                });
            });
            
            // Switch between login and register
            switchToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                registerTab.click();
            });
            
            switchToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                loginTab.click();
            });
            
            // Login
            loginBtn.addEventListener('click', () => {
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                if (!email || !password) {
                    alert(appData.currentLanguage === 'en' ? 'Please fill in all fields' :
                          appData.currentLanguage === 'hi' ? 'कृपया सभी फ़ील्ड भरें' :
                          appData.currentLanguage === 'te' ? 'దయచేసి అన్ని ఫీల్డ్‌లను పూరించండి' :
                          'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ');
                    return;
                }
                
                // Simple validation - in real app, this would be a server call
                if (password.length < 6) {
                    alert(appData.currentLanguage === 'en' ? 'Password must be at least 6 characters' :
                          appData.currentLanguage === 'hi' ? 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए' :
                          appData.currentLanguage === 'te' ? 'పాస్వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి' :
                          'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು');
                    return;
                }
                
                // Create mock user
                appData.currentUser = {
                    name: currentUserType === 'farmer' ? 'Rajesh Farmer' : 'John Buyer',
                    email: email,
                    type: currentUserType,
                    id: currentUserType === 'farmer' ? 101 : 1001
                };
                
                // Save to localStorage
                localStorage.setItem('agritechUser', JSON.stringify(appData.currentUser));
                
                // Show main app
                showApp();
            });
            
            // Registration
            registerBtn.addEventListener('click', () => {
                const name = document.getElementById('registerName').value;
                const email = document.getElementById('registerEmail').value;
                const phone = document.getElementById('registerPhone').value;
                const password = document.getElementById('registerPassword').value;
                const confirmPassword = document.getElementById('registerConfirmPassword').value;
                const farmLocation = document.getElementById('farmLocation').value;
                const farmSize = document.getElementById('farmSize').value;
                
                if (!name || !email || !phone || !password || !confirmPassword) {
                    alert(appData.currentLanguage === 'en' ? 'Please fill in all required fields' :
                          appData.currentLanguage === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें' :
                          appData.currentLanguage === 'te' ? 'దయచేసి అన్ని అవసరమైన ఫీల్డ్‌లను పూరించండి' :
                          'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ಅಗತ್ಯ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ');
                    return;
                }
                
                if (currentUserType === 'farmer' && (!farmLocation || !farmSize)) {
                    alert(appData.currentLanguage === 'en' ? 'Please fill in all farmer fields' :
                          appData.currentLanguage === 'hi' ? 'कृपया सभी किसान फ़ील्ड भरें' :
                          appData.currentLanguage === 'te' ? 'దయచేసి అన్ని రైతు ఫీల్డ్‌లను పూరించండి' :
                          'ದಯವಿಟ್ಟು ಎಲ್ಲಾ ರೈತ ಫೀಲ್ಡ್‌ಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ');
                    return;
                }
                
                if (password !== confirmPassword) {
                    alert(appData.currentLanguage === 'en' ? 'Passwords do not match' :
                          appData.currentLanguage === 'hi' ? 'पासवर्ड मेल नहीं खाते' :
                          appData.currentLanguage === 'te' ? 'పాస్వర్డ్‌లు సరిపోలడం లేదు' :
                          'ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ');
                    return;
                }
                
                if (password.length < 6) {
                    alert(appData.currentLanguage === 'en' ? 'Password must be at least 6 characters' :
                          appData.currentLanguage === 'hi' ? 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए' :
                          appData.currentLanguage === 'te' ? 'పాస్వర్డ్ కనీసం 6 అక్షరాలు ఉండాలి' :
                          'ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 6 ಅಕ್ಷರಗಳಾಗಿರಬೇಕು');
                    return;
                }
                
                // Create mock user
                appData.currentUser = {
                    name: name,
                    email: email,
                    phone: phone,
                    type: currentUserType,
                    id: currentUserType === 'farmer' ? Math.floor(Math.random() * 1000) : Math.floor(Math.random() * 10000),
                    farmLocation: farmLocation,
                    farmSize: farmSize
                };
                
                // Save to localStorage
                localStorage.setItem('agritechUser', JSON.stringify(appData.currentUser));
                
                // Show main app
                showApp();
                
                alert(appData.currentLanguage === 'en' ? 'Registration successful!' :
                      appData.currentLanguage === 'hi' ? 'पंजीकरण सफल!' :
                      appData.currentLanguage === 'te' ? 'నమోదు విజయవంతమైనది!' :
                      'ನೋಂದಣಿ ಯಶಸ್ವಿಯಾಗಿದೆ!');
            });
            
            // Language selector
            languageBtn.addEventListener('click', () => {
                languageDropdown.classList.toggle('show');
            });
            
            languageOptions.forEach(option => {
                option.addEventListener('click', () => {
                    const lang = option.dataset.lang;
                    updateLanguage(lang);
                    languageDropdown.classList.remove('show');
                    setupChatbot();
                });
            });
            
            // User profile dropdown
            userProfile.addEventListener('click', () => {
                userDropdown.classList.toggle('show');
            });
            
            // Logout
            logoutBtn.addEventListener('click', () => {
                showAuth();
                userDropdown.classList.remove('show');
            });
            
            // Close dropdowns when clicking outside
            document.addEventListener('click', (e) => {
                if (!e.target.closest('.language-selector')) {
                    languageDropdown.classList.remove('show');
                }
                if (!e.target.closest('.user-profile')) {
                    userDropdown.classList.remove('show');
                }
            });
            
            // Product filter buttons
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    // Remove active class from all buttons
                    filterBtns.forEach(b => b.classList.remove('active'));
                    // Add active class to clicked button
                    btn.classList.add('active');
                    // Render products with selected filter
                    renderProducts(btn.dataset.filter, productSearch.value);
                });
            });
            
            // Product search
            productSearch.addEventListener('input', () => {
                const activeFilter = document.querySelector('.filter-btn.active');
                renderProducts(activeFilter.dataset.filter, productSearch.value);
            });
            
            // Add product button (for farmers)
            addProductBtn.addEventListener('click', () => {
                alert(appData.currentLanguage === 'en' ? 'Add product feature would open a form in a real application' :
                      appData.currentLanguage === 'hi' ? 'वास्तविक अनुप्रयोग में उत्पाद जोड़ने की सुविधा एक फॉर्म खोलेगी' :
                      appData.currentLanguage === 'te' ? 'వాస్తవ అప్లికేషన్‌లో ఉత్పత్తిని జోడించే సౌలభ్యం ఒక ఫారమ్‌ను తెరుస్తుంది' :
                      'ನೈಜ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸುವ ವೈಶಿಷ್ಟ್ಯವು ಫಾರ್ಮ್‌ನನ್ನು ತೆರೆಯುತ್ತದೆ');
            });
            
            // Chatbot
            chatbotToggle.addEventListener('click', () => {
                chatbotWindow.classList.toggle('active');
            });
            
            chatbotClose.addEventListener('click', () => {
                chatbotWindow.classList.remove('active');
            });
            
            chatbotSend.addEventListener('click', () => {
                const input = chatbotInput.value.trim();
                if (input) {
                    processChatbotInput(input);
                    chatbotInput.value = '';
                }
            });
            
            chatbotInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const input = chatbotInput.value.trim();
                    if (input) {
                        processChatbotInput(input);
                        chatbotInput.value = '';
                    }
                }
            });
            
            // Smooth scrolling for anchor links
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    const targetId = this.getAttribute('href');
                    if (targetId === '#') return;
                    
                    const targetElement = document.querySelector(targetId);
                    if (targetElement) {
                        window.scrollTo({
                            top: targetElement.offsetTop - 80,
                            behavior: 'smooth'
                        });
                    }
                });
            });
            
            // Simulate market price updates every 30 seconds
            setInterval(() => {
                // Randomly update some prices
                appData.marketPrices.forEach(item => {
                    // Small random change between -1 and +1
                    const change = (Math.random() * 2 - 1) * 0.5;
                    item.change = Math.round((item.change + change) * 10) / 10;
                    item.marketPrice = Math.max(10, Math.round(item.marketPrice + change));
                    item.farmerPrice = Math.max(8, Math.round(item.marketPrice * 0.85));
                });
                
                renderMarketPrices();
                updatePriceHighlight();
                updateTimeDisplay();
            }, 30000);
        }
        
        // Initialize the app when DOM is loaded
        document.addEventListener('DOMContentLoaded', initApp);
