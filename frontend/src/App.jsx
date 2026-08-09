import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Removed BrowserRouter as Router
import Home from './pages/Home';
import Cart from './pages/Cart';
import Checkout from './components/Checkout';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
    </Routes>
  );
}

export default App;