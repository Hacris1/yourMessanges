import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type User = {
  _id: string;
  name: string;
  email: string;
  publicKey?: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedToken = localStorage.getItem("token");
      const savedUser = localStorage.getItem("user");

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error loading auth from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setAuth = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);

    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Limpiar claves derivadas de ambos storages
    sessionStorage.removeItem("derivedPrivateKeyPem");
    sessionStorage.removeItem("derivedPublicKeyPem");
    localStorage.removeItem("persistedPrivateKeyPem");
    localStorage.removeItem("persistedPublicKeyPem");
  };

  const value: AuthContextType = {
    token,
    user,
    isLoading,
    setAuth,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
}


