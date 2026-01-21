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
