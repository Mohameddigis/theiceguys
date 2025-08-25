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

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [customerType, setCustomerType] = useState<'professional' | 'individual' | null>(null);

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
    // Scroll to top when going back to home
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
      default:
        return <Hero onOrderClick={handleOrderClick} />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - visible on all pages except order */}
      {currentPage !== 'order' && (
        <Header currentPage={currentPage} onPageChange={handlePageChange} />
      )}
      
      {/* Main content */}
      <main>
        {renderPage()}
      </main>
      
      {/* Footer - visible on all pages except order */}
      {currentPage !== 'order' && (
        <Footer />
      )}
      
      {/* WhatsApp Widget - Mobile only */}
      {currentPage !== 'order' && (
        <WhatsAppWidget />
      )}
    </div>
  );
}

export default App;