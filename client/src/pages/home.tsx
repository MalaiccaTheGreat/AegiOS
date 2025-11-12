import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Lock, Unlock, Rocket, Shield, BarChart, Cpu, Zap, Globe, Users, Briefcase, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useAdmin } from "@/contexts/AdminContext";

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  const { isAdmin, toggleAdmin } = useAdmin();
  const [_, navigate] = useLocation();

  useEffect(() => {
    setMounted(true);
    // Check for admin mode in localStorage on component mount
    if (localStorage.getItem('adminMode') === 'true') {
      toggleAdmin();
      navigate('/app/admin/dashboard');
    }
  }, []);

  if (!mounted) {
    return null; // Prevent hydration mismatch
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/20 to-transparent"></div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <img 
                  className="h-10 w-auto" 
                  src="/AegisOS Logo.png" 
                  alt="AegisOS Logo" 
                />
                <span className="ml-3 text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                  AegisOS
                </span>
              </motion.div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/app/admin/login">
                <Button variant="outline" className="bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                  Admin
                </Button>
              </Link>
              
              {/* Sign In Button */}
              <Link href="/login">
                <Button variant="outline" className="bg-transparent border-white/20 hover:bg-white/10 hover:text-white">
                  Sign In
                </Button>
              </Link>
              
              {/* Get Started Button */}
              <Link href="/register">
                <Button className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                  Get Started 
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 lg:max-w-2xl lg:w-full">
            <motion.main 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:pt-16"
            >
              <div className="text-center lg:text-left">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-400 mb-4"
                >
                  <Rocket className="h-4 w-4 mr-2" />
                  The Future of Business Management
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl"
                >
                  <span className="block text-white">Transform Your</span>
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-500">
                    Business Operations
                  </span>
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.8 }}
                  className="mt-6 text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0"
                >
                  Harness the power of AI-driven business management. Streamline operations, 
                  automate workflows, and gain real-time insights to drive growth and efficiency.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                >
                  <Link href="/register">
                    <Button 
                      size="lg" 
                      className="group relative overflow-hidden px-8 py-6 text-lg font-medium bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      <span className="relative z-10 flex items-center">
                        Get Started for Free
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                      <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    </Button>
                  </Link>
                  
                  <Link href="#features">
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="px-8 py-6 text-lg font-medium border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                      Explore Features
                    </Button>
                  </Link>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.2 }}
                  className="mt-12 flex flex-wrap justify-center lg:justify-start gap-6"
                >
                  <div className="flex items-center">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-8 w-8 rounded-full border-2 border-gray-800 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      ))}
                    </div>
                    <div className="ml-3 text-left">
                      <p className="text-sm text-gray-300">Trusted by 10,000+ businesses</p>
                      <div className="flex items-center text-indigo-400 text-xs">
                        <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>99.9% Uptime</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.main>
          </div>
        </div>
        
        {/* Hero Image */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 sm:mt-24 lg:mt-0 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2"
        >
          <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:h-full lg:max-w-none lg:px-0">
            <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-2xl sm:h-72 md:h-96 lg:h-full">
              <img
                className="h-full w-full object-cover object-top"
                src="https://images.unsplash.com/photo-1573497620053-ea5300f94f21?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2574&q=80"
                alt="African professionals collaborating in a modern office"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
              
              {/* Floating UI Elements */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="absolute bottom-8 left-8 right-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-indigo-500/10">
                    <BarChart className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-white">Real-time Analytics</p>
                    <p className="text-xs text-gray-300">Track your business performance</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.2 }}
                className="absolute top-8 right-8 p-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/10"
              >
                <Zap className="h-5 w-5 text-yellow-400" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Features Section */}
      <div id="features" className="relative py-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-full filter blur-3xl opacity-30"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-indigo-500/10 text-indigo-400 mb-6">
              <Cpu className="h-4 w-4 mr-2" />
              POWERFUL FEATURES
            </span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Everything You Need to Succeed
            </h2>
            <p className="mt-6 text-xl text-gray-300 max-w-3xl mx-auto">
              Our platform is packed with powerful features designed to streamline your business operations and drive growth.
            </p>
          </motion.div>

          <div className="mt-20">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <BarChart className="h-8 w-8 text-indigo-400" />,
                  title: "Real-time Analytics",
                  description: "Get instant insights into your business performance with our powerful analytics dashboard.",
                  color: "from-indigo-500/10 to-indigo-500/5"
                },
                {
                  icon: <Users className="h-8 w-8 text-purple-400" />,
                  title: "Team Collaboration",
                  description: "Seamlessly collaborate with your team in real-time, no matter where they are.",
                  color: "from-purple-500/10 to-purple-500/5"
                },
                {
                  icon: <Shield className="h-8 w-8 text-blue-400" />,
                  title: "Enterprise Security",
                  description: "Bank-grade security to keep your data safe and compliant with regulations.",
                  color: "from-blue-500/10 to-blue-500/5"
                },
                {
                  icon: <Briefcase className="h-8 w-8 text-cyan-400" />,
                  title: "Project Management",
                  description: "Manage projects efficiently with our intuitive task and timeline tools.",
                  color: "from-cyan-500/10 to-cyan-500/5"
                },
                {
                  icon: <Globe className="h-8 w-8 text-green-400" />,
                  title: "Global Reach",
                  description: "Operate across borders with multi-currency and multi-language support.",
                  color: "from-green-500/10 to-green-500/5"
                },
                {
                  icon: <Zap className="h-8 w-8 text-yellow-400" />,
                  title: "AI-Powered",
                  description: "Leverage artificial intelligence to automate tasks and gain insights.",
                  color: "from-yellow-500/10 to-yellow-500/5"
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.color} border border-white/5 hover:border-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10`}
                >
                  <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 mb-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">
                      {feature.description}
                    </p>
                    <button 
                      onClick={() => {
                        const contactSection = document.getElementById('contact');
                        if (contactSection) {
                          contactSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="mt-4 inline-flex items-center text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors focus:outline-none"
                    >
                      Learn more
                      <ArrowRight className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block">Start your free trial today.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Join thousands of businesses that use AegisOS to manage their operations.
          </p>
          <Link href="/register">
            <Button size="lg" className="mt-8 px-8 py-4 text-base font-medium">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-gray-900 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Get in Touch
            </h2>
            <p className="mt-4 text-xl text-gray-300">
              Have questions? Our team is here to help.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500/10 p-3 rounded-lg">
                  <Mail className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Email us</h3>
                  <p className="mt-1 text-gray-400">aegios@gmail.com</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500/10 p-3 rounded-lg">
                  <Phone className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Contact</h3>
                  <p className="mt-1 text-gray-400">+260 972 147 401</p>
                </div>
              </div>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-indigo-500/10 p-3 rounded-lg">
                  <MapPin className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-white">Visit Us</h3>
                  <p className="mt-1 text-gray-400">Second Class Area, Accra Road,<br />Kitwe, Zambia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; {new Date().getFullYear()} AegisOS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
