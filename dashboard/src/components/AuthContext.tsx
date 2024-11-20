import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import Cookies from 'js-cookie';
import { jwtDecode , JwtPayload } from 'jwt-decode';

interface AuthContextType {
  login: (username: string, role: string) => void;
  logout: () => void;
  isAuth: Boolean;
  username: string;
  role: string;
  loading: Boolean
}

// for ts it will have a user (string or null), a login function, and a logout function

const AuthContext = createContext<AuthContextType | undefined>(undefined);
// create a new context with our defined shape
// initially set to undefined

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  // create a component that will provide the auth context to its children

  const [username, setUsername] = useState<string | null >(null);
  const [role, setRole] = useState<string | null >(null);
  const [isAuth, setAuth] = useState<Boolean>(false);
  const [loading, setLoading] = useState<Boolean>(true);

  useEffect(() => {
    //console.log('autheffect');
    const token = Cookies.get('authToken');
    //console.log('token', token);
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        //console.log('decoded',decodedToken);
        const currentTime = Date.now() / 1000;

        if (decodedToken.exp < currentTime) {
          console.log('Token expired');
          logout();
        } else {
          setAuth(true);
          setUsername(decodedToken.username);
          setRole(decodedToken.role)
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false)
      }
    } else setLoading(false)
  }, []);

  const login = (username: string, role: string) => {
    setUsername(username);
    setRole(role);
    setAuth(true);
    setLoading(false)
  };

  const logout = () => {
    Cookies.remove('authToken');
    setUsername(null);
    setRole(null);
    setAuth(false);
    setLoading(false)
  };

  return (
    <AuthContext.Provider value={{ login, logout, isAuth, username, role, loading }}>
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
