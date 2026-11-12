# SmartTask – Productivity Management App

SmartTask is a web-based productivity application that helps users manage daily tasks, organize schedules, and improve focus.

## ✨ Features
- Secure user signup and login
- Add, edit, delete, and complete tasks
- Task priorities and due dates
- Monthly calendar
- Pomodoro focus timer
- Daily motivational quotes
- Light and dark mode
- Personal dashboard
- Cloud database with user-specific data protection

## 🛠️ Tech Stack
- HTML, CSS, JavaScript
- Vite
- Supabase (Authentication & Database)
- GitHub
- Netlify (Deployment)

## ⚙️ Setup

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd SmartTask
npm install
npm run dev
```

Create a `.env` file in the root folder:

```env
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_KEY
```

## 🔒 Security
Supabase Row Level Security (RLS) ensures users can access only their own tasks.

Never upload your `.env` file or service-role key to GitHub.

## 🚀 Build

```bash
npm run build
```

## 👩‍💻 Developer
Developed as a productivity management project to demonstrate frontend development, authentication, and database integration.
