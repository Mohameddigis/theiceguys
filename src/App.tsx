import React, { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import WhatsAppWidget from './components/WhatsAppWidget';
import Hero from './components/Hero';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import ProfessionalOrderPage from './pages/ProfessionalOrderPage';
import IndividualOrderPage from './pages/IndividualOrderPage';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [customerType, setCustomerType] = useState<'professional' | 'individual' | null>(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Check for admin route on component mount
  React.useEffect(() => {
    if (window.location.hash === '#admin') {
      setCurrentPage('admin');
      // Check if admin is already authenticated
      const isAuthenticated = localStorage.getItem('admin_authenticated') === 'true';
      const loginTime = localStorage.getItem('admin_login_time');
      
      // Session expires after 24 hours
      if (isAuthenticated && loginTime) {
        const now = Date.now();
        const sessionAge = now - parseInt(loginTime);
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (sessionAge < twentyFourHours) {
          setIsAdminAuthenticated(true);
        } else {
          // Session expired
          localStorage.removeItem('admin_authenticated');
          localStorage.removeItem('admin_login_time');
          setIsAdminAuthenticated(false);
        }
      }
    }
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setCustomerType(null);
    // Scroll to top when changing pages
    setTimeout(scrollToTop, 100);
  };

  const handleOrderClick = (type: 'professional' | 'individual') => {
    setCustomerType(type);
    setCurrentPage('order');
    // Scroll to top when starting order process
    setTimeout(scrollToTop, 100);
  };

  const handleBackToHome = () => {
    setCurrentPage('home');
    setCustomerType(null);
    setIsAdminAuthenticated(false);
    // Clear admin session when going back to home
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    // Clear URL hash
    window.location.hash = '';
    // Scroll to top when going back to home
    setTimeout(scrollToTop, 100);
  };

  const handleAdminLogin = () => {
    setIsAdminAuthenticated(true);
    // Scroll to top after login
    setTimeout(scrollToTop, 100);
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('admin_authenticated');
    localStorage.removeItem('admin_login_time');
    setCurrentPage('home');
    window.location.hash = '';
    setTimeout(scrollToTop, 100);
  };
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Hero onOrderClick={handleOrderClick} />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'blog':
        return <Blog />;
      case 'order':
        if (customerType === 'professional') {
          return <ProfessionalOrderPage onBack={handleBackToHome} />;
        } else if (customerType === 'individual') {
          return <IndividualOrderPage onBack={handleBackToHome} />;
        }
        return <Hero onOrderClick={handleOrderClick} />;
      case 'admin':
       if (isAdminAuthenticated) {
         return <AdminDashboard onBack={handleAdminLogout} />;
       } else {
         return <AdminLogin onLogin={handleAdminLogin} onBack={handleBackToHome} />;
       }
      default:
        return <Hero onOrderClick={handleOrderClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - visible on all pages except order */}
      {currentPage !== 'order' && currentPage !== 'admin' && (
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
      )}
      
      {/* Main content */}
      <main>
        {renderPage()}
      </main>
      
      {/* Footer - visible on all pages except order */}
      {currentPage !== 'order' && currentPage !== 'admin' && (
        <Footer />
      )}
      
      {/* WhatsApp Widget - Mobile only */}
      {currentPage !== 'order' && currentPage !== 'admin' && (
        <WhatsAppWidget />
      )}
    </div>
  );
}

export default App;