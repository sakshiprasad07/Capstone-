import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PortalSelection from './components/PortalSelection';
import Login from './components/Login';
import Signup from './components/Signup';
import PoliceDashboard from './components/PoliceDashboard';
import UserLanding from './components/UserLanding';

function PrivateRoute({ children, role }) {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!token) return <Navigate to="/" />;
  if (role && role !== userRole) return <Navigate to="/" />;
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PortalSelection />} />
        <Route path="/police-login" element={<Login role="police" />} />
        <Route path="/user-login" element={<Login role="user" />} />
        <Route path="/signup" element={<Signup />} />
        <Route 
          path="/police-dashboard" 
          element={
            <PrivateRoute role="police">
              <PoliceDashboard />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/user-landing" 
          element={
            <PrivateRoute role="user">
              <UserLanding />
            </PrivateRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
