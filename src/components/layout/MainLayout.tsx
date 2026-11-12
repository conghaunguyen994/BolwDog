import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';
import { CartDrawer } from '../cart/CartDrawer';

export const MainLayout: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-cute-cream dark:bg-cute-cream-dark text-cute-brown dark:text-cute-cream font-sans transition-colors duration-200">
      <Header onOpenCart={() => setIsCartOpen(true)} />
      
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
      <MobileNav onOpenCart={() => setIsCartOpen(true)} />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
};

