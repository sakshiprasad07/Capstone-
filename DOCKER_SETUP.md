# Docker Setup Guide for Crime Hotspot Analysis

## 📋 Project Structure
```
.
├── frontend/          (Nginx container - serves UI)
│   ├── index.html
│   ├── Dockerfile
│   └── nginx.conf
├── backend/           (Node.js Express API)
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── models/
└── docker-compose.yml
```

## 🚀 Quick Start

### Prerequisites
- Docker installed and running
- Docker Compose installed

### 1. Build and Start Containers
```bash
# Navigate to project root
cd "d:\Sakshi work\CAPSTONE\Crime Hotspot Analysis\Capstone-"

# Build all images and start containers
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Access Your Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **MongoDB**: localhost:27017

### 3. Verify Services Running
```bash
# Check all containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongo
```

## 🛑 Stop Services
```bash
# Stop all containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 🔍 Troubleshooting

### If Frontend Shows Blank Page
1. Check nginx is running: `docker-compose logs frontend`
2. Verify backend is accessible from frontend container
3. Check browser console for API errors

### If Backend Won't Connect to MongoDB
1. Wait 10-15 seconds for MongoDB to start
2. Check MONGO_URI environment variable
3. Verify MongoDB container is healthy: `docker-compose logs mongo`

### To Rebuild Specific Service
```bash
# Rebuild backend
docker-compose build --no-cache backend

# Rebuild frontend
docker-compose build --no-cache frontend

# Rebuild everything
docker-compose build --no-cache
```

## 📝 Environment Variables

### Backend (.env file in root or backend/)
```
MONGO_URI=mongodb://mongo:27017/capstone
JWT_SECRET=your_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
PORT=3000
NODE_ENV=production
```

## 💾 MongoDB Data Persistence
- Data is stored in `mongo_data` volume (persists between restarts)
- To clear data: `docker-compose down -v`

## 🔄 Development Workflow

### Modify Backend Code
```bash
# Changes will auto-reload if using nodemon
# Edit server.js or other files, save, and check logs
docker-compose logs -f backend
```

### Modify Frontend Code
```bash
# Rebuild frontend service
docker-compose build frontend
docker-compose up -d frontend

# Or restart service
docker-compose restart frontend
```

## ✅ Architecture
```
Browser (Port 80)
    ↓
Nginx Container (Frontend)
    ├→ Serves Static Files (.html, .css, .js)
    └→ Proxies /api → Backend (Port 3000)
           ↓
    Express Backend
         ↓
    MongoDB (Port 27017)
```
