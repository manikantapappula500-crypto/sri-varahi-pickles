import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const CATEGORIES = ['All', 'Veg Pickles', 'Non-Veg Pickles', 'Spices & Powders'];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  
  // Dropdown state for Mobile Menu (Pickles sub-menu)
  const [mobilePicklesDropdown, setMobilePicklesDropdown] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  const [quantities, setQuantities] = useState({});
  const [cart, setCart] = useState([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(savedCart);

    axios.get(`${import.meta.env.VITE_API_URL || 'https://sri-varahi-pickles.onrender.com'}/api/products`)
      .then(response => {
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setLoading(false);
      });
  }, []);

  // Filter logic
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

  if (loading) {
    return (
      <div style={styles.loaderContainer}>
        <div style={styles.loaderContent}>
          <span style={{ fontSize: '28px' }}>🥒</span>
          <span>Preparing traditional flavors...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageContainer}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={styles.toast}>
          ✨ {toastMessage}
        </div>
      )}

      {/* Header */}
      <header style={styles.header}>
        <div style={styles.brandContainer}>
          <img 
            src="/images/SriVarahiLogo.png" 
            alt="Sri Vaarahi Pickels Logo" 
            style={styles.logo} 
          />
          <div>
            <h1 style={styles.brandTitle}>VAARAHI PICKELS</h1>
            <p style={styles.brandSubtitle}>Artisanal Heritage</p>
          </div>
        </div>

        {/* Desktop Navigation View (No 3 lines menu in system view) */}
        <nav style={styles.desktopNav}>
          <Link to="/" style={styles.desktopNavLink}>Home</Link>
          <Link to="/about" style={styles.desktopNavLink}>About Us</Link>
          <Link to="/products" style={styles.desktopNavLink}>Products</Link>
          <a href="#catalog" style={styles.desktopNavLink}>Pickles</a>
        </nav>

        <div style={styles.headerActions}>
          <button onClick={() => setCartOpen(true)} style={styles.cartButton}>
            🛒 Cart <span style={styles.cartBadge}>{totalCartItems}</span>
          </button>
          
          {/* Mobile-Only Hamburger Toggle Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={styles.mobileMenuButton} aria-label="Menu">
            <span style={styles.hamburgerBar}></span>
            <span style={styles.hamburgerBar}></span>
            <span style={styles.hamburgerBar}></span>
          </button>
        </div>
      </header>

      {/* Cart Drawer */}
      {cartOpen && (
        <div style={styles.drawerOverlay} onClick={() => setCartOpen(false)}>
          <div style={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3 style={styles.drawerTitle}>Your Shopping Bag ({totalCartItems})</h3>
              <button onClick={() => setCartOpen(false)} style={styles.closeButton}>✕</button>
            </div>

            <div style={styles.drawerBody}>
              {cart.length === 0 ? (
                <div style={styles.emptyCart}>
                  <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>🛒</p>
                  Your cart is empty.<br/>Explore our fresh pickle varieties!
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} style={styles.cartItemCard}>
                    <div style={styles.cartItemThumb}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={styles.imageFit} />
                      ) : (
                        <div style={styles.fallbackEmoji}>🥒</div>
                      )}
                    </div>
                    <div style={{ flexGrow: 1 }}>
                      <h5 style={styles.cartItemTitle}>{item.name}</h5>
                      <span style={styles.cartItemMeta}>{item.weight} • ₹{item.price}</span>
                      <div style={styles.cartCounterRow}>
                        <button onClick={() => updateCartItemQty(item.id, -1)} style={styles.counterBtn}>-</button>
                        <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.quantity}</span>
                        <button onClick={() => updateCartItemQty(item.id, 1)} style={styles.counterBtn}>+</button>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={styles.cartItemPrice}>₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div style={styles.drawerFooter}>
                <div style={styles.subtotalRow}>
                  <span>Subtotal:</span>
                  <span style={{ color: '#047857' }}>₹{subtotalPrice}</span>
                </div>
                <Link to="/cart" onClick={() => setCartOpen(false)} style={styles.checkoutBtn}>
                  Proceed to Checkout ➔
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer Menu (with About Us, Products, and Pickles dropdown) */}
      {menuOpen && (
        <div style={styles.drawerOverlay} onClick={() => setMenuOpen(false)}>
          <div style={styles.menuDrawerContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.drawerHeader}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#78350f' }}>Menu</h3>
              <button onClick={() => setMenuOpen(false)} style={styles.closeButton}>✕</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}>
              <Link to="/" onClick={() => setMenuOpen(false)} style={styles.menuLink}>🏠 Home</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)} style={styles.menuLink}>📖 About Us</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)} style={styles.menuLink}>📦 Products</Link>
              
              {/* Pickles Dropdown Toggle in Mobile Menu */}
              <div>
                <button 
                  onClick={() => setMobilePicklesDropdown(!mobilePicklesDropdown)}
                  style={styles.dropdownToggleBtn}
                >
                  <span>🥒 Pickles</span>
                  <span>{mobilePicklesDropdown ? '▲' : '▼'}</span>
                </button>

                {mobilePicklesDropdown && (
                  <div style={styles.dropdownSubMenu}>
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setMenuOpen(false);
                          setMobilePicklesDropdown(false);
                        }}
                        style={{
                          ...styles.dropdownSubItem,
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

              <Link to="/cart" onClick={() => setMenuOpen(false)} style={styles.menuLink}>🛒 Full Cart View</Link>
            </div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <section style={styles.heroSection}>
        <div style={styles.heroInner}>
          <h2 style={styles.heroTitle}>Authentic Andhra Pickles</h2>
          <p style={styles.heroText}>
            Prepared meticulously with cold-pressed oils, sun-dried spices, and generations of heritage.
          </p>

          <div style={styles.searchBox}>
            <input 
              type="text" 
              placeholder="Search mango, chicken, garlic pickle..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}>✕</button>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog */}
      <main id="catalog" style={styles.mainContainer}>
        
        <div style={styles.filterRow}>
          <div style={styles.filterPillsContainer}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  ...styles.filterPill,
                  ...(selectedCategory === cat ? styles.filterPillActive : styles.filterPillInactive)
                }}
              >
                {cat}
              </button>
            ))}
          </div>
          <span style={styles.itemCountText}>{filteredProducts.length} items available</span>
        </div>

        {filteredProducts.length === 0 ? (
          <div style={styles.noResultsBox}>
            No culinary items found matching your filter.
          </div>
        ) : (
          <div style={styles.productGrid}>
            {filteredProducts.map(product => {
              const currentQty = quantities[product.id] || 1;
              const isOutOfStock = product.stockQuantity === 0;

              return (
                <div key={product.id} style={styles.productCard}>
                  
                  <div style={styles.productImageWrapper}>
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        style={styles.imageFit}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span style={{ fontSize: '32px' }}>🥒</span>
                    )}
                    {isOutOfStock && (
                      <div style={styles.outOfStockOverlay}>SOLD OUT</div>
                    )}
                  </div>

                  <div style={styles.productDetails}>
                    <div>
                      <div style={styles.productCategoryRow}>
                        <span style={styles.productCategoryBadge}>
                          {product.categoryName || 'Pickle'}
                        </span>
                        <span style={styles.productWeight}>{product.weight}</span>
                      </div>
                      
                      <h4 style={styles.productTitle}>{product.name}</h4>
                      <p style={styles.productDescription}>{product.description}</p>
                    </div>

                    <div>
                      <div style={styles.priceCounterRow}>
                        <span style={styles.productPrice}>₹{product.price}</span>
                        
                        {!isOutOfStock && (
                          <div style={styles.cardCounterBox}>
                            <button onClick={() => handleQuantityChange(product.id, -1)} style={styles.cardCounterBtn}>-</button>
                            <span style={{ padding: '0 8px', fontSize: '12px', fontWeight: 700 }}>{currentQty}</span>
                            <button onClick={() => handleQuantityChange(product.id, 1, product.stockQuantity)} style={styles.cardCounterBtn}>+</button>
                          </div>
                        )}
                      </div>

                      <button 
                        disabled={isOutOfStock}
                        onClick={() => addToCart(product)} 
                        style={{
                          ...styles.addToBagBtn,
                          ...(isOutOfStock ? styles.addToBagDisabled : styles.addToBagActive)
                        }}
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
      
      <Footer />
    </div>
  );
}

const styles = {
  pageContainer: {
    backgroundColor: '#f9f8f4',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    color: '#292524'
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#fdfbf7',
    color: '#92400e',
    fontSize: '15px',
    fontWeight: 600
  },
  loaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    backgroundColor: '#292524',
    color: '#fef3c7',
    padding: '12px 20px',
    borderRadius: '10px',
    zIndex: 1100,
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid #78350f'
  },
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid #e7e5e4',
    padding: '12px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  logo: {
    height: '52px',
    width: '52px',
    objectFit: 'contain',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  brandTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: 900,
    color: '#78350f',
    letterSpacing: '-0.3px'
  },
  brandSubtitle: {
    margin: 0,
    fontSize: '9px',
    color: '#b45309',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  // Desktop navigation (Hidden on mobile via CSS query structure / inline setup logic)
  desktopNav: {
    display: 'flex',
    gap: '24px',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      display: 'none'
    }
  },
  desktopNavLink: {
    textDecoration: 'none',
    color: '#57534e',
    fontWeight: 600,
    fontSize: '14px',
    transition: 'color 0.2s'
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  cartButton: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    color: '#78350f',
    padding: '8px 14px',
    borderRadius: '20px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  cartBadge: {
    backgroundColor: '#b45309',
    color: '#fff',
    borderRadius: '10px',
    padding: '1px 7px',
    fontSize: '11px'
  },
  // Shown only on mobile screens
  mobileMenuButton: {
    background: 'none',
    border: '1px solid #e7e5e4',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '3px',
    width: '38px',
    height: '38px',
    alignItems: 'center'
  },
  hamburgerBar: {
    display: 'block',
    height: '2px',
    width: '16px',
    backgroundColor: '#78350f',
    borderRadius: '2px'
  },
  drawerOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  drawerContent: {
    width: '100%',
    maxWidth: '380px',
    height: '100vh',
    backgroundColor: '#ffffff',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  menuDrawerContent: {
    width: '100%',
    maxWidth: '280px',
    height: '100vh',
    backgroundColor: '#ffffff',
    boxShadow: '-10px 0 30px rgba(0,0,0,0.1)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box'
  },
  drawerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f5f5f4',
    paddingBottom: '16px'
  },
  drawerTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: 800,
    color: '#78350f'
  },
  closeButton: {
    background: '#f5f5f4',
    border: 'none',
    borderRadius: '50%',
    width: '30px',
    height: '30px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#57534e'
  },
  drawerBody: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '16px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  emptyCart: {
    textAlign: 'center',
    color: '#78716c',
    marginTop: '80px',
    fontSize: '13px',
    lineHeight: '1.5'
  },
  cartItemCard: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    backgroundColor: '#fafaf9',
    padding: '10px',
    borderRadius: '10px',
    border: '1px solid #f5f5f4'
  },
  cartItemThumb: {
    width: '50px',
    height: '50px',
    backgroundColor: '#e7e5e4',
    borderRadius: '8px',
    overflow: 'hidden',
    flexShrink: 0
  },
  imageFit: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  fallbackEmoji: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    fontSize: '18px'
  },
  cartItemTitle: {
    margin: '0 0 2px 0',
    fontSize: '13px',
    fontWeight: 700,
    color: '#292524'
  },
  cartItemMeta: {
    fontSize: '11px',
    color: '#78716c'
  },
  cartCounterRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '6px'
  },
  counterBtn: {
    background: '#fff',
    border: '1px solid #d6d3d1',
    borderRadius: '4px',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    fontWeight: 700
  },
  cartItemPrice: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#047857'
  },
  drawerFooter: {
    borderTop: '1px solid #f5f5f4',
    paddingTop: '16px'
  },
  subtotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    fontSize: '15px',
    fontWeight: 700
  },
  checkoutBtn: {
    display: 'block',
    textAlign: 'center',
    backgroundColor: '#78350f',
    color: '#fff',
    padding: '12px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '14px'
  },
  menuLink: {
    textDecoration: 'none',
    color: '#44403c',
    fontWeight: 600,
    fontSize: '14px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f5f5f4',
    display: 'block'
  },
  dropdownToggleBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#44403c',
    fontWeight: 600,
    fontSize: '14px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f5f5f4',
    cursor: 'pointer',
    textAlign: 'left'
  },
  dropdownSubMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingLeft: '16px',
    marginTop: '10px',
    marginBottom: '8px'
  },
  dropdownSubItem: {
    background: 'none',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '4px 0'
  },
  heroSection: {
    backgroundColor: '#78350f',
    color: '#ffffff',
    padding: '44px 20px',
    textAlign: 'center',
    backgroundImage: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)'
  },
  heroInner: {
    maxWidth: '600px',
    margin: '0 auto'
  },
  heroTitle: {
    margin: '0 0 10px 0',
    fontSize: '26px',
    fontWeight: 800,
    letterSpacing: '-0.5px'
  },
  heroText: {
    margin: '0 auto 24px auto',
    fontSize: '13px',
    color: '#fde68a',
    lineHeight: '1.5'
  },
  searchBox: {
    maxWidth: '400px',
    margin: '0 auto',
    display: 'flex',
    backgroundColor: '#ffffff',
    borderRadius: '30px',
    overflow: 'hidden',
    padding: '3px 6px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
  },
  searchInput: {
    flexGrow: 1,
    border: 'none',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    color: '#292524',
    background: 'transparent'
  },
  clearSearchBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a8a29e',
    fontSize: '12px',
    padding: '0 8px'
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '30px auto',
    padding: '0 24px'
  },
  filterRow: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '12px'
  },
  filterPillsContainer: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  filterPill: {
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  filterPillActive: {
    backgroundColor: '#78350f',
    color: '#ffffff',
    border: '1px solid #78350f',
    boxShadow: '0 4px 10px rgba(120,53,15,0.15)'
  },
  filterPillInactive: {
    backgroundColor: '#ffffff',
    color: '#57534e',
    border: '1px solid #e7e5e4'
  },
  itemCountText: {
    fontSize: '12px',
    color: '#78716c',
    fontWeight: 600
  },
  noResultsBox: {
    textAlign: 'center',
    padding: '60px',
    color: '#78716c',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e7e5e4',
    fontSize: '14px'
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '20px'
  },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #e7e5e4',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0,0,0,0.015)'
  },
  productImageWrapper: {
    width: '100%',
    height: '170px',
    backgroundColor: '#f5f5f4',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  outOfStockOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '12px',
    letterSpacing: '0.5px'
  },
  productDetails: {
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'space-between'
  },
  productCategoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  productCategoryBadge: {
    fontSize: '9px',
    backgroundColor: '#fef3c7',
    color: '#78350f',
    padding: '2px 8px',
    borderRadius: '4px',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  productWeight: {
    fontSize: '11px',
    color: '#78716c',
    fontWeight: 600
  },
  productTitle: {
    margin: '0 0 4px 0',
    color: '#292524',
    fontSize: '14px',
    fontWeight: 700
  },
  productDescription: {
    margin: '0 0 12px 0',
    fontSize: '11px',
    color: '#78716c',
    lineHeight: '1.4',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  priceCounterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    paddingTop: '8px',
    borderTop: '1px solid #f5f5f4'
  },
  productPrice: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#047857'
  },
  cardCounterBox: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d6d3d1',
    borderRadius: '6px',
    overflow: 'hidden',
    backgroundColor: '#fafaf9'
  },
  cardCounterBtn: {
    background: 'transparent',
    border: 'none',
    padding: '3px 7px',
    cursor: 'pointer',
    color: '#44403c',
    fontWeight: 700
  },
  addToBagBtn: {
    width: '100%',
    border: 'none',
    padding: '9px 0',
    borderRadius: '8px',
    fontWeight: 700,
    fontSize: '12px',
    transition: 'background-color 0.2s'
  },
  addToBagActive: {
    backgroundColor: '#78350f',
    color: '#fff',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(120,53,15,0.15)'
  },
  addToBagDisabled: {
    backgroundColor: '#d6d3d1',
    color: '#fff',
    cursor: 'not-allowed'
  }
};