import React, { useEffect, useState } from 'react';
import { Listing, User } from '../types';
import { listingService } from '../services/mockSupabase';
import { Link, useSearchParams } from 'react-router-dom';
import { ListingCard } from '../components/ListingCard';
import { CATEGORIES } from '../constants';

interface HomeProps {
  user: User | null;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || 'All';
  
  const [filterCategory, setFilterCategory] = useState(urlCategory);
  const [searchTerm, setSearchTerm] = useState('');

  // Update filter if URL param changes
  useEffect(() => {
     if(urlCategory) setFilterCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const data = await listingService.getFeed(user, { 
        category: filterCategory, 
        search: searchTerm 
      });
      setListings(data);
      setLoading(false);
    };
    fetchListings();
  }, [user, filterCategory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto md:p-6">
      <div className="flex flex-col md:flex-row gap-6 p-4 md:p-0">
        
        {/* --- DESKTOP SIDEBAR FILTERS --- */}
        <aside className="hidden md:block w-64 shrink-0 space-y-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <h3 className="font-bold text-gray-900 mb-4">Categories</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setFilterCategory('All')} 
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${filterCategory === 'All' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                All Categories
              </button>
              {CATEGORIES.map(cat => (
                <button 
                  key={cat} 
                  onClick={() => setFilterCategory(cat)} 
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${filterCategory === cat ? 'bg-blue-50 text-blue-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          {user && (
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
               <h3 className="font-bold text-blue-800 text-sm mb-2">Your Location</h3>
               <p className="text-sm text-blue-600 mb-1">📍 {user.location.city}, {user.location.province}</p>
               <p className="text-xs text-blue-400">Items near you appear first.</p>
             </div>
          )}
        </aside>

        {/* --- MAIN FEED --- */}
        <div className="flex-1">
          {/* Mobile Search & Filter Bar */}
          <div className="sticky top-[52px] z-40 bg-slate-50 md:static md:bg-transparent pb-4 md:pb-6 pt-2 md:pt-0">
            <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="Search items..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-white border border-gray-200 text-sm rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm" 
               />
               <select 
                 value={filterCategory} 
                 onChange={(e) => setFilterCategory(e.target.value)}
                 className="md:hidden bg-white border border-gray-200 text-sm rounded-lg px-3 py-3 font-medium text-gray-700 shadow-sm"
               >
                 <option value="All">All</option>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-black text-gray-900">Explore Marketplace</h1>
            <p className="text-gray-500 text-sm">Showing results for {filterCategory}</p>
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl aspect-[3/4]"></div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {listings.map((item) => (
                 <ListingCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
               <span className="text-4xl mb-2">🔍</span>
               <p>No items found. Try a different search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;