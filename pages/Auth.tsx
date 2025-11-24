import React, { useState } from 'react';
import { authService } from '../services/mockSupabase';
import { PH_LOCATIONS } from '../constants';
import { UserRole, Location } from '../types';

interface AuthProps {
  onLogin: () => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.USER);
  
  // Location State
  const [selRegion, setSelRegion] = useState('');
  const [selProvince, setSelProvince] = useState('');
  const [selCity, setSelCity] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        if (!selCity) throw new Error("Location is required");
        await authService.register({
          email,
          name,
          role,
          location: { region: selRegion, province: selProvince, city: selCity },
          isVerified: false
        });
      } else {
        await authService.login(email);
      }
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedRegionData = PH_LOCATIONS.find(r => r.region === selRegion);
  const selectedProvinceData = selectedRegionData?.provinces.find(p => p.name === selProvince);

  return (
    <div className="p-6 flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black text-blue-600 mb-2">TindaPH.</h1>
        <p className="text-gray-500 mb-8">{isRegister ? "Create your profile to start trading." : "Welcome back!"}</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              placeholder="juan@example.com"
            />
          </div>

          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" required value={name} onChange={e => setName(e.target.value)}
                  className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">I want to be a:</label>
                <select value={role} onChange={e => setRole(e.target.value as UserRole)} className="w-full border p-2.5 rounded-lg text-sm bg-white">
                  <option value={UserRole.USER}>Buyer (Regular User)</option>
                  <option value={UserRole.SELLER}>Seller</option>
                </select>
              </div>

              <div className="p-3 bg-gray-50 rounded-lg space-y-3 border">
                <p className="text-xs font-bold text-gray-500 uppercase">My Location</p>
                
                <select value={selRegion} onChange={e => { setSelRegion(e.target.value); setSelProvince(''); setSelCity(''); }} className="w-full border p-2 text-sm rounded">
                  <option value="">Select Region</option>
                  {PH_LOCATIONS.map(r => <option key={r.region} value={r.region}>{r.region}</option>)}
                </select>

                <select disabled={!selRegion} value={selProvince} onChange={e => { setSelProvince(e.target.value); setSelCity(''); }} className="w-full border p-2 text-sm rounded disabled:opacity-50">
                  <option value="">Select Province</option>
                  {selectedRegionData?.provinces.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>

                <select disabled={!selProvince} value={selCity} onChange={e => setSelCity(e.target.value)} className="w-full border p-2 text-sm rounded disabled:opacity-50">
                  <option value="">Select City</option>
                  {selectedProvinceData?.cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </>
          )}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:bg-gray-400">
            {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Login')}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-500">
          {isRegister ? "Already have an account?" : "No account yet?"}{" "}
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-bold hover:underline">
            {isRegister ? "Login here" : "Register now"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
