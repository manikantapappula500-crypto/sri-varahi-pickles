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
  const shippingFee = subtotalPrice > 0 ? 50 : 0; // Optional standard shipping logic
  const grandTotal = subtotalPrice + (subtotalPrice > 0 ? shippingFee : 0);

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
        totalAmount: grandTotal
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
      <div className="checkout-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="checkout-header">
          <div className="header-title-wrapper">
            <h3>Secure Checkout</h3>
            <p>Enter your shipping destination & details</p>
          </div>
          <button onClick={onClose} className="checkout-close-btn" aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="checkout-form-layout">
          
          <div className="checkout-main-content">
            <h4 className="section-title">📦 Delivery Information</h4>
            
            <div className="form-grid">
              
              {/* Full Name */}
              <div className="form-group">
                <label>Full Name <span className="required-star">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input 
                    type="text" 
                    name="fullName" 
                    placeholder="Enter your full name" 
                    value={formData.fullName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              
              {/* Phone Number */}
              <div className="form-group">
                <label>WhatsApp Mobile Number <span className="required-star">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">📱</span>
                  <input 
                    type="tel" 
                    name="phoneNumber" 
                    placeholder="10-digit mobile number" 
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              
              {/* Delivery Address */}
              <div className="form-group full-width">
                <label>Delivery Address <span className="required-star">*</span></label>
                <div className="input-wrapper textarea-wrapper">
                  <span className="input-icon textarea-icon">🏠</span>
                  <textarea 
                    name="deliveryAddress" 
                    placeholder="House/Flat No., Street Name, Landmark" 
                    value={formData.deliveryAddress} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              {/* State */}
              <div className="form-group">
                <label>State <span className="required-star">*</span></label>
                <div className="input-wrapper select-wrapper">
                  <span className="input-icon">📍</span>
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
              </div>
              
              {/* Pincode */}
              <div className="form-group">
                <label>Pincode <span className="required-star">*</span></label>
                <div className="input-wrapper">
                  <span className="input-icon">📮</span>
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

            </div>
          </div>

          {/* Sidebar Summary & Action */}
          <div className="checkout-sidebar-summary">
            <h4 className="section-title">🛒 Order Summary</h4>
            
            <div className="summary-card">
              <div className="summary-row">
                <span>Items Subtotal</span>
                <span>₹{subtotalPrice}</span>
              </div>
              <div className="summary-row">
                <span>Shipping Fee</span>
                <span>{shippingFee === 0 ? 'FREE' : `₹${shippingFee}`}</span>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row total-row">
                <span>Total Amount (COD)</span>
                <span className="amount-highlight">₹{grandTotal}</span>
              </div>
            </div>

            <div className="payment-badge-note">
              <span>🔒 Cash on Delivery (COD) Enabled</span>
            </div>

            <button type="submit" className="place-order-btn">
              Confirm & Place Order 🚀
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}