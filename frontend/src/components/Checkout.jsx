import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Checkout.css';

export default function Checkout({ isOpen, onClose, cart = [] }) {
  const navigate = useNavigate();
  
  const activeCart = cart.length > 0 ? cart : JSON.parse(localStorage.getItem('cart') || '[]');
  
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    deliveryAddress: '',
    state: '',
    pincode: ''
  });

  const subtotalPrice = activeCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    
    if (activeCart.length === 0) {
      alert('Your cart is empty!');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'https://sri-varahi-pickles.onrender.com';

    try {
      const response = await axios.post(`${API_URL}/api/orders/checkout`, {
        customer: {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          deliveryAddress: formData.deliveryAddress,
          state: formData.state,
          pincode: formData.pincode
        },
        paymentMethod: 'COD',
        items: activeCart,
        totalAmount: subtotalPrice
      });

      if (response.status === 200 || response.status === 201) {
        alert('Order placed successfully!');
        localStorage.removeItem('cart');
        if (onClose) onClose();
        navigate('/');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Failed to place order. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="checkout-header">
          <h3>Delivery & Payment Details</h3>
          <button onClick={onClose} className="checkout-close-btn" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="checkout-form">
          <div className="checkout-fields">
            
            <div className="form-group">
              <label>Full Name *</label>
              <input 
                type="text" 
                name="fullName" 
                placeholder="Enter your full name" 
                value={formData.fullName} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Mobile Number (WhatsApp) *</label>
              <input 
                type="tel" 
                name="phoneNumber" 
                placeholder="10-digit mobile number" 
                value={formData.phoneNumber} 
                onChange={handleChange} 
                required 
              />
            </div>
            
            <div className="form-group">
              <label>Delivery Address *</label>
              <textarea 
                name="deliveryAddress" 
                placeholder="House/Flat No., Street, Landmark" 
                value={formData.deliveryAddress} 
                onChange={handleChange} 
                required 
              />
            </div>

            <div className="form-group">
              <label>State (For Shipping Calculation) *</label>
              <select 
                name="state" 
                value={formData.state} 
                onChange={handleChange} 
                required
              >
                <option value="" disabled>Select your delivery State</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
                <option value="Telangana">Telangana</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Kerala">Kerala</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Pincode *</label>
              <input 
                type="text" 
                name="pincode" 
                placeholder="6-digit pincode" 
                value={formData.pincode} 
                onChange={handleChange} 
                required 
              />
            </div>

          </div>

          <div className="checkout-footer-summary">
            <div className="summary-total">
              <span>Total Amount:</span>
              <span className="amount-highlight">₹{subtotalPrice}</span>
            </div>
            <button type="submit" className="place-order-btn">Confirm & Place Order</button>
          </div>
        </form>

      </div>
    </div>
  );
}