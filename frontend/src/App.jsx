import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './components/Checkout';
import CartDrawer from './components/CartDrawer';

function App() {
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Cart helper metrics
  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const updateCartItemQty = (id, delta) => {
    setCart(prevCart => 
      prevCart.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        {/* Optional: Keep route if user navigates directly to /checkout */}
        <Route path="/checkout" element={<Checkout isOpen={true} onClose={() => {}} cart={cart} />} />
      </Routes>

      {/* Global Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        totalCartItems={totalCartItems}
        subtotalPrice={subtotalPrice}
        updateCartItemQty={updateCartItemQty}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Global Checkout Modal Popup */}
      <Checkout 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart} 
      />
    </>
  );
}

export default App;