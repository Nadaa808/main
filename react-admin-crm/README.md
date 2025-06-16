# react-admin-crm

A simple admin dashboard built with React frontend, Express.js backend, Prisma ORM, and MySQL database. This platform provides basic admin functionality for user management and administration.

## Project Structure

```
react-admin-crm/
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│   └── package.json
├── backend/           # Express.js API server
│   ├── routes/
│   ├── prisma/
│   └── package.json
└── README.md
```

## Technologies Used

### Frontend
- **React 18** - Frontend framework
- **Material-UI** - Modern UI components
- **Axios** - HTTP client for API requests
- **Create React App** - Build tooling and development server

### Backend
- **Express.js** - Web framework for Node.js
- **Prisma** - Modern database toolkit and ORM
- **MySQL** - Relational database
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables management

## Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **MySQL** database server

## Quick Start

### 1. Clone and Setup

```bash
# Navigate to your project directory
cd react-admin-crm

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ..\frontend
npm install
```

### 2. Database Setup

1. Create a MySQL database for your project
2. Update the database connection in `backend/.env`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/your_database_name"
PORT=5000
JWT_SECRET="your-secret-key-here"
```

### 3. Initialize Database

```bash
# Navigate to backend directory
cd backend

# Run Prisma migrations to create tables
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 4. Start the Application

**PowerShell Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```
Backend will start on `http://localhost:5000`

**PowerShell Terminal 2 - Frontend:**
```powershell
cd frontend
npm start
```
Frontend will start on `http://localhost:3000`

## Features

### 🔐 Authentication & Authorization
- ✅ **JWT Authentication**: Secure login/register system
- ✅ **Admin Access Control**: Admin-only dashboard access
- ✅ **Protected Routes**: Route-level security

### 👥 User Management
- ✅ **Admin User System**: Support for admin users
- ✅ **Profile Management**: User profile updates and password changes
- ✅ **Admin Dashboard**: Clean and modern dashboard interface

### 🎨 Modern UI/UX
- ✅ **Material UI Design**: Professional and responsive interface
- ✅ **Admin Navigation**: Clean navigation menu for admin functions
- ✅ **Real-time Updates**: Live status indicators and notifications
- ✅ **Mobile Responsive**: Optimized for all device sizes

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration (defaults to ADMIN role)
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/refresh-token` - Refresh JWT token

### Health Check
- `GET /` - Server status
- `GET /api/health` - Health check endpoint

### Users (Protected)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-restart)
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Run new migrations
```

### Frontend Development
```bash
cd frontend
npm start           # Start development server
npm run build       # Build for production
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
PORT=5000
JWT_SECRET="your-secret-key-here"
```

### Frontend (.env) - Optional
```env
REACT_APP_API_URL=http://localhost:5000
```

## Troubleshooting

### Common Issues

1. **Backend connection failed**
   - Make sure MySQL server is running
   - Check database credentials in `.env`
   - Verify database exists

2. **Frontend can't connect to backend**
   - Ensure backend server is running on port 5000
   - Check CORS configuration
   - Verify API URL in frontend

3. **Prisma errors**
   - Run `npx prisma generate` after schema changes
   - Run `npx prisma migrate dev` for database changes

4. **PowerShell command issues**
   - Use `cd backend` instead of `cd backend && npm run dev`
   - Run commands separately in PowerShell
   - Use `..\` for parent directory navigation

## Getting Started

1. **Start both servers** using the commands above
2. **Open your browser** to `http://localhost:3000`
3. **Register a new admin account** or login if you have one
4. **Explore the admin dashboard** with user management features

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE). 
 