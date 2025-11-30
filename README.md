# IdeaConnect

A web platform where people with similar ideas can discover each other, share ideas, form teams, and collaborate in a workspace with basic legal/IP awareness.

## 🎯 Problem Statement

Finding like-minded collaborators for your ideas is challenging. People often struggle with:
- **Discovery**: Hard to find people with complementary skills and interests
- **Trust**: Fear of idea theft when sharing concepts
- **Communication**: Scattered communication across multiple platforms
- **Legal Awareness**: Lack of basic IP protection and collaboration agreements

IdeaConnect addresses these challenges by providing a centralized platform for idea sharing, collaboration, and basic legal/IP awareness.

## ✨ Features

### Core Features
- ✅ **User Authentication & Profiles**: Secure JWT-based authentication with user profiles (skills, interests, bio)
- ✅ **Idea Posting**: Create and share ideas with summaries, descriptions, tags, and required skills
- ✅ **Discovery & Search**: Search and filter ideas by tags, status, required skills, and keywords
- ✅ **Collaboration Requests**: Request to collaborate on ideas, accept/reject requests
- ✅ **Team Workspaces**: Real-time chat and task management for teams
- ✅ **Legal/IP Awareness**:
  - NDA-style click-through disclaimers for protected ideas
  - IP & Collaboration Policy, Terms, Privacy pages
  - NDA agreements stored per user–idea pair

### Technical Features
- Real-time chat using Socket.IO
- RESTful API with Express + TypeScript
- MongoDB database with Mongoose
- JWT authentication with bcrypt password hashing
- Responsive UI with Tailwind CSS

## 🚀 Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Auth**: JWT (access token) + bcrypt password hashing
- **Real-time**: Socket.IO
- **Package Manager**: npm
- **Architecture**: Monorepo with npm workspaces

## 📁 Project Structure

```
idea-connect/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── utils/      # Utility functions
│   │   └── legal/      # Legal documents (Terms, Privacy, etc.)
│   └── package.json
├── server/              # Express backend
│   ├── src/
│   │   ├── models/     # Mongoose models
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Express middleware
│   │   ├── socket/     # Socket.IO handlers
│   │   ├── scripts/    # Database seed scripts
│   │   └── config/     # Configuration files
│   └── package.json
├── package.json         # Root package.json with workspace scripts
└── README.md
```

## 🛠️ Setup Instructions

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (local installation or MongoDB Atlas cloud instance)

### Step 1: Clone and Install

```bash
# Install all dependencies (root, client, and server)
npm run install:all
```

Or install manually:
```bash
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### Step 2: Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env  # If .env.example exists, or create manually
```

Edit `server/.env` with your configuration:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/idea-connect
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Important**: 
- For local MongoDB: Use `mongodb://localhost:27017/idea-connect`
- For MongoDB Atlas: Use your connection string from Atlas dashboard
- Change `JWT_SECRET` to a secure random string in production

### Step 3: Start MongoDB

**Local MongoDB:**
```bash
# On macOS/Linux
mongod

# On Windows (if installed as service, it may start automatically)
# Or run: mongod.exe
```

**MongoDB Atlas:**
- No local setup needed, just use your connection string in `.env`

### Step 4: Seed Database (Optional but Recommended)

Populate the database with demo users and sample ideas:

```bash
cd server
npm run seed
```

This creates:
- 2 demo users (see login credentials below)
- 5 sample ideas with different statuses and visibility settings

### Step 5: Run the Application

**Development mode (runs both client and server):**
```bash
# From root directory
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:5000

**Or run separately:**

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

## 🔐 Demo Accounts

After running the seed script, you can login with these accounts:

| Email | Password | Role |
|-------|----------|------|
| `alice@demo.com` | `demo123` | Founder |
| `bob@demo.com` | `demo123` | Professional |

### Demo Account Details

**Alice Johnson** (alice@demo.com)
- Role: Founder
- Skills: Product Management, UI/UX Design, Marketing
- Interests: SaaS, AI, Healthcare
- Has 3 ideas posted (mix of public and protected)

**Bob Smith** (bob@demo.com)
- Role: Professional
- Skills: Full-Stack Development, Node.js, React, MongoDB
- Interests: Web Development, Open Source, Startups
- Has 2 ideas posted

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Ideas
- `POST /api/ideas` - Create idea (requires auth)
- `GET /api/ideas` - List ideas (with filters: search, tags, status, requiredSkills)
- `GET /api/ideas/:id` - Get idea (NDA-protected if needed)
- `PUT /api/ideas/:id` - Update idea (owner only)

### Collaboration
- `POST /api/collab-requests` - Send collaboration request
- `GET /api/collab-requests/mine` - Get requests for my ideas
- `PATCH /api/collab-requests/:id` - Accept/reject request

### NDA
- `POST /api/nda` - Agree to NDA for idea
- `GET /api/nda/mine` - List my NDA agreements

### Tasks
- `POST /api/tasks` - Create task (owner/collaborators only)
- `GET /api/tasks?ideaId=...` - List tasks for idea
- `PATCH /api/tasks/:id` - Update task

### Messages
- `GET /api/messages?ideaId=...` - Get chat messages

## 🔌 Socket.IO Events

### Client → Server
- `joinIdeaRoom` - Join chat room for an idea
- `sendMessage` - Send message in idea chat
- `leaveIdeaRoom` - Leave idea chat room

### Server → Client
- `joinedRoom` - Confirmation of room join
- `newMessage` - New message broadcast
- `leftRoom` - Confirmation of leaving room
- `error` - Error messages

## 🧪 Development

### Client
- Runs on port 3000 with Vite dev server
- Hot module replacement enabled
- API proxy configured to backend

### Server
- Runs on port 5000 with Express
- TypeScript with tsx for development
- Hot reload with tsx watch

### Code Quality
- TypeScript strict mode enabled
- ESLint configured for both client and server
- Consistent error handling

## 📝 Legal Documents

The platform includes placeholder legal documents (for demo purposes):
- **Terms & Conditions** - Platform usage terms
- **Privacy Policy** - Data handling and privacy
- **IP & Collaboration Policy** - Intellectual property guidelines
- **NDA Disclaimer** - Basic good-faith agreement for protected ideas

**Note**: These are student/hackathon-level placeholders and not comprehensive legal documentation.

## 🚧 Future Enhancements

- [ ] Email notifications
- [ ] File uploads for avatars and documents
- [ ] Advanced search and filtering
- [ ] Idea analytics and insights
- [ ] Mobile app
- [ ] Integration with external tools (GitHub, Slack, etc.)

## 📄 License

See LICENSE file for details.

## 🤝 Contributing

This is a demo project. Feel free to fork and modify for your own use.

## 📧 Contact

For questions or issues, please open an issue in the repository.

---

**Built with ❤️ for connecting ideas and collaborators**
