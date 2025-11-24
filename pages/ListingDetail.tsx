import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { listingService, chatService } from '../services/mockSupabase';
import { Listing, User } from '../types';

interface ListingDetailProps {
  user: User | null;
}

const ListingDetail: React.FC<ListingDetailProps> = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
        listingService.getById(id).then(data => {
            setItem(data || null);
            setLoading(false);
        });
    }
  }, [id]);

  const handleChat = async () => {
    if (!user) return navigate('/login');
    if (!item) return;
    
    // Simulate starting a thread
    await chatService.sendMessage({
      from_user: user.id,
      to_user: item.seller_id,
      listing_id: item.id,
      message: `Hi ${item.seller_name}, is this still available?`
    });
    
    navigate('/messages'); // Ideally go to specific thread
  };

  if (loading) return <div>Loading...</div>;
  if (!item) return <div>Item not found</div>;

  const isOwner = user?.id === item.seller_id;

  return (
    <div className="pb-10">
       <div className="relative bg-black w-full aspect-square">
         <img src={item.images[0]} className="w-full h-full object-contain" alt={item.title} />
         <button onClick={() => navigate(-1)} className="absolute top-4 left-4 bg-white/80 p-2 rounded-full shadow">⬅</button>
       </div>

       <div className="p-5 bg-white -mt-4 rounded-t-3xl relative z-10">
         <div className="flex justify-between items-start">
            <div>
               <h1 className="text-xl font-bold text-gray-900">{item.title}</h1>
               <p className="text-sm text-gray-500 mt-1">{item.category} • {item.condition}</p>
            </div>
            <p className="text-2xl font-black text-blue-600">₱{item.price.toLocaleString()}</p>
         </div>

         <div className="mt-6">
           <h3 className="text-sm font-bold text-gray-900 mb-2">Location</h3>
           <div className="flex items-start gap-2 text-gray-600 bg-gray-50 p-3 rounded-lg">
             <span>📍</span>
             <div>
                <p className="font-medium text-sm text-gray-900">{item.location.city}, {item.location.province}</p>
                <p className="text-xs">{item.location.region}</p>
             </div>
           </div>
         </div>

         <div className="mt-6">
           <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
           <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{item.description}</p>
         </div>

         <div className="mt-6 pt-6 border-t flex items-center gap-3">
           <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-600">
             {item.seller_name[0]}
           </div>
           <div>
             <p className="text-sm font-bold">{item.seller_name}</p>
             <p className="text-xs text-gray-500">Joined recently</p>
           </div>
         </div>
       </div>

       <div className="fixed bottom-0 left-0 w-full p-4 bg-white border-t flex justify-center max-w-lg mx-auto left-0 right-0">
          {isOwner ? (
             <button className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold">Edit Listing</button>
          ) : (
             <button onClick={handleChat} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-blue-700">
               Chat Seller
             </button>
          )}
       </div>
    </div>
  );
};

export default ListingDetail;
