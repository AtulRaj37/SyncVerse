# SyncVerse

SyncVerse is a real-time synchronized media room platform where users can watch videos, listen to music, and share screens together.

Users can create rooms, invite friends, and enjoy media in perfect synchronization.

---

## Features

- Real-time media synchronization
- YouTube video playback
- SoundCloud music playback
- Local file synchronization
- Screen sharing using WebRTC
- Real-time chat
- Emoji support
- GIF support
- Invite links for rooms
- User profiles
- Fullscreen and mini-player modes

---

## Tech Stack

Frontend:
- Next.js
- React
- TailwindCSS
- Framer Motion

Backend:
- Node.js
- Express

Real-time:
- Socket.IO
- WebRTC

Other Tools:
- Prisma
- Giphy API

---

## Project Structure

```
SyncVerse
├── apps
│   ├── web        # Next.js frontend
│   └── server     # Express backend
│
├── packages
│   └── shared     # Shared types and interfaces
```

---

## Installation

Clone the repository:

```
git clone https://github.com/yourusername/syncverse.git
```

Go into the project folder:

```
cd syncverse
```

Install dependencies:

```
npm install
```

---

## Environment Variables

Create a `.env.local` file inside `apps/web` and add:

```
NEXT_PUBLIC_GIPHY_API_KEY=your_api_key_here
```

---

## Running the Project

Start backend:

```
cd apps/server
npm run dev
```

Start frontend:

```
cd apps/web
npm run dev
```

Open in browser:

```
http://localhost:3000
```

---

## Future Improvements

- Netflix / Prime Video sync
- Floating reactions
- Voice chat
- Mobile responsive UI

---

## Author

Atul Raj