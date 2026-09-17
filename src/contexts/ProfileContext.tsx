import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { BusinessProfile } from '../types';
import { getProfile, upsertProfile } from '../services/profile';
import { useAuth } from './AuthContext';

interface ProfileContextValue {
  profile: BusinessProfile | null;
  loading: boolean;
  hasCompletedOnboarding: boolean;
  updateProfile: (fields: Partial<BusinessProfile>) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await getProfile(user.id);
    setProfile(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const updateProfile = async (fields: Partial<BusinessProfile>) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await upsertProfile(user.id, fields);
    if (data) setProfile(data);
    return { error: error ?? null };
  };

  const hasCompletedOnboarding = Boolean(profile?.business_name && profile?.sector);

  return (
    <ProfileContext.Provider value={{ profile, loading, hasCompletedOnboarding, updateProfile, refreshProfile: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
