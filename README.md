# Intellix

<p align="center">
  <b>AI-powered real-time chat platform</b><br/>
  Built with React, Redux, Express, Socket.IO, MongoDB, and LangChain tools.
</p>

<p align="center">
  <img alt="Node" src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=0B1B2B" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white" />
  <img alt="Socket.IO" src="https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socketdotio&logoColor=white" />
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-9.3+-47A248?logo=mongodb&logoColor=white" />
</p>

---

## Why Intellix?

Intellix is a full-stack AI chat app focused on fast interaction, rich responses, and practical tool usage.

- Real-time AI status + streaming response UX via Socket.IO
- Authentication with cookie-based sessions and protected routes
- LangChain tool-calling for:
  - Internet search
  - Web page reading
  - Email sending
- Model failover strategy (Mistral primary, Gemini fallback)
- Modern React dashboard with markdown + code/table rendering

---

## Monorepo Structure

```text
Intellix/
|- backend/   # Express + MongoDB + LangChain + Socket.IO server
|- frontend/  # React + Vite + Redux client
```

---

## Tech Stack

### Frontend

- React 19
- Vite
- Redux Toolkit
- React Router
- Socket.IO Client
- React Markdown + Remark GFM

### Backend

- Node.js (ESM)
- Express 5
- Socket.IO
- MongoDB + Mongoose
- LangChain
- Mistral AI + Google Gemini
- Tavily Search API
- Nodemailer (OAuth2)
- Redis (optional cache integration)

---

## Getting Started

## 1) Clone

```bash
git clone <your-repo-url>
cd Intellix
```

## 2) Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 3) Configure Environment Variables

Create `backend/.env`:

```env
# Core
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Auth
JWT_SECRET=your_jwt_secret_here

# Database
MONGO_URI=mongodb://127.0.0.1:27017/intellix

# Redis (optional)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Providers
MISTRAL_API_KEY=your_mistral_api_key
GEMINI_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key

# Email (Google OAuth2)
GOOGLE_USER=your_email@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REFRESH_TOKEN=your_google_refresh_token
```

Note: Frontend API/socket base URL is currently set to `http://localhost:3000` in service files.

## 4) Run the App

In one terminal:

```bash
cd backend
npm run dev
```

In a second terminal:

```bash
cd frontend
npm run dev
```

Open: `http://localhost:5173`

---

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/get-me`
- `POST /api/auth/logout`
- `GET /api/auth/verify-email`
- `POST /api/auth/resend-verification-email`

### Chat

- `POST /api/chats/message`
- `GET /api/chats`
- `GET /api/chats/:chatId/messages`
- `DELETE /api/chats/delete/:chatId`

---

## Real-Time Events

Socket events used by frontend for live UX:

- `chat:join`
- `ai:typing`
- `ai:status`
- `ai:stream`
- `ai:stream:end`

---

## Roadmap Ideas

- Tool-based text-to-audio messages in chat
- In-chat Google Maps rich widget rendering
- Role-based workspaces and team chats
- Export/import chats
- Better observability and analytics

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "Add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

No license is currently specified in this repository.
Add a `LICENSE` file before publishing publicly.
