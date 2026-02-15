import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { ShieldAlert, Bell, Home, TestTube, BarChart3, MapPin, Menu, X } from "lucide-react";
import { NotificationSettingsModal } from './NotificationSettingsModal';

// Reusable Header Component
function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Get city from localStorage or use default
  const [currentCity, setCurrentCity] = useState(() => {
    return localStorage.getItem('selectedCity') || localStorage.getItem('notificationCity') || 'Mumbai';
  });

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Testing Lab', href: '/testing', icon: TestTube },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  ];

  // Listen for city changes from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'selectedCity' || e.key === 'notificationCity') {
        const newCity = e.newValue || 'Mumbai';
        setCurrentCity(newCity);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    const interval = setInterval(() => {
      const storedCity = localStorage.getItem('selectedCity') || localStorage.getItem('notificationCity');
      if (storedCity && storedCity !== currentCity) {
        setCurrentCity(storedCity);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentCity]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            {/* Logo - Always visible */}
            <div className="flex items-center">
              <Link className="flex items-center space-x-2" to="/dashboard">
                <ShieldAlert className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <span className="hidden sm:inline-block font-bold text-gray-900">ResqNet</span>
                <span className="sm:hidden font-bold text-gray-900">ResqNet</span>
              </Link>
            </div>

            {/* Desktop Navigation - Hidden on mobile */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Current City Display - Hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <MapPin className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[150px]">
                  <span className="hidden lg:inline">Monitoring:</span> {currentCity}
                </span>
              </div>

              {/* Mobile City Indicator - Visible only on mobile */}
              <div className="sm:hidden flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                <MapPin className="h-3 w-3 text-gray-500" />
                <span className="text-xs font-medium text-gray-700 truncate max-w-[80px]">
                  {currentCity}
                </span>
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => setNotificationModalOpen(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors group flex-shrink-0"
                aria-label="Notification settings"
              >
                <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                
                {/* Tooltip - Hidden on mobile */}
                <div className="hidden sm:block absolute right-0 top-full mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap">
                  Setup notifications for {currentCity}
                </div>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t mt-2 animate-fade-in">
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
                
                {/* Mobile City Info */}
                <div className="px-4 py-3 text-sm text-gray-500 border-t pt-4 mt-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Currently monitoring: <span className="font-medium text-gray-900">{currentCity}</span></span>
                  </div>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
        defaultCity={currentCity}
      />
    </>
  );
}

// The Main Layout Component
export function DashboardLayout() {
  return (
    <div className="relative flex min-h-screen flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">ResqNet AI Disaster Monitoring</span>
            </div>
            <div className="text-xs sm:text-sm text-gray-600 text-center">
              <div>© ResqNnet-Disaster Prediction System</div>
              
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}