import React from 'react';
import { Link } from 'react-router-dom';

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  totalCartItems,
  subtotalPrice,
  updateCartItemQty
}) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 className="drawer-title">Your Shopping Bag ({totalCartItems})</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <p className="empty-cart-icon">🛒</p>
              Your bag is empty.<br />Explore our fresh pickle varieties!
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="cart-item-card">
                <div className="cart-item-thumb">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="image-fit" />
                  ) : (
                    <div className="fallback-emoji">🥒</div>
                  )}
                </div>
                <div className="cart-item-details">
                  <h5 className="cart-item-title">{item.name}</h5>
                  <span className="cart-item-meta">{item.weight} • ₹{item.price}</span>
                  <div className="cart-counter-row">
                    <button onClick={() => updateCartItemQty(item.id, -1)} className="counter-btn">-</button>
                    <span className="counter-value">{item.quantity}</span>
                    <button onClick={() => updateCartItemQty(item.id, 1)} className="counter-btn">+</button>
                  </div>
                </div>
                <div className="cart-item-total">
                  <span className="cart-item-price">₹{item.price * item.quantity}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-footer">
            <div className="subtotal-row">
              <span>Subtotal:</span>
              <span className="subtotal-amount">₹{subtotalPrice}</span>
            </div>
            <Link to="/cart" onClick={onClose} className="checkout-btn">
              Proceed to Checkout ➔
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}