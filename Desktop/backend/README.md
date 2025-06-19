# Backend API

This is the backend API server built with Express.js, Prisma ORM, and MySQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure your MySQL database:
   - Create a MySQL database
   - Update the `DATABASE_URL` in `.env` file with your database credentials:
   ```
   DATABASE_URL="mysql://username:password@localhost:3306/database_name"
   ```

3. Run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

4. Generate Prisma client:
```bash
npx prisma generate
```

5. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /` - Server status
- `GET /api/health` - Health check endpoint

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
  ```json
  {
    "email": "user@example.com",
    "name": "User Name"
  }
  ```
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client

## Technologies Used

- Express.js - Web framework
- Prisma - ORM for database operations
- MySQL - Database
- CORS - Cross-origin resource sharing
- dotenv - Environment variables management 