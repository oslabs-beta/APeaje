import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: string | null;
  login: (token: string) => void;
  logout: () => void;
}

// for ts it will have a user (string or null), a login function, and a logout function

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// create a new context with our defined shape
// initially set to undefined

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // create a component that will provide the auth context to its children

  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    const token = Cookies.get('authToken');
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        console.log(decodedToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          console.log('Token expired');
          logout();
        } else {
          setUser(token);
        }
      } catch (error) {
        logout();
      }
    }
  }, []);

  const login = (token: string) => {
    setUser(token);
  };

  const logout = () => {
    Cookies.remove('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
  // return the AuthContext.Provider, passing it the user, login, and logout, makes these values available to all children components
};

export const useAuth = (): AuthContextType => {
  // create a custom hook for easy access to our auth context

  const context = useContext(AuthContext);
  // attempt to get the current auth context

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // if the context is undefined, it means we're trying to use it
  // outside of an AuthProvider, so we throw an error

  return context;
  // return the context if it exists
};
