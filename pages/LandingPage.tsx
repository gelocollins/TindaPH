
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listingService } from '../services/mockSupabase';
import { Listing, User, SiteReview } from '../types';
import { ListingCard } from '../components/ListingCard';
import { CATEGORIES } from '../constants';

// --- ANIMATION COMPONENTS ---
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transform transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

const CountUp: React.FC<{ end: number; duration?: number; label: string }> = ({ end, duration = 2000, label }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) {
        setStarted(true);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return (
    <div ref={ref} className="text-center p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:transform hover:-translate-y-2 transition duration-300">
      <h3 className="text-4xl md:text-5xl font-black text-blue-600 mb-2">{count.toLocaleString()}+</h3>
      <p className="text-gray-600 font-bold uppercase text-xs tracking-wider">{label}</p>
    </div>
  );
};

// --- REVIEW MODAL COMPONENT ---
const ReviewModal: React.FC<{ onClose: () => void; onSubmit: (rating: number, comment: string) => Promise<void> }> = ({ onClose, onSubmit }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(rating, comment);
        setSubmitting(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-fade-in-up">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Share your experience</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button 
                                    key={star} 
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`text-2xl transition ${star <= rating ? 'text-yellow-400 scale-110' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Comment</label>
                        <textarea 
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                            required
                            rows={4}
                            className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                            placeholder="What did you like about TindaPH?"
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-3 text-gray-600 font-bold rounded-xl hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={submitting} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50">
                            {submitting ? 'Submitting...' : 'Post Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
interface LandingPageProps {
  user: User | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [trendingItems, setTrendingItems] = useState<Listing[]>([]);
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [activeTab, setActiveTab] = useState<'buyer' | 'seller'>('buyer');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const navigate = useNavigate();

  const fetchReviews = async () => {
    const fetchedReviews = await listingService.getReviews();
    setReviews(fetchedReviews);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    const fetchData = async () => {
      try {
        const [data] = await Promise.all([
            listingService.getFeed(null)
        ]);
        setTrendingItems(data.slice(0, 5));
        await fetchReviews();
      } catch (e) {
        console.error("Landing data fetch error", e);
      }
    };
    fetchData();
    return () => clearTimeout(timer);
  }, []);

  const handleReviewSubmit = async (rating: number, comment: string) => {
      if (!user) return;
      await listingService.addReview({
          user_id: user.id,
          rating,
          comment
      });
      await fetchReviews();
      alert("Review submitted! Thank you.");
  };

  const openReviewModal = () => {
      if (!user) {
          navigate('/login');
      } else {
          setShowReviewModal(true);
      }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center">
         <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center font-bold text-blue-600 text-xl">T</div>
         </div>
         <p className="mt-4 text-blue-900 font-medium animate-pulse">Loading TindaPH...</p>
      </div>
    );
  }

  // Use the latest review or fallback
  const featuredReview = reviews.length > 0 ? reviews[0] : {
      comment: "I sold my old gaming laptop in less than 24 hours. The buyer was just 3 streets away!",
      user_name: "Miguel Santos",
      user_location: "Quezon City",
      rating: 5
  };

  return (
    <div className="overflow-hidden bg-slate-50 font-sans">
      
      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex items-center pt-24 md:pt-0 overflow-hidden">
         {/* Background Elements */}
         <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-blue-400/20 rounded-full blur-[100px] animate-pulse-glow" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-400/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }} />
         </div>

         <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-8 items-center">
            
            <div className="space-y-6 text-center md:text-left mt-8 md:mt-0">
               <div className="inline-block px-4 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-[10px] md:text-xs font-bold tracking-wide animate-fade-in-up">
                 ✨ #1 Marketplace in the Philippines
               </div>
               
               {/* RESPONSIVE FONT SIZE FIX: reduced text-5xl to text-4xl on mobile */}
               <h1 className="text-4xl md:text-7xl font-black text-slate-900 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                 Buy & Sell <br/>
                 <span className="text-gradient">With Confidence.</span>
               </h1>
               
               <p className="text-base md:text-xl text-gray-600 max-w-md mx-auto md:mx-0 leading-relaxed animate-fade-in-up px-4 md:px-0" style={{ animationDelay: '400ms' }}>
                 Discover thousands of items near you. Trade securely with our verified local community.
               </p>

               <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start pt-4 animate-fade-in-up px-6 md:px-0" style={{ animationDelay: '600ms' }}>
                  <Link to="/explore" className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-300 hover:bg-blue-700 hover:scale-105 transition transform flex items-center justify-center gap-2">
                    Browse Marketplace
                  </Link>
                  <Link to="/sell" className="w-full sm:w-auto px-8 py-4 bg-white text-slate-700 border border-slate-200 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2">
                    Start Selling
                  </Link>
               </div>
            </div>

            {/* Hero Visual */}
            <div className="relative h-[300px] md:h-[600px] flex items-center justify-center animate-fade-in-up mt-8 md:mt-0" style={{ animationDelay: '800ms' }}>
               <div className="absolute w-[80%] h-[80%] bg-gradient-to-tr from-blue-100 to-purple-100 rounded-full animate-float opacity-50"></div>
               
               {/* Floating Cards Mockup */}
               <div className="relative z-10 w-48 md:w-80 bg-white p-3 md:p-4 rounded-2xl shadow-2xl animate-float-delayed border border-gray-100 rotate-[-6deg] absolute left-4 md:left-10 top-4 md:top-10">
                  <div className="h-28 md:h-40 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                     <img src="https://picsum.photos/400/400" className="w-full h-full object-cover" />
                  </div>
                  <div className="h-3 md:h-4 w-3/4 bg-gray-100 rounded mb-2"></div>
                  <div className="h-3 md:h-4 w-1/2 bg-blue-100 rounded"></div>
               </div>

               <div className="relative z-20 w-48 md:w-80 bg-white p-3 md:p-4 rounded-2xl shadow-2xl animate-float border border-gray-100 rotate-[3deg] translate-x-12 md:translate-x-12 translate-y-12 md:translate-y-20">
                  <div className="flex items-center gap-3 mb-4">
                     <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm">✓</div>
                     <div>
                       <div className="h-2 md:h-3 w-20 md:w-24 bg-gray-100 rounded mb-1"></div>
                       <div className="h-2 md:h-3 w-12 md:w-16 bg-gray-100 rounded"></div>
                     </div>
                  </div>
                  <div className="h-28 md:h-40 bg-gray-100 rounded-lg overflow-hidden">
                    <img src="https://picsum.photos/400/401" className="w-full h-full object-cover" />
                  </div>
               </div>
            </div>

         </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-12 md:py-20 bg-white relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
             <CountUp end={15000} label="Active Users" />
             <CountUp end={8500} label="Items Listed" />
             <CountUp end={98} label="Success Rate %" />
          </div>
        </div>
      </section>

      {/* --- MARKETPLACE PREVIEW --- */}
      <section className="py-16 md:py-24 bg-slate-50 border-t border-slate-200">
         <div className="max-w-7xl mx-auto px-6">
            <div className="flex justify-between items-end mb-8 md:mb-12">
               <Reveal>
                 <h2 className="text-3xl md:text-4xl font-black text-slate-900">Trending Now 🔥</h2>
                 <p className="text-slate-500 mt-2 text-sm md:text-base">See what everyone is looking at in your area.</p>
               </Reveal>
               <Link to="/explore" className="hidden md:flex text-blue-600 font-bold items-center gap-2 hover:underline">
                 View All <span className="text-xl">→</span>
               </Link>
            </div>

            <div className="flex overflow-x-auto gap-4 md:gap-6 pb-8 no-scrollbar snap-x snap-mandatory">
               {trendingItems.length > 0 ? trendingItems.map((item, idx) => (
                 <div key={item.id} className="min-w-[240px] md:min-w-[300px] snap-center">
                    <Reveal delay={idx * 100}>
                       <ListingCard item={item} />
                    </Reveal>
                 </div>
               )) : (
                 <div className="text-gray-400 p-8 text-center w-full">No trending items available yet. Be the first to list!</div>
               )}
               <div className="min-w-[150px] flex items-center justify-center">
                  <Link to="/explore" className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600 hover:scale-110 transition">
                     ➔
                  </Link>
               </div>
            </div>
         </div>
      </section>

      {/* --- FEATURES TABS --- */}
      <section className="py-16 md:py-24 bg-white overflow-hidden">
         <div className="max-w-7xl mx-auto px-6">
            <Reveal className="text-center mb-10 md:mb-16">
               <span className="text-blue-600 font-bold tracking-wider text-xs md:text-sm uppercase">Why Choose TindaPH?</span>
               <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 mb-6">Everything you need.</h2>
               
               <div className="inline-flex bg-slate-100 p-1 rounded-full">
                  <button 
                    onClick={() => setActiveTab('buyer')}
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all ${activeTab === 'buyer' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    For Buyers
                  </button>
                  <button 
                    onClick={() => setActiveTab('seller')}
                    className={`px-6 md:px-8 py-2 md:py-3 rounded-full text-xs md:text-sm font-bold transition-all ${activeTab === 'seller' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    For Sellers
                  </button>
               </div>
            </Reveal>

            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
               <Reveal className="order-2 md:order-1">
                  <div className="space-y-6 md:space-y-8">
                     {activeTab === 'buyer' ? (
                       <>
                         <FeatureItem icon="📍" title="Location-First Search" desc="Find items in your exact barangay or city. Save on shipping and meet up securely." />
                         <FeatureItem icon="🛡️" title="Verified Sellers" desc="Look for the Blue Badge. Our verification process ensures you're dealing with real people." />
                         <FeatureItem icon="💬" title="Real-Time Chat" desc="Instant messaging without leaving the app. Negotiate and arrange details safely." />
                       </>
                     ) : (
                       <>
                         <FeatureItem icon="🤖" title="AI Magic Descriptions" desc="Upload a photo and let our Gemini AI write the perfect sales pitch for you." />
                         <FeatureItem icon="⚡" title="Quick-Post System" desc="List an item in under 60 seconds. Mobile-optimized flow for sellers on the go." />
                         <FeatureItem icon="📊" title="Seller Analytics" desc="Track views, clicks, and messages to optimize your pricing and strategy." />
                       </>
                     )}
                  </div>
               </Reveal>

               <div className="order-1 md:order-2 relative h-[400px] md:h-[500px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 shadow-2xl">
                  {/* Decorative UI inside the feature card */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                     {activeTab === 'buyer' ? (
                        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl space-y-4 animate-float">
                           <div className="h-6 w-1/3 bg-slate-100 rounded"></div>
                           <div className="h-4 w-full bg-slate-50 rounded"></div>
                           <div className="h-4 w-5/6 bg-slate-50 rounded"></div>
                           <div className="flex gap-2 pt-2">
                             <div className="h-10 w-10 bg-blue-100 rounded-full"></div>
                             <div className="flex-1 h-10 bg-slate-100 rounded-full"></div>
                           </div>
                        </div>
                     ) : (
                        <div className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-xl space-y-4 animate-float-delayed">
                           <div className="flex justify-between">
                              <div className="h-6 w-1/3 bg-slate-100 rounded"></div>
                              <div className="h-6 w-6 bg-green-100 rounded-full"></div>
                           </div>
                           <div className="h-32 bg-slate-100 rounded-lg flex items-center justify-center text-4xl">📸</div>
                           <div className="h-10 bg-blue-600 rounded-lg w-full"></div>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- CATEGORIES GRID --- */}
      <section className="py-16 md:py-24 bg-slate-900 text-white">
         <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-10 md:mb-16">
               <h2 className="text-3xl md:text-4xl font-black mb-4">Browse by Category</h2>
               <p className="text-slate-400 text-sm md:text-base">Find exactly what you're looking for.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
               {CATEGORIES.map((cat, idx) => (
                 <Reveal key={cat} delay={idx * 50}>
                   <Link to={`/explore?category=${cat}`} className="block group relative overflow-hidden rounded-2xl aspect-[4/3] bg-slate-800 border border-slate-700 hover:border-blue-500 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent opacity-80 z-10"></div>
                      <div className="absolute inset-0 flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-500 z-0 opacity-30">
                         {['📷', '👗', '🛋️', '🚗', '🎸', '🏠', '🔧', '📦'][idx % 8]}
                      </div>
                      <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-20">
                         <h3 className="font-bold text-sm md:text-lg group-hover:text-blue-400 transition-colors">{cat}</h3>
                      </div>
                   </Link>
                 </Reveal>
               ))}
            </div>
         </div>
      </section>

      {/* --- TESTIMONIALS (REAL DB DATA) --- */}
      <section className="py-16 md:py-24 bg-blue-50">
        <div className="max-w-4xl mx-auto px-6 text-center">
           <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-8 md:mb-12">Trusted by Pinoys Everywhere 🇵🇭</h2>
           
           <div className="relative bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-blue-100">
              <div className="text-4xl text-blue-200 absolute top-6 left-6 md:top-8 md:left-8">“</div>
              
              <div className="mb-4 text-yellow-400 text-2xl">
                {'★'.repeat(featuredReview.rating)}{'☆'.repeat(5 - featuredReview.rating)}
              </div>
              
              <p className="text-lg md:text-2xl text-slate-700 font-medium leading-relaxed relative z-10">
                 {featuredReview.comment}
              </p>
              
              <div className="mt-8 flex items-center justify-center gap-4">
                 <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg md:text-xl">
                    {featuredReview.user_name.charAt(0).toUpperCase()}
                 </div>
                 <div className="text-left">
                    <p className="font-bold text-slate-900 text-sm md:text-base">{featuredReview.user_name}</p>
                    <p className="text-xs md:text-sm text-slate-500">{featuredReview.user_location}</p>
                 </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                  <button 
                    onClick={openReviewModal}
                    className="text-blue-600 font-bold text-sm hover:underline"
                  >
                    Write a Review
                  </button>
              </div>
           </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <section className="py-16 md:py-24 bg-white relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700 opacity-95"></div>
         <div className="relative z-10 max-w-4xl mx-auto px-6 text-center text-white">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Ready to declutter?</h2>
            <p className="text-blue-100 text-base md:text-lg mb-10">Join thousands of verified sellers turning their unused items into cash today.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Link to="/sell" className="px-10 py-4 md:py-5 bg-white text-blue-700 font-black rounded-full shadow-2xl hover:bg-blue-50 hover:scale-105 transition transform">
                 Start Selling Now
               </Link>
               <Link to="/explore" className="px-10 py-4 md:py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition">
                 Explore Deals
               </Link>
            </div>
         </div>
      </section>

      {/* Footer Links */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 pb-24 md:pb-12">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
            <div className="col-span-2 md:col-span-1">
               <h3 className="text-white font-black text-xl mb-4">TindaPH.</h3>
               <p>© 2024 TindaPH Inc.<br/>Made for the Philippines 🇵🇭</p>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Marketplace</h4>
               <ul className="space-y-2">
                  <li><Link to="/explore" className="hover:text-white">All Listings</Link></li>
                  <li><Link to="/explore?category=Electronics" className="hover:text-white">Electronics</Link></li>
                  <li><Link to="/explore?category=Fashion" className="hover:text-white">Fashion</Link></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Support</h4>
               <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">Help Center</a></li>
                  <li><a href="#" className="hover:text-white">Safety Tips</a></li>
                  <li><a href="#" className="hover:text-white">Contact Us</a></li>
               </ul>
            </div>
            <div>
               <h4 className="text-white font-bold mb-4">Legal</h4>
               <ul className="space-y-2">
                  <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white">Terms of Service</a></li>
               </ul>
            </div>
         </div>
      </footer>

      {showReviewModal && <ReviewModal onClose={() => setShowReviewModal(false)} onSubmit={handleReviewSubmit} />}
    </div>
  );
};

// Helper for Features
const FeatureItem: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-4">
     <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
        {icon}
     </div>
     <div>
        <h3 className="font-bold text-slate-900 text-lg">{title}</h3>
        <p className="text-slate-500 mt-1 leading-relaxed text-sm md:text-base">{desc}</p>
     </div>
  </div>
);

export default LandingPage;
