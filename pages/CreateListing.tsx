
import React, { useState } from 'react';
import { User, Condition } from '../types';
import { CATEGORIES } from '../constants';
import { listingService, compressImage } from '../services/mockSupabase';
import { generateListingDescription } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';

interface CreateListingProps {
  user: User;
}

const CreateListing: React.FC<CreateListingProps> = ({ user }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [condition, setCondition] = useState<Condition>(Condition.USED);
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState<string>('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        // Client-side compression
        const compressed = await compressImage(rawBase64);
        setImageBase64(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMagicDescription = async () => {
    if (!title) return alert("Enter a title first!");
    setAiLoading(true);
    const generated = await generateListingDescription(title, category, condition);
    setDescription(generated);
    setAiLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageBase64) return alert("Image is required");
    
    setLoading(true);
    await listingService.create({
      seller_id: user.id,
      seller_name: user.name,
      title,
      price: Number(price),
      category,
      condition,
      description,
      images: [imageBase64],
      location: user.location
    });
    setLoading(false);
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white md:rounded-2xl md:shadow-lg md:border md:p-8 min-h-[80vh]">
      <div className="p-4 md:p-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sell Item</h1>
        <p className="text-gray-500 text-sm mb-6">Step {step} of 2</p>

        {step === 1 ? (
          <div className="space-y-6">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Item Photo</label>
              <div className="relative aspect-video bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:bg-gray-100 transition">
                 {imageBase64 ? (
                   <img src={imageBase64} className="w-full h-full object-contain" alt="Preview" />
                 ) : (
                   <div className="text-center p-4">
                     <span className="text-4xl block mb-2">📸</span>
                     <span className="text-sm text-gray-500 font-medium">Click to upload photo</span>
                   </div>
                 )}
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-700">Title</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="What are you selling?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-sm font-bold text-gray-700">Price</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-3 text-gray-500">₱</span>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} className="w-full border border-gray-300 p-3 pl-8 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                    </div>
                 </div>
                 <div>
                    <label className="text-sm font-bold text-gray-700">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-gray-300 p-3 rounded-lg mt-1 bg-white outline-none">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
              <div>
                 <label className="text-sm font-bold text-gray-700">Condition</label>
                 <div className="flex flex-wrap gap-2 mt-2">
                   {Object.values(Condition).map(c => (
                     <button 
                       key={c}
                       type="button"
                       onClick={() => setCondition(c as Condition)}
                       className={`px-4 py-2 rounded-full text-sm font-medium border ${condition === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                     >
                       {c}
                     </button>
                   ))}
                 </div>
              </div>
            </div>

            <button 
              onClick={() => {
                if(!title || !price || !imageBase64) return alert("Please fill details and upload photo.");
                setStep(2);
              }}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-700 transition"
            >
              Next Step
            </button>
          </div>
        ) : (
          <div className="space-y-6">
             <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
               <span className="text-2xl">✨</span>
               <div>
                 <h3 className="font-bold text-blue-900 text-sm">AI Magic Writer</h3>
                 <p className="text-xs text-blue-700 mt-1">Let Gemini write a catchy description for your {title}.</p>
               </div>
               <button onClick={handleMagicDescription} disabled={aiLoading} className="ml-auto bg-white text-blue-600 text-xs font-bold px-3 py-2 rounded-lg shadow-sm border border-blue-100 hover:bg-blue-50">
                 {aiLoading ? 'Writing...' : 'Auto-Write'}
               </button>
             </div>

             <div>
               <label className="text-sm font-bold text-gray-700">Description</label>
               <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  rows={6}
                  className="w-full border border-gray-300 p-3 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed" 
                  placeholder="Tell buyers about features, defects, or reason for selling..." 
               />
             </div>

             <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200"
                >
                  Back
                </button>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-[2] bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 shadow-lg disabled:bg-blue-400"
                >
                  {loading ? 'Publishing...' : 'Publish Listing'}
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateListing;
