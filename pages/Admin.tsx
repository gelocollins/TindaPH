
import React, { useEffect, useState } from 'react';
import { adminService, listingService } from '../services/mockSupabase';
import { AdminStats, Listing } from '../types';
import { Link } from 'react-router-dom';

const Admin: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const s = await adminService.getStats();
    setStats(s);
    // In a real app, this would be a separate API call like /admin/listings?status=pending
    const allListings = await listingService.getFeed({ role: 'ADMIN' } as any); 
    setPendingListings(allListings.filter(l => l.status === 'pending'));
    setLoading(false);
  };

  const handleModeration = async (id: string, action: 'active' | 'rejected') => {
    await listingService.updateStatus(id, action);
    // Refresh
    fetchData();
  };

  if (loading || !stats) return <div className="p-8 text-center">Loading Admin Panel...</div>;

  return (
    <div className="p-4 md:p-0 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
        <span className="text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-600">Last updated: Just now</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Total Users</p>
          <p className="text-3xl font-black text-gray-800 mt-2">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Active Listings</p>
          <p className="text-3xl font-black text-blue-600 mt-2">{stats.totalListings}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Pending Review</p>
          <p className="text-3xl font-black text-orange-500 mt-2">{stats.pendingApprovals}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase">Vol. (Sold)</p>
          <p className="text-3xl font-black text-green-600 mt-2">₱{(stats.totalVolume / 1000).toFixed(1)}k</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Simple Bar Chart for Categories (CSS only) */}
        <div className="bg-white p-6 rounded-xl border shadow-sm">
           <h3 className="font-bold text-gray-800 mb-6">Listings by Category</h3>
           <div className="space-y-4">
             {stats.listingsByCategory.map((c) => (
               <div key={c.category} className="flex items-center gap-3 text-xs">
                 <span className="w-24 font-medium truncate">{c.category}</span>
                 <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                   <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(c.count / stats.totalListings) * 100}%` }}></div>
                 </div>
                 <span className="w-8 text-right font-bold text-gray-600">{c.count}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Pending Approvals Queue */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800">Moderation Queue</h3>
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">{pendingListings.length} Pending</span>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-3 pr-2 scrollbar-thin">
            {pendingListings.length === 0 ? (
               <div className="text-center text-gray-400 py-10">All caught up! 🎉</div>
            ) : (
              pendingListings.map(item => (
                <div key={item.id} className="flex gap-3 items-start border-b pb-3 last:border-0">
                   <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.images[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-gray-900 truncate">{item.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                      <p className="text-xs font-medium text-gray-400 mt-1">by {item.seller_name} • ₱{item.price}</p>
                   </div>
                   <div className="flex flex-col gap-2 shrink-0">
                      <button 
                        onClick={() => handleModeration(item.id, 'active')}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition" 
                        title="Approve"
                      >
                        ✓
                      </button>
                      <button 
                         onClick={() => handleModeration(item.id, 'rejected')}
                         className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition" 
                         title="Reject"
                      >
                        ✕
                      </button>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
