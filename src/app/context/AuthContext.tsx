import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { apiFetch, clearSession, getToken, setSession, USER_KEY } from '../lib/api';

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(getToken());
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiFetch<{ token: string; user: unknown }>('/api/auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ username, password }),
      });
      setSession(response.token, response.user);
      setIsAuthenticated(true);
      return true;
    } catch {
      clearSession();
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    sessionStorage.removeItem(USER_KEY);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
