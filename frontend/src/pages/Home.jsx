import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import CartDrawer from '../components/CartDrawer';
import './Home.css';

const CATEGORIES = ['All', 'Veg Pickles', 'Non-Veg Pickles', 'Spices & Powders'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobilePicklesDropdown, setMobilePicklesDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);

    const API_URL = import.meta.env.VITE_API_URL || 'https://sri-varahi-pickles.onrender.com';

    axios.get(`${API_URL}/api/products`)
      .then(response => {
        setProducts(response.data);
        setFilteredProducts(response.data);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
      });
  }, []);

  useEffect(() => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter(p => p.categoryName?.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchTerm.trim() !== '') {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  const saveAndSyncCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleQuantityChange = (productId, delta, maxStock) => {
    setQuantities(prev => {
      const current = prev[productId] || 1;
      const updated = current + delta;
      if (updated < 1 || (maxStock && updated > maxStock)) return prev;
      return { ...prev, [productId]: updated };
    });
  };

  const addToCart = (product) => {
    const qty = quantities[product.id] || 1;
    let currentCart = [...cart];
    
    const existingIndex = currentCart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += qty;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        weight: product.weight,
        imageUrl: product.imageUrl,
        quantity: qty
      });
    }

    saveAndSyncCart(currentCart);
    setCartOpen(true);
    setToastMessage(`Added ${qty}x ${product.name} to cart!`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const updateCartItemQty = (id, delta) => {
    let currentCart = [...cart];
    const index = currentCart.findIndex(item => item.id === id);
    if (index > -1) {
      currentCart[index].quantity += delta;
      if (currentCart[index].quantity <= 0) {
        currentCart.splice(index, 1);
      }
      saveAndSyncCart(currentCart);
    }
  };

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="page-container">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast">
          ✨ {toastMessage}
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="brand-container">
          <img 
            src="/images/SriVarahiLogo.png" 
            alt="Sri Vaarahi Pickels Logo" 
            className="logo" 
          />
          <div>
            <h1 className="brand-title">SRI VAARAHI PICKELS 1</h1>
            <p className="brand-subtitle">Artisanal Heritage</p>
          </div>
        </div>

        {/* Desktop Navbar View */}
        <nav className="desktop-nav">
          <Link to="/" className="desktop-nav-link">🏠 Home</Link>
          <Link to="/about" className="desktop-nav-link">📖 About Us</Link>
          <Link to="/products" className="desktop-nav-link">📦 Products</Link>
          <a href="#catalog" className="desktop-nav-link">🥒 Pickles Catalog</a>
          <Link to="/cart" className="desktop-nav-link">🛒 Full Cart</Link>
        </nav>

        <div className="header-actions">
          <button onClick={() => setCartOpen(true)} className="cart-button">
            🛒 <span className="cart-badge-desktop">{totalCartItems}</span>
          </button>
          
          {/* Mobile Hamburger Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-button" aria-label="Menu">
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
          </button>
        </div>
      </header>

      {/* Cart Drawer Component */}
      <CartDrawer 
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totalCartItems={totalCartItems}
        subtotalPrice={subtotalPrice}
        updateCartItemQty={updateCartItemQty}
      />

      {/* Mobile Top-Right Hamburger Drawer Menu */}
      {menuOpen && (
        <div className="drawer-overlay" onClick={() => setMenuOpen(false)}>
          <div className="menu-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h3 className="drawer-title">Navigation Menu</h3>
              <button onClick={() => setMenuOpen(false)} className="close-button">✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
              <Link to="/" onClick={() => setMenuOpen(false)} className="menu-link">🏠 Home</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} className="menu-link">📖 About Us</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)} className="menu-link">📦 Products</Link>
              
              <div>
                <button 
                  onClick={() => setMobilePicklesDropdown(!mobilePicklesDropdown)}
                  className="dropdown-toggle-btn"
                >
                  <span>🥒 Pickles Catalog</span>
                  <span>{mobilePicklesDropdown ? '▲' : '▼'}</span>
                </button>

                {mobilePicklesDropdown && (
                  <div className="dropdown-sub-menu">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setMenuOpen(false);
                          setMobilePicklesDropdown(false);
                        }}
                        className="dropdown-sub-item"
                        style={{
                          color: selectedCategory === cat ? '#78350f' : '#57534e',
                          fontWeight: selectedCategory === cat ? '700' : '500'
                        }}
                      >
                        • {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link to="/cart" onClick={() => setMenuOpen(false)} className="menu-link">🛒 Full Cart View</Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <section className="hero-section">
        <div className="hero-inner">
          <span className="hero-badge">100% Traditional Andhra Recipes</span>
          <h2 className="hero-title">Authentic Heritage Pickles</h2>
          <p className="hero-text">
            Prepared meticulously with cold-pressed oils, hand-picked sun-dried spices, and generations of love.
          </p>

          <div className="search-box">
            <span style={{ paddingLeft: '10px', fontSize: '14px' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search mango, chicken, garlic pickle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="clear-search-btn">✕</button>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog */}
      <main id="catalog" className="main-container">
        
        <div className="filter-row">
          <div className="filter-pills-container">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`filter-pill ${selectedCategory === cat ? 'filter-pill-active' : 'filter-pill-inactive'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <span className="item-count-text">{filteredProducts.length} items</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="no-results-box">
            <p style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</p>
            Loading items or no culinary elements match your criteria...
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => {
              const currentQty = quantities[product.id] || 1;
              const isOutOfStock = product.stockQuantity === 0;

              return (
                <div key={product.id} className="product-card">
                  
                  <div className="product-image-wrapper">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="image-fit"
                        loading="lazy"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px' }}>🥒</span>
                    )}
                    {isOutOfStock && (
                      <div className="out-of-stock-overlay">SOLD OUT</div>
                    )}
                  </div>

                  <div className="product-details">
                    <div>
                      <div className="product-category-row">
                        <span className="product-category-badge">
                          {product.categoryName || 'Pickle'}
                        </span>
                        <span className="product-weight">{product.weight}</span>
                      </div>
                      
                      <h4 className="product-title">{product.name}</h4>
                      <p className="product-description">{product.description}</p>
                    </div>

                    <div>
                      <div className="price-counter-row">
                        <span className="product-price">₹{product.price}</span>
                        
                        {!isOutOfStock && (
                          <div className="card-counter-box">
                            <button onClick={() => handleQuantityChange(product.id, -1)} className="card-counter-btn">-</button>
                            <span style={{ padding: '0 6px', fontSize: '12px', fontWeight: 700 }}>{currentQty}</span>
                            <button onClick={() => handleQuantityChange(product.id, 1, product.stockQuantity)} className="card-counter-btn">+</button>
                          </div>
                        )}
                      </div>

                      <button 
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)} 
                        className={`add-to-bag-btn ${isOutOfStock ? 'add-to-bag-disabled' : 'add-to-bag-active'}`}
                      >
                        {isOutOfStock ? 'Sold Out' : 'Add to Bag 🛒'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <Link to="/" className="bottom-nav-item-active">
          <span style={{ fontSize: '17px' }}>🏠</span>
          <span>Home</span>
        </Link>
        <a href="#catalog" className="bottom-nav-item">
          <span style={{ fontSize: '17px' }}>🥒</span>
          <span>Catalog</span>
        </a>
        <button onClick={() => setCartOpen(true)} className="bottom-nav-cart-btn">
          <span style={{ fontSize: '17px' }}>🛒</span>
          <span>Bag</span>
          {totalCartItems > 0 && <span className="bottom-nav-badge">{totalCartItems}</span>}
        </button>
        <button onClick={() => setMenuOpen(true)} className="bottom-nav-item">
          <span style={{ fontSize: '17px' }}>☰</span>
          <span>Menu</span>
        </button>
      </nav>
      
      <Footer />
    </div>
  );
}