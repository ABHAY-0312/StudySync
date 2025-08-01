"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

// Define the shape of the context data.
interface AuthContextProps {
  user: User | null; // The Firebase user object, or null if not logged in.
  loading: boolean;   // True while checking the initial auth state.
}

// Create the React Context with a default value.
const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
});

// A custom hook to make it easy to access the auth context in any component.
export const useAuth = () => useContext(AuthContext);

/**
 * The AuthProvider component is a wrapper that provides the authentication state
 * (user and loading status) to all of its children. It should be placed at the
 * root of the application layout.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Firebase is not configured (e.g., missing .env.local), auth will be null.
    // In this case, we stop loading and the app proceeds without authentication.
    if (!auth) {
      setLoading(false);
      return;
    }

    // `onAuthStateChanged` is a Firebase listener that fires whenever the user's
    // sign-in state changes. It returns an `unsubscribe` function.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user); // Set the user object (or null if logged out).
      setLoading(false); // Set loading to false once the initial check is complete.
    });

    // The cleanup function for the useEffect hook. It's called when the component
    // unmounts, ensuring we don't have memory leaks from the listener.
    return () => unsubscribe();
  }, []);

  // Provide the user and loading state to all descendant components.
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
