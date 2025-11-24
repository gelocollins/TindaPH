
import { User, Listing, Message, UserRole, Condition, AdminStats } from '../types';

// Keys for LocalStorage
const STORAGE_KEYS = {
  USERS: 'tindaph_users',
  LISTINGS: 'tindaph_listings',
  MESSAGES: 'tindaph_messages',
  CURRENT_USER: 'tindaph_current_user'
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.LISTINGS)) {
    const mockListings: Listing[] = [
      {
        id: '1',
        seller_id: 'seller1',
        seller_name: 'Juan Dela Cruz',
        seller_verified: true,
        title: 'iPhone 13 Pro Max - Blue',
        description: 'Used for 1 year, 90% battery health. Meetup Trinoma.',
        price: 35000,
        category: 'Electronics',
        condition: Condition.USED,
        images: ['https://picsum.photos/400/400'],
        location: { region: 'NCR', province: 'Metro Manila', city: 'Quezon City' },
        status: 'active',
        views: 124,
        likes: 12,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        seller_id: 'seller2',
        seller_name: 'Maria Clara',
        seller_verified: false,
        title: 'Vintage Denim Jacket',
        description: 'Rare find. Good condition.',
        price: 800,
        category: 'Fashion',
        condition: Condition.LIKE_NEW,
        images: ['https://picsum.photos/400/401'],
        location: { region: 'Region VII (Central Visayas)', province: 'Cebu', city: 'Cebu City' },
        status: 'active',
        views: 45,
        likes: 5,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        seller_id: 'seller2',
        seller_name: 'Maria Clara',
        seller_verified: false,
        title: 'Pending Approval Item',
        description: 'Waiting for admin...',
        price: 1200,
        category: 'Hobbies',
        condition: Condition.NEW,
        images: ['https://picsum.photos/400/402'],
        location: { region: 'Region VII (Central Visayas)', province: 'Cebu', city: 'Cebu City' },
        status: 'pending',
        views: 0,
        likes: 0,
        created_at: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(mockListings));
  }
  
  // Create Admin User if not exists
  const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  if (!users.find((u: User) => u.role === UserRole.ADMIN)) {
    users.push({
      id: 'admin_1',
      email: 'admin@tindaph.com',
      name: 'Super Admin',
      role: UserRole.ADMIN,
      location: { region: 'NCR', province: 'Metro Manila', city: 'Manila' },
      isVerified: true,
      joined_at: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }
};
initData();

export const authService = {
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return userStr ? JSON.parse(userStr) : null;
  },

  login: async (email: string): Promise<User> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    let user = users.find((u: User) => u.email === email);
    if (!user) throw new Error("User not found. Try 'admin@tindaph.com' for admin demo.");
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    return user;
  },

  register: async (userData: Omit<User, 'id' | 'joined_at'>): Promise<User> => {
    await delay(800);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (users.find((u: User) => u.email === userData.email)) throw new Error("Email already registered");
    
    const newUser: User = { 
      ...userData, 
      id: Math.random().toString(36).substr(2, 9),
      joined_at: new Date().toISOString() 
    };
    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(newUser));
    return newUser;
  },

  logout: async () => {
    await delay(300);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const listingService = {
  create: async (listingData: Omit<Listing, 'id' | 'created_at' | 'status' | 'views' | 'likes' | 'seller_verified'>): Promise<Listing> => {
    await delay(1000);
    const listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const newListing: Listing = {
      ...listingData,
      id: Math.random().toString(36).substr(2, 9),
      seller_verified: false, // Default
      created_at: new Date().toISOString(),
      status: 'pending', // Default to pending for moderation flow
      views: 0,
      likes: 0
    };
    listings.unshift(newListing);
    localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    return newListing;
  },

  getFeed: async (user: User | null, filters?: any): Promise<Listing[]> => {
    await delay(600);
    let listings: Listing[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    
    // Admins see everything, Users see active
    if (user?.role !== UserRole.ADMIN) {
        listings = listings.filter(l => l.status === 'active');
    }

    // Search & Category
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      listings = listings.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    if (filters?.category && filters.category !== 'All') {
      listings = listings.filter(l => l.category === filters.category);
    }

    // Location Scoring
    if (user && user.role !== UserRole.ADMIN) {
      listings.sort((a, b) => {
        const getScore = (item: Listing) => {
          let score = 0;
          if (item.location.city === user.location.city) score += 30;
          else if (item.location.province === user.location.province) score += 20;
          else if (item.location.region === user.location.region) score += 10;
          return score;
        };
        const scoreA = getScore(a);
        const scoreB = getScore(b);
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    } else {
        listings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return listings;
  },

  getById: async (id: string): Promise<Listing | undefined> => {
    await delay(300);
    const listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    return listings.find((l: Listing) => l.id === id);
  },

  updateStatus: async (id: string, status: 'active' | 'rejected' | 'sold') => {
    await delay(300);
    let listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    const idx = listings.findIndex((l: Listing) => l.id === id);
    if (idx !== -1) {
      listings[idx].status = status;
      localStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(listings));
    }
  }
};

export const chatService = {
  sendMessage: async (msg: Omit<Message, 'id' | 'created_at' | 'read'>) => {
    await delay(300);
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
    const newMessage: Message = {
      ...msg,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      read: false
    };
    messages.push(newMessage);
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    return newMessage;
  },

  getThreads: async (userId: string): Promise<any[]> => {
      await delay(300);
      const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.MESSAGES) || '[]');
      const listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      
      // Group by listing and other user
      const threads: any = {};
      
      messages.forEach((m: Message) => {
          if (m.from_user !== userId && m.to_user !== userId) return;
          
          const otherId = m.from_user === userId ? m.to_user : m.from_user;
          const key = `${m.listing_id}_${otherId}`;
          
          if (!threads[key]) {
              const listing = listings.find((l: Listing) => l.id === m.listing_id);
              const otherUser = users.find((u: User) => u.id === otherId);
              if (listing && otherUser) {
                  threads[key] = {
                      id: key,
                      listing,
                      otherUser,
                      messages: []
                  };
              }
          }
          if (threads[key]) threads[key].messages.push(m);
      });
      
      return Object.values(threads).map((t: any) => ({
          ...t,
          lastMessage: t.messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0],
          unreadCount: t.messages.filter((m: any) => m.to_user === userId && !m.read).length
      }));
  }
};

export const adminService = {
  getStats: async (): Promise<AdminStats> => {
    await delay(500);
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const listings = JSON.parse(localStorage.getItem(STORAGE_KEYS.LISTINGS) || '[]');
    
    const regionCounts: any = {};
    const catCounts: any = {};
    let volume = 0;

    listings.forEach((l: Listing) => {
        if (l.status === 'active') {
             regionCounts[l.location.region] = (regionCounts[l.location.region] || 0) + 1;
             catCounts[l.category] = (catCounts[l.category] || 0) + 1;
        }
        if (l.status === 'sold') {
            volume += l.price;
        }
    });

    return {
      totalUsers: users.length,
      totalListings: listings.length,
      totalVolume: volume,
      pendingApprovals: listings.filter((l: Listing) => l.status === 'pending').length,
      listingsByRegion: Object.keys(regionCounts).map(k => ({ region: k, count: regionCounts[k] })),
      listingsByCategory: Object.keys(catCounts).map(k => ({ category: k, count: catCounts[k] })),
      dailyViews: [{ date: 'Today', count: 154 }, { date: 'Yesterday', count: 120 }, { date: '2 days ago', count: 90 }] // Mock
    };
  }
};

// Utils
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
            resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
    });
};
