import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './components/Checkout';
import CartDrawer from './components/CartDrawer';
import './theme.css';
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import AdminProducts from './admin/Products';
import AdminCategories from './admin/Categories';
import AdminBanners from './admin/Banners';
import AdminOrders from './admin/Orders';

function AdminGuard({children}) {
  const token = localStorage.getItem('svp_admin_token');
  return token ? children : <AdminLogin />;
}

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
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="banners" element={<AdminBanners />} />
          <Route path="orders" element={<AdminOrders />} />
        </Route>
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