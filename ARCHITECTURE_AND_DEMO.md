# Crime Hotspot Analysis - Docker Architecture & Demo Guide

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Docker Container Network                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐    ┌──────────────────┐   ┌────────────┐ │
│  │  FRONTEND        │    │  BACKEND API     │   │  DATABASE  │ │
│  │  (Nginx Server)  │    │  (Node.js/Expr)  │   │  (MongoDB) │ │
│  │                  │    │                  │   │            │ │
│  │ Container:       │    │ Container:       │   │ Container: │ │
│  │ crime_frontend   │    │ crime_backend    │   │ crime_mongo│ │
│  │                  │    │                  │   │            │ │
│  │ Port: 80         │    │ Port: 3000       │   │ Port:27017 │ │
│  │                  │    │                  │   │            │ │
│  │ - HTML/CSS/JS    │    │ - APIs           │   │ - Data     │ │
│  │ - User Interface │    │ - Business Logic │   │ - Storage  │ │
│  │ - Routing        │    │ - Auth (JWT)     │   │ - Collections
│  │                  │    │ - Google OAuth   │   │            │ │
│  └──────────────────┘    └──────────────────┘   └────────────┘ │
│         │                        │                      │        │
│         └────────────────────────┼──────────────────────┘        │
│                                  │                               │
│              Internal Network: mongo:27017                       │
│              (Containers communicate via service names)          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                          ▲
                          │
                ┌─────────┴──────────┐
                │   YOUR MACHINE     │
                │   (Host Computer)  │
                └────────────────────┘
                 Browser Access:
                 - http://localhost (Frontend)
                 - http://localhost:3000 (API)
```

---

## 📦 What's Running Where

### 1️⃣ **Frontend Container** (crime_frontend)
- **Image**: capstone--frontend:latest
- **Base**: Nginx Alpine Linux
- **Port**: 80 (external) → 80 (internal)
- **What it does**:
  - Serves static HTML, CSS, JavaScript files
  - Redirects API calls to backend (`/api` → backend:3000)
  - Renders user interface in browser

**Files served**:
```
/usr/share/nginx/html/
├── index.html
├── user-landing.html
├── user-login.html
├── police-dashboard.html
├── police-login.html
├── signup.html
├── style.css
├── script.js
├── police-dashboard.js
└── user-landing.js
```

**Network**: Listens on port 80, proxies API requests to `http://backend:3000`

---

### 2️⃣ **Backend Container** (crime_backend)
- **Image**: capstone--backend:latest
- **Base**: Node.js 18
- **Port**: 3000 (exposed)
- **What it does**:
  - Runs Express.js server
  - Handles API requests
  - Manages JWT authentication
  - Handles Google OAuth login
  - Connects to MongoDB for data

**Key features**:
```
Server Port: 3000
MongoDB Connection: mongodb://mongo:27017/capstone
Environment Variables:
  - JWT_SECRET: Authentication key
  - GOOGLE_CLIENT_ID: OAuth credentials
  - MONGO_URI: Database connection string
```

**API Endpoints** (available at http://localhost:3000/):
- `POST /signup` - User registration
- `POST /login` - User login
- `POST /google-login` - Google OAuth
- `GET /` - Frontend static files
- `/github-webhook` - GitHub integration

---

### 3️⃣ **Database Container** (crime_mongo)
- **Image**: mongo:latest (official MongoDB)
- **Port**: 27017 (exposed)
- **What it does**:
  - Stores all application data
  - Persists user accounts
  - Stores police records
  - Maintains crime data

**Data Structure**:
```
Database: capstone
Collections:
  - users (User profiles)
  - police (Police records)
  - crimes (Crime data)
```

**Persistence**: Data stored in `mongo_data` volume (survives container restarts)

---

## 🔄 How They Communicate

### Request Flow:

```
1. USER OPENS BROWSER
   │
   └─→ http://localhost
       │
       ├─→ Nginx (Frontend Container) serves HTML/CSS/JS
       │   Port 80 → Serves static files
       │
       └─→ User sees login page ✅

2. USER LOGS IN
   │
   └─→ JavaScript sends API request to /api/login
       │
       ├─→ Nginx proxy receives it
       │   (nginx.conf: location /api)
       │
       ├─→ Proxied to http://backend:3000/login
       │   (Backend Container)
       │
       ├─→ Express.js processes login
       │   - Validates credentials
       │
       ├─→ Queries MongoDB at mongodb://mongo:27017
       │   (Database Container)
       │
       ├─→ MongoDB returns user data
       │
       ├─→ Backend generates JWT token
       │
       └─→ Response sent back to browser ✅

3. AUTHENTICATED REQUEST
   │
   └─→ Browser sends request with JWT token
       │
       ├─→ Backend validates token
       ├─→ Fetches data from MongoDB
       └─→ Returns JSON response to frontend ✅
```

---

## 🎬 Live Demo for Your Sir

### Step 1: Show Running Containers
```bash
cd "d:\Sakshi work\CAPSTONE\Crime Hotspot Analysis\Capstone-"
docker-compose ps
```

**Output shows**:
- 3 containers running
- Ports exposed
- Service names and status

---

### Step 2: Show Each Container's Logs

#### **A) Frontend Logs**
```bash
docker-compose logs frontend
```
Shows: Nginx started, listening on port 80

#### **B) Backend Logs**
```bash
docker-compose logs backend
```
Shows: 
- Server running on port 3000
- Connected to MongoDB ✅

#### **C) Database Logs**
```bash
docker-compose logs mongo
```
Shows: MongoDB listening, ready for connections

---

### Step 3: Test Frontend Access
Open browser → **http://localhost**

Shows:
- ✅ Crime Hotspot Analysis website loads
- ✅ Login/signup pages visible
- ✅ Static files served by Nginx

---

### Step 4: Test Backend API
Open browser/Postman → **http://localhost:3000**

Test endpoints:
```bash
# 1. Test server is running
curl http://localhost:3000

# 2. Test sign up
curl -X POST http://localhost:3000/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"pass123"}'

# 3. Test login
curl -X POST http://localhost:3000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

---

### Step 5: Test Database Connection
```bash
# Connect to MongoDB container
docker-compose exec mongo mongosh

# Inside MongoDB shell:
use capstone
db.users.find()  # Shows saved users
db.collections.getStats()  # Shows database stats
exit
```

---

### Step 6: Show Network Communication
```bash
# Show container network
docker-compose exec backend ping mongo

# Output shows: mongo is reachable at IP address
# This proves internal container communication works!
```

---

## 📊 Demo Checklist for Your Sir

### ✅ Infrastructure Demo (5 mins)
- [ ] Show `docker-compose ps` (3 containers running)
- [ ] Explain each service (Frontend, Backend, Database)
- [ ] Show port mappings
- [ ] Explain Docker network

### ✅ Frontend Demo (3 mins)
- [ ] Open http://localhost in browser
- [ ] Show UI loads successfully
- [ ] Navigate through pages
- [ ] Show HTML/CSS/JS being served

### ✅ Backend Demo (4 mins)
- [ ] Show `docker-compose logs backend`
- [ ] Test API with curl or Postman
- [ ] Show "Connected to MongoDB ✅"
- [ ] Explain authentication flow

### ✅ Database Demo (3 mins)
- [ ] Connect to MongoDB
- [ ] Show saved data with `db.users.find()`
- [ ] Explain data persistence
- [ ] Show volume storage

### ✅ End-to-End Demo (5 mins)
- [ ] User login flow
- [ ] API request → Database query flow
- [ ] Response back in frontend

**Total Time**: ~20 minutes ⏱️

---

## 🚀 Key Points to Explain

### 1. **Containerization Benefits**
- ✅ Each service isolated in own container
- ✅ Easy deployment - same on any machine
- ✅ Database persists (mongo_data volume)
- ✅ Services communicate via internal network

### 2. **Technology Stack**
- **Frontend**: Nginx (lightweight web server)
- **Backend**: Node.js + Express.js (REST API)
- **Database**: MongoDB (NoSQL database)
- **Orchestration**: Docker Compose (manage 3 containers)

### 3. **Environment Isolation**
- MongoDB connection: `mongodb://mongo:27017`
  - Inside Docker: uses service name `mongo`
  - Outside Docker: uses `localhost:27017`
- Demonstrates importance of proper configuration

### 4. **Production Ready**
- Containerized setup works on:
  - Local machine (demo)
  - Development servers
  - Cloud platforms (AWS, Azure, GCP)
- No "works on my machine" issues!

---

## 📝 Quick Reference Commands

```bash
# Navigate to project
cd "d:\Sakshi work\CAPSTONE\Crime Hotspot Analysis\Capstone-"

# View status
docker-compose ps

# Start all services
docker-compose up

# Stop all services
docker-compose down

# View logs
docker-compose logs -f          # All services
docker-compose logs -f backend  # Just backend
docker-compose logs -f frontend # Just frontend
docker-compose logs -f mongo    # Just database

# Execute commands in container
docker-compose exec backend bash         # Shell into backend
docker-compose exec mongo mongosh        # Connect to MongoDB

# Rebuild images
docker-compose build --no-cache

# Remove everything and start fresh
docker-compose down -v
docker-compose up --build
```

---

## 📤 Demo Presentation Flow

1. **Start with image** (show the architecture diagram above)
2. **Run `docker-compose ps`** (show 3 containers)
3. **Open http://localhost** (show frontend)
4. **Test API with Postman** (show backend)
5. **Show MongoDB data** (show database)
6. **Explain flow**: Browser → Frontend → Backend → Database → Response

**Your Sir will see**: Professional containerized application! 🎓

---

## ⚠️ Troubleshooting During Demo

| Issue | Solution |
|-------|----------|
| Frontend page blank | Check nginx logs: `docker-compose logs frontend` |
| API not responding | Check backend logs: `docker-compose logs backend` |
| Database not persisting | Check volume exists: `docker volume ls` |
| Can't access http://localhost | Check if Docker Desktop is running |
| Port 80 already in use | Kill process or use different port |

---

**Remember**: The beauty of Docker is showing that **all 3 services work together seamlessly in isolated containers!** 🐳

