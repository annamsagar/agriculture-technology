// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API Helper Function
async function apiCall(endpoint, method = 'GET', data = null) {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const config = {
        method,
        headers,
        ...(data && { body: JSON.stringify(data) })
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API request failed');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication API
const authAPI = {
    register: (userData) => apiCall('/auth/register', 'POST', userData),
    login: (credentials) => apiCall('/auth/login', 'POST', credentials),
    getCurrentUser: () => apiCall('/auth/me', 'GET')
};

// Products API
const productsAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/products?${queryString}`, 'GET');
    },
    getOne: (id) => apiCall(`/products/${id}`, 'GET'),
    create: (productData) => apiCall('/products', 'POST', productData),
    update: (id, productData) => apiCall(`/products/${id}`, 'PUT', productData),
    updateStock: (id, stock) => apiCall(`/products/${id}/stock`, 'PATCH', { stock }),
    delete: (id) => apiCall(`/products/${id}`, 'DELETE')
};

// Orders API
const ordersAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/orders?${queryString}`, 'GET');
    },
    getOne: (id) => apiCall(`/orders/${id}`, 'GET'),
    create: (orderData) => apiCall('/orders', 'POST', orderData),
    updateStatus: (id, status) => apiCall(`/orders/${id}/status`, 'PATCH', { status }),
    cancel: (id) => apiCall(`/orders/${id}`, 'DELETE')
};

// Market Prices API
const marketPricesAPI = {
    getAll: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiCall(`/market-prices?${queryString}`, 'GET');
    },
    update: (id, priceData) => apiCall(`/market-prices/${id}`, 'PUT', priceData)
};

// Export API object
const API = {
    auth: authAPI,
    products: productsAPI,
    orders: ordersAPI,
    marketPrices: marketPricesAPI
};
