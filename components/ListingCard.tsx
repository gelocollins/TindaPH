
import React from 'react';
import { Listing } from '../types';
import { Link } from 'react-router-dom';

interface ListingCardProps {
  item: Listing;
  showStatus?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({ item, showStatus }) => {
  return (
    <Link to={`/listing/${item.id}`} className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full">
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <img 
          src={item.images[0]} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {item.condition === 'New' && (
            <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
              NEW
            </span>
          )}
          {showStatus && item.status !== 'active' && (
             <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm text-white
                ${item.status === 'sold' ? 'bg-gray-800' : 'bg-orange-500'}
             `}>
               {item.status.toUpperCase()}
             </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
          {item.title}
        </h3>
        
        <div className="mt-1 mb-2">
          <span className="text-lg font-black text-blue-600">₱{item.price.toLocaleString()}</span>
        </div>

        <div className="mt-auto flex justify-between items-center text-[10px] text-gray-400 font-medium">
          <div className="flex items-center gap-1 truncate max-w-[70%]">
             <span>📍</span>
             <span className="truncate">{item.location.city}</span>
          </div>
          <span>{new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}</span>
        </div>
      </div>
    </Link>
  );
};
