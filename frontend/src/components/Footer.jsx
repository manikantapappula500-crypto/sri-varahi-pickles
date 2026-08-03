import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#292524', color: '#f5f5f4', padding: '40px 24px 24px 24px', marginTop: '60px', borderTop: '4px solid #78350f' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '30px', marginBottom: '30px' }}>
        
        {/* Column 1: Brand Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <img 
              src="/images/SriVarahiLogo.png" 
              alt="Sri Vaarahi Pickels Logo" 
              style={{ height: '32px', width: '32px', objectFit: 'contain', borderRadius: '50%', backgroundColor: '#fff' }} 
            />
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#fef3c7', letterSpacing: '-0.3px' }}>SRI VAARAHI PICKELS</h4>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#a8a29e', lineHeight: '1.6' }}>
            Authentic traditional Andhra pickles made with pure cold-pressed oils, hand-picked farm spices, and generations of love.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quick Navigation</h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <li><Link to="/" style={{ color: '#a8a29e', textDecoration: 'none' }}>Home Catalog</Link></li>
            <li><Link to="/cart" style={{ color: '#a8a29e', textDecoration: 'none' }}>Shopping Bag</Link></li>
            <li><a href="#catalog" style={{ color: '#a8a29e', textDecoration: 'none' }}>Browse Varieties</a></li>
          </ul>
        </div>

        {/* Column 3: Categories */}
        <div>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Popular Categories</h5>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: '#a8a29e' }}>
            <li>Veg Pickles (Mango, Lemon, Tomato)</li>
            <li>Non-Veg Pickles (Chicken, Prawns, Mutton)</li>
            <li>Traditional Spices & Powders</li>
          </ul>
        </div>

        {/* Column 4: Contact & Location */}
        <div>
          <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: '#fef3c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Get in Touch</h5>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a8a29e' }}>📍 Handcrafted in Hyderabad, India</p>
          <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#a8a29e' }}>📞 Direct Orders & Support Available</p>
          <p style={{ margin: 0, fontSize: '12px', color: '#a8a29e' }}>✉️ support@srivaarahipickels.com</p>
        </div>

      </div>

      {/* Bottom Bar / Copyright */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid #44403c', paddingTop: '20px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#78716c', gap: '10px' }}>
        <span>© {new Date().getFullYear()} Sri Vaarahi Pickels. All rights reserved.</span>
        <span>Crafted with heritage and traditional flavors 🥒</span>
      </div>
    </footer>
  );
}