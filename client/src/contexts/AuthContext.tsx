import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'wouter';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        // TODO: Replace with actual token verification
        const token = localStorage.getItem('token');
        if (token) {
          // TODO: Verify token with backend
          // const response = await fetch('/api/auth/me', {
          //   headers: { 'Authorization': `Bearer ${token}` }
          // });
          // const userData = await response.json();
          // setUser(userData);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual login API call
      // const response = await fetch('/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      
      // Mock response for now
      const data = {
        user: { id: '1', email, name: 'Demo User', role: 'admin' },
        token: 'mock-jwt-token'
      };

      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${data.user.name || data.user.email}!`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          name: `${firstName} ${lastName}`,
          firstName,
          lastName
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const data = await response.json();
      
      if (!data.user) {
        throw new Error('No user data received');
      }

      // Store the token if provided
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      
      setUser(data.user);
      
      toast({
        title: 'Registration successful',
        description: `Welcome to AegisOS, ${data.user.name || data.user.email}!`,
      });
      
      // Redirect to login page after successful registration
      navigate('/login');
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: 'Registration failed',
        description: 'Could not create your account. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
