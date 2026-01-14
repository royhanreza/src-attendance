import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { getAuthData, saveAuthData, clearAuthData } from "../lib/auth";
import type { AuthUser } from "../lib/auth";

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize with user from localStorage
  const [user, setUser] = useState<AuthUser | null>(() => getAuthData());
  // isLoading is false since we load synchronously from localStorage
  const isLoading = false;

  const login = (userData: AuthUser) => {
    setUser(userData);
    saveAuthData(userData);
  };

  const logout = () => {
    setUser(null);
    clearAuthData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
