# Capstone Project TODOs - Frontend Fix

## Current Task: Fix Broken Frontend

### Root Causes Identified:
1. CrimeMap.jsx had unresolved Git merge conflicts (`<<<<<<< HEAD`, `=======`, `>>>>>>> bugssss`)
2. UserLanding.jsx had unresolved merge conflicts, duplicate JSX, and missing imports
3. UserLocationMarker component referenced but didn't exist
4. UserLanding.jsx referenced undefined DangerBanner, handleDangerZone, handleDismissDanger
5. Stray file `const [heatPoints, setHeatPoints] = useS.js` in project root

### Steps:
- [x] Fix CrimeMap.jsx - remove merge conflicts, combine correct code, add missing UserLocationMarker
- [x] Fix UserLanding.jsx - remove merge conflicts, remove duplicates, fix imports, remove undefined references
- [x] Delete stray file from project root
- [x] Test frontend build: `cd frontend && npm run build` - PASSED

