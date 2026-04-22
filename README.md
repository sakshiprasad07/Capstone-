# Capstone- Crime Hotspot Analysis with SOS Feature 🚨

✅ **SOS Feature COMPLETE**: Cursor-tracked location → Auto police station assignment → Blinking notifications → Police dashboard highlighting

## 🆘 Quick Credentials
| Role | Username | Password | Notes |
|------|----------|----------|-------|
| **Police** | `officer1` | `police123` | Test officer 1 |
| **Police** | `officer2` | `police123` | Test officer 2 |
| **Police** | `officer3` | `police123` | Test officer 3 |
| **Admin Bypass** | `police_admin` | `ADMIN777` | Universal police access |
| **User** | `testuser` / signup | any | Regular citizen |

**Seed DB**: `node backend/createTestUsers.js`

## 🚀 Run Instructions

### Development (Split terminals)
```bash
# Backend
cd backend
npm install
npm start
# http://localhost:5000

# Frontend (new terminal)  
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### Docker Production
```bash
docker-compose up -d
# http://localhost (frontend + backend)
```

## 🧪 Test the SOS Feature (11 Cases)

1. **User**: Cursor moves → Blue marker tracks on map
2. **User**: Click SOS → Sends cursor lat/lng 
3. **Backend**: Auto-assigns nearest police station (Haversine)
4. **Police**: Login `officer1`/`police123` → Dashboard
5. **Police**: ALL SOS visible, **⭐ assigned** highlighted (green border)
6. **Map**: Assigned station marker **BLINKS RED** + glows
7. **Popup**: 🚨 SosNotificationPopup (10s auto-dismiss)
8. **Police**: Click Acknowledge → Status changes
9. **Admin**: `police_admin`/`ADMIN777` → Simulator mode
10. **Docker**: Full stack runs containerized
11. **Live**: 5s polling updates dashboard

## 🎯 Feature Status
- ✅ Cursor tracking (no GPS)
- ✅ Auto nearest-station assignment
- ✅ Blinking RED markers for assigned stations
- ✅ Notification popup + dashboard highlights  
- ✅ PUT /sos/:id/status endpoint
- ✅ Test accounts ready

## Architecture
See [ARCHITECTURE_AND_DEMO.md](ARCHITECTURE_AND_DEMO.md) for Docker details.

**Ready for demo!** 🏆
