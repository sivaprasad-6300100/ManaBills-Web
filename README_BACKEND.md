# ManaBills Backend

A comprehensive Django REST API backend for the ManaBills invoicing and business management system.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **Customer Management**: CRUD operations for customer records
- **Product Management**: Inventory management with stock tracking and low-stock alerts
- **Invoice Management**: Complete invoice creation, editing, and status tracking
- **Stock Transactions**: Automatic stock deduction on sales with transaction history
- **Dashboard Analytics**: Business insights and statistics
- **GST Support**: GST invoice generation and calculations

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Environment Configuration
Create a `.env` file in the project root with the following variables:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_NAME=manabills_db
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Database Setup
```bash
python manage.py makemigrations
python manage.py migrate
```

### 4. Create Superuser
```bash
python manage.py createsuperuser
```

### 5. Run Development Server
```bash
python manage.py runserver
```

## API Endpoints

### Authentication
- `POST /api/auth/register/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/token/refresh/` - Refresh JWT token
- `GET /api/auth/profile/` - Get user profile
- `PUT /api/auth/profile/` - Update user profile
- `POST /api/auth/change-password/` - Change password

### Business Management
- `GET/POST /api/business/customers/` - List/Create customers
- `GET/PUT/DELETE /api/business/customers/{id}/` - Customer CRUD
- `GET/POST /api/business/products/` - List/Create products
- `GET/PUT/DELETE /api/business/products/{id}/` - Product CRUD
- `GET/POST /api/business/invoices/` - List/Create invoices
- `GET/PUT/DELETE /api/business/invoices/{id}/` - Invoice CRUD
- `GET/POST /api/business/stock-transactions/` - List/Create stock transactions

### Analytics
- `GET /api/business/dashboard/stats/` - Dashboard statistics
- `GET /api/business/products/low-stock/` - Low stock products
- `GET /api/business/invoices/recent/` - Recent invoices

## Key Models

### User (Custom)
- Email-based authentication
- Business profile information
- Subscription management

### Customer
- Contact information
- GST details
- Purchase history

### Product
- Inventory management
- Pricing information
- Stock alerts

### Invoice
- Complete invoice data
- Payment tracking
- GST calculations
- Status management

### StockTransaction
- Inventory movement tracking
- Transaction history
- Automatic stock updates

## Security Features

- JWT authentication with refresh tokens
- Password hashing
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection

## Development

The backend is built with:
- Django 4.2+
- Django REST Framework
- PostgreSQL (recommended for production)
- JWT authentication
- Comprehensive API documentation

## Production Deployment

For production deployment:
1. Set `DEBUG=False`
2. Use a production database (PostgreSQL)
3. Configure proper SECRET_KEY
4. Set up proper ALLOWED_HOSTS
5. Configure email backend
6. Set up proper CORS settings
7. Use HTTPS
8. Set up proper logging