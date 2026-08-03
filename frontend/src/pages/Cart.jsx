import React from 'react';
import { Link } from 'react-router-dom';

export default function Cart() {
  return (
    <div style={{ backgroundColor: '#fffbeb', minHeight: '100vh', fontFamily: 'sans-serif', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
        <h2 style={{ color: '#92400e', marginTop: 0 }}>Your Shopping Cart</h2>
        <p style={{ color: '#6b7280' }}>Your cart is currently empty. Head back to pick your favorite varieties!</p>
        <Link to="/" style={{ display: 'inline-block', backgroundColor: '#d97706', color: '#fff', padding: '10px 20px', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, marginTop: '20px' }}>
          Back to Store
        </Link>
      </div>
    </div>
  );
}