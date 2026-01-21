# AgriTech Direct - Full Stack Application

A comprehensive marketplace platform connecting farmers directly with buyers, eliminating intermediaries.

## Features

- **User Authentication** - JWT-based authentication for farmers and buyers
- **Product Management** - CRUD operations for agricultural products
- **Order Management** - Complete order lifecycle with status tracking
- **Market Prices** - Real-time market price comparison
- **Dark Mode** - Toggle between light and dark themes
- **Multilingual** - Support for English, Hindi, Telugu, and Kannada
- **Responsive Design** - Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Responsive design with CSS Grid and Flexbox
- Font Awesome icons
- Google Fonts (Poppins, Roboto)

### Backend
- Node.js & Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcryptjs for password hashing
- CORS enabled

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 or higher)
- A modern web browser

## Installation

### 1. Install Node.js
Download and install from [nodejs.org](https://nodejs.org/)

### 2. Install MongoDB
Download and install from [mongodb.com](https://www.mongodb.com/try/download/community)

### 3. Clone/Navigate to Project
```bash
cd c:\Users\asaga\OneDrive\Documents\agriculture-tech
```

### 4. Install Backend Dependencies
```bash
cd server
npm install
```

This will install:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- nodemon (dev dependency)

### 5. Configure Environment Variables
The `.env` file is already created in the `server` directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/agritech
JWT_SECRET=agritech_super_secret_jwt_key_2024_change_in_production
NODE_ENV=development
```

**IMPORTANT**: Change the `JWT_SECRET` in production!

## Running the Application

### 1. Start MongoDB
Open a terminal and run:
```bash
mongod
```

### 2. Start Backend Server
Open a new terminal:
```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

### 3. Start Frontend
Open `index.html` in your browser, or use a local server:
- **VS Code**: Use Live Server extension
- **Python**: `python -m http.server 8000`
- **Node**: `npx http-server`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (farmer only)
- `PUT /api/products/:id` - Update product (farmer only)
- `PATCH /api/products/:id/stock` - Update stock (farmer only)
- `DELETE /api/products/:id` - Delete product (farmer only)

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order (buyer only)
- `PATCH /api/orders/:id/status` - Update order status
- `DELETE /api/orders/:id` - Cancel order (buyer only)

### Market Prices
- `GET /api/market-prices` - Get all market prices
- `PUT /api/market-prices/:id` - Update market price

## Project Structure

```
agriculture-tech/
├── server/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── User.js              # User model
│   │   ├── Product.js           # Product model
│   │   ├── Order.js             # Order model
│   │   └── MarketPrice.js       # Market price model
│   ├── routes/
│   │   ├── auth.js              # Authentication routes
│   │   ├── products.js          # Product routes
│   │   ├── orders.js            # Order routes
│   │   └── marketPrices.js      # Market price routes
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── server.js                # Main server file
│   ├── package.json             # Dependencies
│   └── .env                     # Environment variables
├── index.html                   # Main HTML file
├── styles.css                   # All CSS styles
├── script.js                    # Frontend JavaScript
└── README.md                    # This file
```

## Database Schema

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  type: 'farmer' | 'buyer',
  farmLocation: String (farmers only),
  farmSize: Number (farmers only)
}
```

### Products Collection
```javascript
{
  name: String,
  category: 'vegetables' | 'fruits' | 'grains',
  farmerPrice: Number,
  marketPrice: Number,
  farmerId: ObjectId,
  farmerName: String,
  location: String,
  stock: Number,
  availability: 'available' | 'limited' | 'out-of-stock',
  image: String,
  description: String
}
```

### Orders Collection
```javascript
{
  orderId: String (auto-generated),
  buyerId: ObjectId,
  buyerName: String,
  items: [{
    productId: ObjectId,
    productName: String,
    quantity: Number,
    price: Number,
    farmerId: ObjectId,
    farmerName: String
  }],
  total: Number,
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled',
  orderDate: Date,
  deliveryDate: Date
}
```

## Testing the API

### Using Postman or cURL

#### Register a Farmer
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Reddy",
    "email": "rajesh@example.com",
    "password": "password123",
    "phone": "9876543210",
    "type": "farmer",
    "farmLocation": "Guntur, AP",
    "farmSize": 5
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "rajesh@example.com",
    "password": "password123"
  }'
```

#### Create Product (use token from login)
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Organic Tomatoes",
    "category": "vegetables",
    "farmerPrice": 38,
    "marketPrice": 45,
    "stock": 100,
    "description": "Fresh organic tomatoes"
  }'
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod`
- Check if port 27017 is available
- Verify MONGODB_URI in `.env` file

### Port Already in Use
- Change PORT in `.env` file
- Or kill the process using port 5000

### CORS Errors
- Ensure backend server is running
- Check that CORS is enabled in `server.js`

## Next Steps

1. **Install Node.js** if not already installed
2. **Install MongoDB** if not already installed
3. **Run `npm install`** in the server directory
4. **Start MongoDB** with `mongod`
5. **Start the backend** with `npm run dev`
6. **Open the frontend** in your browser

## License

ISC

## Author

AgriTech Direct Team
