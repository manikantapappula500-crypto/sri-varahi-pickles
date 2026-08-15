import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <section className="footer-brand">
          <div className="footer-brand-row">
            <img
              src="/images/SriVarahiLogo.png"
              alt="Sri Vaarahi Pickles"
              className="footer-logo"
            />
            <div>
              <h3>SRI VAARAHI PICKLES</h3>
              <span>Authentic • Traditional • Homemade</span>
            </div>
          </div>

          <p>
            Authentic traditional Andhra pickles made with carefully
            selected ingredients, traditional spices and generations
            of homemade flavour.
          </p>
        </section>

        <section className="footer-column">
          <h4>Quick Navigation</h4>
          <Link to="/">Home</Link>
          <Link to="/cart">Shopping Bag</Link>
          <a href="#catalog">Browse Pickles</a>
        </section>

        <section className="footer-column">
          <h4>Popular Categories</h4>
          <span>Vegetarian Pickles</span>
          <span>Chicken & Mutton Pickles</span>
          <span>Fish & Prawns Pickles</span>
          <span>Combo Packs & Podi</span>
        </section>

        <section className="footer-column">
          <h4>Get in Touch</h4>
          <span>📍 Handcrafted in Hyderabad, India</span>
          <span>📞 Direct Orders & Support</span>
          <span>✉️ support@srivaarahipickles.com</span>
        </section>
      </div>

      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} Sri Vaarahi Pickles. All rights reserved.
        </span>
        <span>Crafted with heritage & traditional flavours 🌿</span>
      </div>
    </footer>
  );
}
