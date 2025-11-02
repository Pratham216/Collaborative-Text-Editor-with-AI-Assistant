# Quick Start Guide

## Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] MongoDB installed and running (or MongoDB Atlas account)
- [ ] Google Gemini API key ([Get it here](https://makersuite.google.com/app/apikey))

## 5-Minute Setup

### Step 1: Install Dependencies
```bash
# Install all dependencies
npm run install-all

# Or separately:
cd server && npm install
cd ../client && npm install
```

### Step 2: Set Up Environment Variables

**Create `server/.env`:**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/collaborative-editor
JWT_SECRET=change-this-to-a-random-secret-key-in-production
JWT_EXPIRE=7d
GEMINI_API_KEY=your-gemini-api-key-here
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

**Create `client/.env` (optional):**
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### Step 3: Start MongoDB
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) - update MONGODB_URI in .env
```

### Step 4: Run the Application
```bash
# From root directory - runs both server and client
npm run dev

# Or separately:
# Terminal 1:
cd server && npm run dev

# Terminal 2:
cd client && npm start
```

### Step 5: Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/api/health

## First Time Usage

1. **Register an account** at http://localhost:3000/register
2. **Login** with your credentials
3. **Create a new document** from the dashboard
4. **Open the document** to start editing
5. **Open AI Assistant** by clicking the AI icon in the toolbar
6. **Test collaboration** by opening the same document in another browser/incognito window

## Common Issues

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or check your MongoDB Atlas connection string
- Verify `MONGODB_URI` in `server/.env`

### Port Already in Use
- Change `PORT` in `server/.env` to another port (e.g., 5001)
- Update `CLIENT_URL` and `REACT_APP_API_URL` accordingly

### AI Features Not Working
- Verify `GEMINI_API_KEY` is set correctly in `server/.env`
- Check that you have API quota available

### Socket.io Connection Failed
- Ensure server is running on the correct port
- Check CORS settings in `server/server.js`
- Verify `CLIENT_URL` matches your frontend URL

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Can create new documents
- [ ] Can edit documents
- [ ] Auto-save works (wait 30 seconds)
- [ ] Manual save works
- [ ] Real-time collaboration works (open in 2 browsers)
- [ ] AI grammar check works
- [ ] AI text enhancement works
- [ ] AI summarization works
- [ ] Document sharing works

## Docker Quick Start

```bash
# Create .env file in root
cp server/.env.example .env
# Edit .env with your values

# Run with Docker Compose
docker-compose up -d

# Access at http://localhost:5000
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Check [LEARNING_LOG.md](LEARNING_LOG.md) for project insights
3. Customize the application for your needs
4. Deploy to AWS EC2 following instructions in README.md

