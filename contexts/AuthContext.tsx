import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../utils/firebase';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithCode: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Predefined credentials for personal use
  const PERSONAL_EMAIL = "admin@mesjaucia.lt";
  const PERSONAL_PASSWORD = "199011"; // Same as the current code
  const LOGIN_CODE = "199011"; // Alternative simple code login

  useEffect(() => {
    // Set persistence to local (survives browser restarts)
    setPersistence(auth, browserLocalPersistence).then(() => {
      // Listen for authentication state changes
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        setLoading(false);
      });

      return unsubscribe;
    }).catch((error) => {
      console.error('Auth persistence error:', error);
      setLoading(false);
    });
  }, []);

  // Email/Password login
  const login = async (email: string, password: string): Promise<void> => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      // If user doesn't exist and it's the personal credentials, create account
      if (error.code === 'auth/user-not-found' && email === PERSONAL_EMAIL && password === PERSONAL_PASSWORD) {
        try {
          await createUserWithEmailAndPassword(auth, email, password);
        } catch (createError) {
          console.error('Failed to create personal account:', createError);
          throw new Error('Nepavyko sukurti asmeninio paskyros.');
        }
      } else {
        console.error('Login error:', error);
        throw new Error('Neteisingi prisijungimo duomenys.');
      }
    }
  };

  // Simple code login (creates/signs in with predefined credentials)
  const loginWithCode = async (code: string): Promise<void> => {
    if (code !== LOGIN_CODE) {
      throw new Error('Neteisingas prisijungimo kodas.');
    }

    try {
      // Try to sign in with predefined credentials
      await signInWithEmailAndPassword(auth, PERSONAL_EMAIL, PERSONAL_PASSWORD);
    } catch (error: any) {
      // If user doesn't exist, create the account
      if (error.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, PERSONAL_EMAIL, PERSONAL_PASSWORD);
        } catch (createError) {
          console.error('Failed to create personal account:', createError);
          throw new Error('Nepavyko sukurti asmeninio paskyros.');
        }
      } else {
        console.error('Code login error:', error);
        throw new Error('Prisijungimo klaida. Bandykite dar kartą.');
      }
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Nepavyko atsijungti.');
    }
  };

  const value: AuthContextType = {
    currentUser,
    login,
    loginWithCode,
    logout,
    loading,
    isAuthenticated: !!currentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 