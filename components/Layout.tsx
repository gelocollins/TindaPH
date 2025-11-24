import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "text-blue-600 font-bold" : "text-gray-500 hover:text-blue-500";
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      
      {/* --- DESKTOP HEADER --- */}
      <header className="hidden md:flex sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b px-8 py-4 justify-between items-center shadow-sm">
        <div className="flex items-center gap-8">
           <Link to="/" className="text-2xl font-black text-blue-600 tracking-tighter">TindaPH.</Link>
           <nav className="flex gap-6 text-sm font-medium">
             <Link to="/" className={isActive('/')}>Home</Link>
             <Link to="/explore" className={isActive('/explore')}>Explore</Link>
             {user && <Link to="/messages" className={isActive('/messages')}>Messages</Link>}
             {isAdmin && <Link to="/admin" className={isActive('/admin')}>Admin Panel</Link>}
           </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
               <Link to="/sell" className="bg-blue-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-200">
                 + Sell Item
               </Link>
               <div className="flex items-center gap-3 pl-4 border-l">
                 <div className="text-right hidden lg:block">
                   <p className="text-sm font-bold text-gray-800">{user.name}</p>
                   <p className="text-xs text-gray-500">{user.location.city}</p>
                 </div>
                 <button onClick={onLogout} className="text-xs text-red-500 hover:text-red-700 font-medium">Logout</button>
               </div>
            </>
          ) : (
             <Link to="/login" className="text-blue-600 font-bold text-sm hover:underline">Log In / Sign Up</Link>
          )}
        </div>
      </header>

      {/* --- MOBILE HEADER --- */}
      <header className="md:hidden sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-xl font-black text-blue-600 tracking-tighter">TindaPH.</Link>
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-1 rounded-full font-bold truncate max-w-[120px]">
               📍 {user.location.city}
            </span>
          </div>
        ) : (
          <Link to="/login" className="text-xs font-bold bg-blue-600 text-white px-3 py-1.5 rounded-full">Login</Link>
        )}
      </header>

      {/* --- MAIN CONTENT --- */}
      {/* Removed default padding for Landing Page full-width control, added conditional class if needed but kept generic for now */}
      <main className="flex-1 w-full mx-auto md:pb-10 pb-24">
        {children}
      </main>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t py-2 px-6 flex justify-between items-center z-50 pb-safe shadow-[0_-5px_10px_rgba(0,0,0,0.02)]">
        <Link to="/" className={`flex flex-col items-center gap-1 ${isActive('/')}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px]">Home</span>
        </Link>
        
        {isAdmin ? (
          <Link to="/admin" className={`flex flex-col items-center gap-1 ${isActive('/admin')}`}>
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             <span className="text-[10px]">Admin</span>
          </Link>
        ) : (
          <Link to="/explore" className={`flex flex-col items-center gap-1 ${isActive('/explore')}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <span className="text-[10px]">Browse</span>
          </Link>
        )}

        <Link to="/sell" className="flex flex-col items-center gap-1 -mt-8 relative z-10">
           <div className="bg-blue-600 text-white p-3.5 rounded-full shadow-lg border-4 border-white transform active:scale-95 transition">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
           </div>
           <span className="text-[10px] font-medium text-blue-600">Sell</span>
        </Link>
        
        <Link to="/messages" className={`flex flex-col items-center gap-1 ${isActive('/messages')}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          <span className="text-[10px]">Chat</span>
        </Link>
        
        <button onClick={user ? onLogout : undefined} className={`flex flex-col items-center gap-1 ${isActive('/profile')}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <span className="text-[10px]">{user ? 'Logout' : 'Login'}</span>
        </button>
      </nav>
    </div>
  );
};

export default Layout;