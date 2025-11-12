import { useState, useEffect } from 'react';
import { Link, useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, ShieldCheck, Lock, Mail, Eye, EyeOff, LogIn } from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck className="h-5 w-5 text-indigo-400" />,
    title: "Secure Authentication",
    description: "Enterprise-grade security to protect your data"
  },
  {
    icon: <Lock className="h-5 w-5 text-indigo-400" />,
    title: "Privacy Focused",
    description: "Your data is encrypted and never shared"
  }
];

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      document.documentElement.style.setProperty('--mouse-x', x.toString());
      document.documentElement.style.setProperty('--mouse-y', y.toString());
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      const redirectTo = new URLSearchParams(location.split('?')[1]).get('redirectTo') || '/';
      toast.success('Login successful! Welcome back.');
      navigate(redirectTo);
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const gradientStyle = {
    '--gradient-start': 'rgba(79, 70, 229, 0.15)',
    '--gradient-end': 'rgba(168, 85, 247, 0.1)',
    background: `
      radial-gradient(
        circle at calc(var(--mouse-x, 0.5) * 100%) calc(var(--mouse-y, 0.5) * 100%),
        var(--gradient-start),
        var(--gradient-end)
      ),
      #0f172a`,
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 opacity-20">
        <div className="absolute inset-0" style={gradientStyle}></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] [mask-image:linear-gradient(0deg,transparent,black)]"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-gray-900 p-1 rounded-full">
              <img
                className="h-16 w-auto"
                src="/AegisOS Logo.png"
                alt="AegisOS Logo"
              />
            </div>
          </div>
        </div>
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-8 text-center text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-400 sm:text-5xl"
        >
          Welcome Back
        </motion.h2>
        <p className="mt-4 text-center text-lg text-gray-400 max-w-2xl mx-auto">
          Sign in to access your AegisOS dashboard and continue your work
        </p>
      </div>

      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Features */}
          <div className="space-y-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start space-x-4 p-4 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex-shrink-0 p-2 bg-indigo-500/10 rounded-lg">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{feature.title}</h3>
                  <p className="mt-1 text-gray-400">{feature.description}</p>
                </div>
              </motion.div>
            ))}
            
            <div className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
              <h3 className="text-lg font-medium text-white mb-3">Need help?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Contact our support team for assistance with your account.
              </p>
              <Button variant="outline" className="w-full bg-transparent border-gray-600 hover:bg-gray-700 text-gray-200">
                Contact Support
              </Button>
            </div>
          </div>

          {/* Right side - Login Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700/50 shadow-2xl w-full max-w-md"
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">Sign In</h3>
              <p className="text-sm text-gray-400">
                New user?{' '}
                <Link href="/register" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
                  Create account
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-500 hover:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox
                      id="rememberMe"
                      checked={formData.rememberMe}
                      onCheckedChange={(checked) => 
                        setFormData({...formData, rememberMe: checked as boolean})
                      }
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
                    />
                    <label
                      htmlFor="rememberMe"
                      className="ml-2 block text-sm text-gray-400"
                    >
                      Remember me
                    </label>
                  </div>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-900/30 border border-red-800 rounded-lg">
                    {error}
                  </div>
                )}
              </div>

              <div>
                <Button
                  type="submit"
                  className="w-full group relative flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </form>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button variant="outline" type="button" disabled={isLoading}>
              <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              Twitter
            </Button>
            <Button variant="outline" type="button" disabled={isLoading}>
              <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.114 2.504.336 1.909-1.295 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.699 1.028 1.595 1.028 2.688 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.196 20 14.425 20 10.017 20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
