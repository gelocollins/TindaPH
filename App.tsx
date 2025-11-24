import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import Auth from './pages/Auth';
import CreateListing from './pages/CreateListing';
import ListingDetail from './pages/ListingDetail';
import Admin from './pages/Admin';
import Chat from './pages/Chat';
import { authService } from './services/mockSupabase';
import { User, UserRole } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    // Initial session check is now async with real Supabase
    const initAuth = async () => {
        try {
            const u = await authService.getCurrentUser();
            setUser(u);
        } catch (e) {
            console.error("Auth check failed", e);
        } finally {
            setInit(true);
        }
    };
    initAuth();
  }, []);

  const handleLogin = async () => {
    const u = await authService.getCurrentUser();
    setUser(u);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
  };

  if (!init) return null;

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout}>
        <Routes>
          {/* Landing Page is now default */}
          <Route path="/" element={<LandingPage user={user} />} />
          
          {/* Main Feed moved to /explore */}
          <Route path="/explore" element={<Home user={user} />} />
          <Route path="/search" element={<Home user={user} />} /> 
          
          <Route path="/login" element={!user ? <Auth onLogin={handleLogin} /> : <Navigate to="/" />} />
          <Route path="/sell" element={user ? <CreateListing user={user} /> : <Navigate to="/login" />} />
          <Route path="/listing/:id" element={<ListingDetail user={user} />} />
          <Route path="/messages" element={user ? <Chat user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin" element={user?.role === UserRole.ADMIN ? <Admin /> : <Navigate to="/" />} />
          
          <Route path="/profile" element={<div className="p-8 text-center text-gray-400">Profile Page Implementation Pending</div>} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;