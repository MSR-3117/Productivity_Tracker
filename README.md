# 🗓️ Daily Planner

A full-stack, production-ready daily planner and productivity tracking application built with the MERN stack (MongoDB, Express, React, Node.js). 

This application provides users with the ability to manage daily tasks, track productivity metrics, configure recurring tasks, and visualize their productivity streaks and trends over time.

---

## 🚀 Features

- **Authentication & Authorization**: Secure JWT-based authentication via Email/Password or **Google OAuth 2.0**.
- **Task Management**: Create, update, delete, and soft-delete daily tasks with priorities and categories.
- **Recurring Tasks**: Automate daily, weekly, or monthly recurring tasks.
- **Productivity Analytics**: 
  - Dynamic heatmaps visualizing task completion over the last 7 weeks.
  - Hourly performance tracking to identify the most productive times of day.
  - Streak calculations and weekly trends.
- **Time Blocking**: Organize your day with colorful, drag-and-drop compatible time blocks.
- **Customizable Themes**: Full Light and Dark mode support.
- **Security Best Practices**: Rate limiting, JWT rotation, Cross-Origin Resource Sharing (CORS) protection, HTTP-only secure cookies.

---

## 🛠️ Technology Stack

### Frontend
- **React.js (Vite)**: Fast, modern UI library.
- **CSS3 Variables**: Custom theming system for Light/Dark mode.
- **Recharts**: Data visualization for analytics and trends.

### Backend
- **Node.js & Express**: Fast, unopinionated routing and middleware architecture.
- **MongoDB & Mongoose**: Flexible NoSQL database with ODM.
- **Passport.js**: Social OAuth integration (Google).
- **JSON Web Tokens (JWT)**: Secure stateless authentication with short-lived access tokens and rotated refresh tokens.
- **Express Validator**: Robust request body validation.

---

## 🏗️ Architecture

The backend follows a strict **Controller-Service** pattern, ensuring separation of concerns:
- **Routes**: Define endpoints and apply middleware.
- **Controllers**: Handle HTTP requests/responses and extract parameters.
- **Services**: Contain pure business logic and database operations.
- **Middleware**: Authentication (`authenticateJWT`), validation (`express-validator`), and rate-limiting.

---

## 💻 Local Development

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Server (or MongoDB Atlas cluster)
- Google Cloud Console account (for OAuth credentials)

### 1. Clone & Install
```bash
git clone https://github.com/yourusername/daily-planner.git
cd daily-planner

# Install backend dependencies
npm install

# Install frontend dependencies
cd src/web
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory:
```env
# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173

# Database
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/daily-planner

# Security
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key

# OAuth 2.0
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Run the App
You can run the backend and frontend simultaneously:

**Terminal 1 (Backend):**
```bash
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd src/web
npm run dev
```

Access the app at: `http://localhost:5173`

---

## 🌐 Deployment (Vercel)

This application is optimized for Serverless deployment on Vercel.

1. Push your code to GitHub.
2. Import the project into Vercel.
3. Configure the Root Directory to the base of the repository.
4. Set the Build Command to: `cd src/web && npm install && npm run build`
5. Set the Output Directory to: `src/web/dist`
6. Add all the Environment Variables from your local `.env` file into the Vercel project settings.
7. Deploy!

The `vercel.json` configuration automatically routes `/api/*` requests to the Express backend serverless functions, and serves the static React files for all other routes.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
