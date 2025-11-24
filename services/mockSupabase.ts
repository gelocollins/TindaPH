
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Listing, Message, UserRole, Condition, AdminStats, SiteReview, ChatThread } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../constants';

// --- REAL SUPABASE CLIENT ---
const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to map DB user to App User
const mapUser = (authData: any, profileData: any): User => ({
  id: authData.id,
  email: authData.email || profileData.email,
  name: profileData.name,
  role: profileData.role as UserRole,
  location: {
    region: profileData.region,
    province: profileData.province,
    city: profileData.city
  },
  isVerified: profileData.is_verified,
  joined_at: profileData.joined_at
});

// Helper to map DB Listing to App Listing
const mapListing = (l: any, images: any[]): Listing => ({
    id: l.id,
    seller_id: l.seller_id,
    seller_name: l.users?.name || 'Unknown Seller',
    seller_verified: l.users?.is_verified || false,
    title: l.title,
    description: l.description,
    price: parseFloat(l.price),
    category: l.category,
    condition: l.condition as Condition,
    location: { region: l.region, province: l.province, city: l.city },
    status: l.status,
    views: l.views,
    likes: l.likes,
    created_at: l.created_at,
    images: images.map((img: any) => img.base64)
});

export const authService = {
  getCurrentUser: async (): Promise<User | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();
      
    if (!profile) return null;
    return mapUser(session.user, profile);
  },

  login: async (email: string): Promise<User> => {
    // For demo purposes, we are using signInWithPassword. 
    // In a real app, you would handle the password field in the UI.
    // Defaulting password for demo simplicity.
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'password123' 
    });
    
    if (error) throw new Error(error.message);
    if (!data.session) throw new Error("No session created");

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.session.user.id)
      .single();

    return mapUser(data.session.user, profile);
  },

  register: async (userData: Omit<User, 'id' | 'joined_at'>): Promise<User> => {
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: 'password123'
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Registration failed");

    // 2. Create Public Profile
    const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        region: userData.location.region,
        province: userData.location.province,
        city: userData.location.city,
        is_verified: userData.isVerified
    });

    if (profileError) throw new Error(profileError.message);

    return {
        ...userData,
        id: authData.user.id,
        joined_at: new Date().toISOString()
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  }
};

export const listingService = {
  create: async (listingData: Omit<Listing, 'id' | 'created_at' | 'status' | 'views' | 'likes' | 'seller_verified'>): Promise<Listing> => {
    // 1. Insert Listing
    const { data: listing, error: lError } = await supabase.from('listings').insert({
        seller_id: listingData.seller_id,
        title: listingData.title,
        description: listingData.description,
        price: listingData.price,
        category: listingData.category,
        condition: listingData.condition,
        region: listingData.location.region,
        province: listingData.location.province,
        city: listingData.location.city,
        status: 'pending'
    }).select().single();

    if (lError) throw new Error(lError.message);

    // 2. Insert Images (Base64)
    if (listingData.images && listingData.images.length > 0) {
        const imageInserts = listingData.images.map(b64 => ({
            listing_id: listing.id,
            base64: b64
        }));
        await supabase.from('listing_images').insert(imageInserts);
    }

    return {
        ...listingData,
        id: listing.id,
        created_at: listing.created_at,
        status: 'pending',
        views: 0,
        likes: 0,
        seller_verified: false,
        images: listingData.images
    };
  },

  getFeed: async (user: User | null, filters?: any): Promise<Listing[]> => {
    let query = supabase.from('listings').select(`
        *,
        users!seller_id (name, is_verified),
        listing_images (base64)
    `);

    if (user?.role !== UserRole.ADMIN) {
        query = query.eq('status', 'active');
    } 

    if (filters?.category && filters.category !== 'All') {
        query = query.eq('category', filters.category);
    }

    if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error fetching feed:", error);
        return [];
    }

    let listings = data.map((l: any) => mapListing(l, l.listing_images || []));

    // Client-side location sorting 
    if (user && user.role !== UserRole.ADMIN) {
        listings.sort((a, b) => {
          let scoreA = 0, scoreB = 0;
          if (a.location.city === user.location.city) scoreA += 30;
          if (a.location.province === user.location.province) scoreA += 20;
          if (a.location.region === user.location.region) scoreA += 10;

          if (b.location.city === user.location.city) scoreB += 30;
          if (b.location.province === user.location.province) scoreB += 20;
          if (b.location.region === user.location.region) scoreB += 10;
          
          return scoreB - scoreA;
        });
    } else {
        listings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return listings;
  },

  getById: async (id: string): Promise<Listing | undefined> => {
    const { data, error } = await supabase
        .from('listings')
        .select(`*, users!seller_id(name, is_verified), listing_images(base64)`)
        .eq('id', id)
        .single();

    if (error || !data) return undefined;
    return mapListing(data, data.listing_images || []);
  },

  updateStatus: async (id: string, status: 'active' | 'rejected' | 'sold') => {
    await supabase.from('listings').update({ status }).eq('id', id);
  },
  
  // --- FETCH REVIEWS FROM DB ---
  getReviews: async (): Promise<SiteReview[]> => {
      const { data } = await supabase
        .from('site_reviews')
        .select(`
            id,
            rating,
            comment,
            created_at,
            users (name, city)
        `)
        .limit(10)
        .order('created_at', { ascending: false });

      if (!data) return [];
      
      return data.map((r: any) => ({
          id: r.id,
          user_name: r.users?.name || 'Anonymous',
          user_location: r.users?.city || 'Philippines',
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at
      }));
  },

  // --- ADD REVIEW TO DB ---
  addReview: async (review: { user_id: string, rating: number, comment: string }) => {
     const { error } = await supabase.from('site_reviews').insert({
         user_id: review.user_id,
         rating: review.rating,
         comment: review.comment
     });
     if (error) throw new Error(error.message);
  }
};

export const chatService = {
  sendMessage: async (msg: Omit<Message, 'id' | 'created_at' | 'read'>) => {
    const { data, error } = await supabase.from('messages').insert({
        from_user: msg.from_user,
        to_user: msg.to_user,
        listing_id: msg.listing_id,
        message: msg.message
    }).select().single();
    
    if (error) throw error;
    return data;
  },

  getThreads: async (userId: string): Promise<ChatThread[]> => {
    const { data: messages } = await supabase
        .from('messages')
        .select(`*, listings(title, price, listing_images(base64))`)
        .or(`from_user.eq.${userId},to_user.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (!messages) return [];

    const threadsMap: any = {};
    const otherUserIds = new Set<string>();
    
    messages.forEach((m: any) => {
        const other = m.from_user === userId ? m.to_user : m.from_user;
        otherUserIds.add(other);
    });

    const { data: users } = await supabase.from('users').select('id, name').in('id', Array.from(otherUserIds));
    const userMap = new Map(users?.map((u:any) => [u.id, u]));

    messages.forEach((m: any) => {
        const otherId = m.from_user === userId ? m.to_user : m.from_user;
        const key = `${m.listing_id}_${otherId}`;
        
        if (!threadsMap[key]) {
            const otherUser = userMap.get(otherId) || { id: otherId, name: 'Unknown' };
            const images = m.listings?.listing_images || [];
            const img = images.length > 0 ? images[0].base64 : null;
            
            threadsMap[key] = {
                id: key,
                listing: { ...m.listings, images: img ? [img] : [] },
                otherUser: otherUser,
                messages: [],
                unreadCount: 0
            };
        }
        threadsMap[key].messages.push(m);
        if (m.to_user === userId && !m.is_read) {
            threadsMap[key].unreadCount++;
        }
    });

    return Object.values(threadsMap).map((t: any) => ({
        ...t,
        lastMessage: t.messages[0] 
    }));
  }
};

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    const { count: totalUsers } = await supabase.from('users').select('*', { count: 'exact', head: true });
    const { count: totalListings } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: pending } = await supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'pending');
    
    return {
      totalUsers: totalUsers || 0,
      totalListings: totalListings || 0,
      totalVolume: 540000, 
      pendingApprovals: pending || 0,
      listingsByRegion: [{ region: 'NCR', count: 12 }],
      listingsByCategory: [{ category: 'Electronics', count: 5 }],
      dailyViews: [{ date: 'Today', count: 20 }]
    };
  }
};

export const compressImage = async (base64: string, maxWidth = 800): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ratio = maxWidth / img.width;
            canvas.width = maxWidth;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        };
    });
};
