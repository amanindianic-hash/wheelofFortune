'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { AuthUser, Client } from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  client: Client | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  client: null,
  loading: true,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setClient(data.client);
      } else {
        setUser(null);
        setClient(null);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Skip auth check for widget pages (public embed)
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/widget')) {
      setLoading(false);
      return;
    }
    refresh();
  }, []);

  return (
    <AuthContext.Provider value={{ user, client, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
