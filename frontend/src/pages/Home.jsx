import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";
import "./Home.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sri-varahi-pickles.onrender.com";

export default function Home() {
  // =====================================================
  // STATE
  // =====================================================

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobilePicklesDropdown, setMobilePicklesDropdown] =
    useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [cart, setCart] = useState([]);

  const [toastMessage, setToastMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");


  // =====================================================
  // LOAD CART + PRODUCTS + CATEGORIES
  // =====================================================

  useEffect(() => {
    // ---------------------------------------------------
    // Load saved cart
    // ---------------------------------------------------

    try {
      const savedCart =
        JSON.parse(localStorage.getItem("cart") || "[]");

      if (Array.isArray(savedCart)) {
        setCart(savedCart);
      }
    } catch (error) {
      console.error("Error loading cart:", error);
      setCart([]);
    }


    // ---------------------------------------------------
    // Load products and categories
    // ---------------------------------------------------

    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            axios.get(`${API_URL}/api/products`),
            axios.get(`${API_URL}/api/categories`)
          ]);


        // ------------------------------------------------
        // Products
        // ------------------------------------------------

        const productData =
          productsResponse.data?.data ||
          productsResponse.data ||
          [];

        setProducts(
          Array.isArray(productData)
            ? productData
            : []
        );


        // ------------------------------------------------
        // Categories
        // ------------------------------------------------

        const categoryData =
          categoriesResponse.data?.data ||
          categoriesResponse.data ||
          [];

        setCategories(
          Array.isArray(categoryData)
            ? categoryData
            : []
        );

      } catch (error) {

        console.error(
          "Error loading products/categories:",
          error
        );

        setErrorMessage(
          "Unable to load products. Please try again."
        );

      } finally {

        setLoading(false);

      }
    };


    loadData();

  }, []);


  // =====================================================
  // CATEGORY LIST
  // =====================================================

  const categoryList = useMemo(() => {

    return [
      {
        id: "all",
        name: "All"
      },

      ...categories.map(category => ({
        id: category.Id,
        name: category.Name
      }))
    ];

  }, [categories]);


  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = useMemo(() => {

    let result = [...products];


    // ---------------------------------------------------
    // Category filter
    // ---------------------------------------------------

    if (selectedCategory !== "All") {

      result = result.filter(product => {

        return (
          String(product.categoryName || "")
            .toLowerCase()
            .trim() ===
          String(selectedCategory)
            .toLowerCase()
            .trim()
        );

      });

    }


    // ---------------------------------------------------
    // Search
    // ---------------------------------------------------

    const search =
      searchTerm.trim().toLowerCase();


    if (search) {

      result = result.filter(product => {

        const name =
          product.name?.toLowerCase() || "";

        const description =
          product.description?.toLowerCase() || "";

        const category =
          product.categoryName?.toLowerCase() || "";


        return (
          name.includes(search) ||
          description.includes(search) ||
          category.includes(search)
        );

      });

    }


    return result;

  }, [
    products,
    selectedCategory,
    searchTerm
  ]);


  // =====================================================
  // SAVE CART
  // =====================================================

  const saveAndSyncCart = updatedCart => {

    setCart(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

  };


  // =====================================================
  // ADD PRODUCT TO CART
  // =====================================================

  const addToCart = product => {

    if (
      !product ||
      product.stockQuantity <= 0
    ) {
      return;
    }


    const currentCart = [...cart];

    const existingIndex =
      currentCart.findIndex(
        item => item.id === product.id
      );


    if (existingIndex >= 0) {

      const existingItem =
        currentCart[existingIndex];


      if (
        existingItem.quantity >=
        product.stockQuantity
      ) {

        showToast(
          `Only ${product.stockQuantity} available`
        );

        return;
      }


      existingItem.quantity += 1;

    } else {

      currentCart.push({

        id: product.id,

        name: product.name,

        price: Number(product.price),

        weight: product.weight,

        imageUrl: product.imageUrl,

        stockQuantity:
          product.stockQuantity,

        quantity: 1

      });

    }


    saveAndSyncCart(currentCart);

    setCartOpen(true);

    showToast(
      `${product.name} added to your bag`
    );

  };


  // =====================================================
  // UPDATE PRODUCT CARD QUANTITY
  // =====================================================

  const updateProductCardQty = (
    productId,
    delta,
    maxStock
  ) => {

    const currentCart = [...cart];

    const index =
      currentCart.findIndex(
        item => item.id === productId
      );


    if (index === -1) {
      return;
    }


    const currentQuantity =
      currentCart[index].quantity;


    const newQuantity =
      currentQuantity + delta;


    if (
      delta > 0 &&
      maxStock &&
      newQuantity > maxStock
    ) {

      showToast(
        `Only ${maxStock} available`
      );

      return;
    }


    if (newQuantity <= 0) {

      currentCart.splice(index, 1);

    } else {

      currentCart[index].quantity =
        newQuantity;

    }


    saveAndSyncCart(currentCart);

  };


  // =====================================================
  // UPDATE CART ITEM
  // =====================================================

  const updateCartItemQty = (
    productId,
    delta
  ) => {

    const currentCart = [...cart];

    const index =
      currentCart.findIndex(
        item => item.id === productId
      );


    if (index === -1) {
      return;
    }


    const item =
      currentCart[index];


    const newQuantity =
      item.quantity + delta;


    if (
      delta > 0 &&
      item.stockQuantity &&
      newQuantity > item.stockQuantity
    ) {

      showToast(
        `Only ${item.stockQuantity} available`
      );

      return;

    }


    if (newQuantity <= 0) {

      currentCart.splice(index, 1);

    } else {

      item.quantity =
        newQuantity;

    }


    saveAndSyncCart(currentCart);

  };


  // =====================================================
  // TOAST
  // =====================================================

  const showToast = message => {

    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 2500);

  };


  // =====================================================
  // CART TOTALS
  // =====================================================

  const totalCartItems =
    cart.reduce(
      (sum, item) =>
        sum + Number(item.quantity || 0),
      0
    );


  const subtotalPrice =
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );


  // =====================================================
  // CLOSE MENU
  // =====================================================

  const closeMenu = () => {

    setMenuOpen(false);
    setMobilePicklesDropdown(false);

  };


  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="page-container full-width-layout">


      {/* =================================================
          TOAST
      ================================================= */}

      {toastMessage && (

        <div className="toast">
          ✨ {toastMessage}
        </div>

      )}


      {/* =================================================
          HEADER
      ================================================= */}

      <header className="header">

        <div className="brand-container">

          <img
            src="/images/SriVarahiLogo.png"
            alt="Sri Vaarahi Pickles"
            className="logo"
          />

          <div>

            <h1 className="brand-title">
              SRI VAARAHI PICKLES
            </h1>

            <p className="brand-subtitle">
              Authentic • Traditional • Homemade
            </p>

          </div>

        </div>


        {/* =================================================
            DESKTOP NAVIGATION
        ================================================= */}

        <nav className="desktop-nav">

          <Link
            to="/"
            className="desktop-nav-link"
          >
            🏠 Home
          </Link>


          <Link
            to="/about"
            className="desktop-nav-link"
          >
            📖 About Us
          </Link>


          <Link
            to="/products"
            className="desktop-nav-link"
          >
            📦 Products
          </Link>


          <a
            href="#catalog"
            className="desktop-nav-link"
          >
            🥒 Pickles
          </a>


          <Link
            to="/cart"
            className="desktop-nav-link"
          >
            🛒 Cart
          </Link>

        </nav>


        {/* =================================================
            HEADER ACTIONS
        ================================================= */}

        <div className="header-actions">

          <button
            onClick={() => setCartOpen(true)}
            className="cart-button"
            aria-label="Open shopping cart"
          >

            🛒

            <span className="cart-badge-desktop">
              {totalCartItems}
            </span>

          </button>


          <button
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            className="mobile-menu-button"
            aria-label="Open menu"
          >

            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>
            <span className="hamburger-bar"></span>

          </button>

        </div>

      </header>


      {/* =================================================
          CART DRAWER
      ================================================= */}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        totalCartItems={totalCartItems}
        subtotalPrice={subtotalPrice}
        updateCartItemQty={
          updateCartItemQty
        }
      />


      {/* =================================================
          MOBILE MENU
      ================================================= */}

      {menuOpen && (

        <div
          className="drawer-overlay"
          onClick={closeMenu}
        >

          <div
            className="menu-drawer-content"
            onClick={e =>
              e.stopPropagation()
            }
          >

            <div className="drawer-header">

              <h3 className="drawer-title">
                Menu
              </h3>


              <button
                onClick={closeMenu}
                className="close-button"
              >
                ✕
              </button>

            </div>


            <div className="mobile-menu-links">

              <Link
                to="/"
                onClick={closeMenu}
                className="menu-link"
              >
                🏠 Home
              </Link>


              <Link
                to="/about"
                onClick={closeMenu}
                className="menu-link"
              >
                📖 About Us
              </Link>


              <Link
                to="/products"
                onClick={closeMenu}
                className="menu-link"
              >
                📦 Products
              </Link>


              {/* PICKLES */}

              <div>

                <button
                  onClick={() =>
                    setMobilePicklesDropdown(
                      !mobilePicklesDropdown
                    )
                  }
                  className="dropdown-toggle-btn"
                >

                  <span>
                    🥒 Pickles
                  </span>

                  <span>
                    {mobilePicklesDropdown
                      ? "▲"
                      : "▼"}
                  </span>

                </button>


                {mobilePicklesDropdown && (

                  <div className="dropdown-sub-menu">

                    {categoryList.map(
                      category => (

                        <button
                          key={category.id}
                          onClick={() => {

                            setSelectedCategory(
                              category.name
                            );

                            setMenuOpen(false);

                            setMobilePicklesDropdown(
                              false
                            );

                            setTimeout(() => {

                              document
                                .getElementById(
                                  "catalog"
                                )
                                ?.scrollIntoView({
                                  behavior:
                                    "smooth"
                                });

                            }, 100);

                          }}
                          className="dropdown-sub-item"
                        >

                          •{" "}
                          {category.name}

                        </button>

                      )
                    )}

                  </div>

                )}

              </div>


              <Link
                to="/cart"
                onClick={closeMenu}
                className="menu-link"
              >
                🛒 My Cart
              </Link>

            </div>

          </div>

        </div>

      )}


      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero-section">

        <div className="hero-inner">

          <span className="hero-badge">
            🌿 Authentic Andhra Flavours
          </span>


          <h2 className="hero-title">
            Taste the Tradition
          </h2>


          <p className="hero-text">
            Homemade pickles prepared with
            authentic recipes, carefully selected
            ingredients and generations of love.
          </p>


          {/* SEARCH */}

          <div className="search-box">

            <span className="search-icon">
              🔍
            </span>


            <input
              type="text"
              placeholder="Search chicken, mango, prawns, garlic..."
              value={searchTerm}
              onChange={e =>
                setSearchTerm(e.target.value)
              }
              className="search-input"
            />


            {searchTerm && (

              <button
                onClick={() =>
                  setSearchTerm("")
                }
                className="clear-search-btn"
              >
                ✕
              </button>

            )}

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN CATALOG
      ================================================= */}

      <main
        id="catalog"
        className="main-container full-width-container"
      >


        {/* =================================================
            CATEGORY FILTER
        ================================================= */}

        <div className="filter-row">

          <div className="filter-pills-container">

            {categoryList.map(category => (

              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    category.name
                  )
                }
                className={
                  selectedCategory ===
                  category.name
                    ? "filter-pill filter-pill-active"
                    : "filter-pill filter-pill-inactive"
                }
              >
                {category.name}
              </button>

            ))}

          </div>


          {!loading && (

            <span className="item-count-text">

              {filteredProducts.length}

              {" "}

              {filteredProducts.length === 1
                ? "item"
                : "items"}

            </span>

          )}

        </div>


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (

          <div className="loading-box">

            <div className="loading-spinner">
              🥒
            </div>

            <p>
              Preparing our delicious
              collection...
            </p>

          </div>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading && errorMessage && (

          <div className="no-results-box">

            <p className="error-icon">
              ⚠️
            </p>

            <h3>
              Something went wrong
            </h3>

            <p>
              {errorMessage}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
              className="add-to-bag-btn add-to-bag-active"
            >
              Try Again
            </button>

          </div>

        )}


        {/* =================================================
            NO PRODUCTS
        ================================================= */}

        {!loading &&
          !errorMessage &&
          filteredProducts.length === 0 && (

            <div className="no-results-box">

              <p className="no-results-icon">
                🔍
              </p>

              <h3>
                No products found
              </h3>

              <p>
                Try another search or category.
              </p>


              <button
                onClick={() => {

                  setSearchTerm("");
                  setSelectedCategory("All");

                }}
                className="add-to-bag-btn add-to-bag-active"
              >
                View All Products
              </button>

            </div>

          )}


        {/* =================================================
            PRODUCTS
        ================================================= */}

        {!loading &&
          !errorMessage &&
          filteredProducts.length > 0 && (

            <div className="product-grid">

              {filteredProducts.map(
                product => {

                  const cartItem =
                    cart.find(
                      item =>
                        item.id ===
                        product.id
                    );


                  const currentQty =
                    cartItem
                      ? cartItem.quantity
                      : 0;


                  const isOutOfStock =
                    Number(
                      product.stockQuantity
                    ) <= 0;


                  return (

                    <div
                      key={product.id}
                      className="product-card"
                    >


                      {/* IMAGE */}

                      <div className="product-image-wrapper">

                        {product.imageUrl ? (

                          <img
                            src={
                              product.imageUrl
                            }
                            alt={
                              product.name
                            }
                            className="image-fit"
                            loading="lazy"
                            onError={e => {

                              e.currentTarget.style.display =
                                "none";

                            }}
                          />

                        ) : (

                          <div className="no-product-image">
                            🥒
                          </div>

                        )}


                        {isOutOfStock && (

                          <div className="out-of-stock-overlay">
                            SOLD OUT
                          </div>

                        )}

                      </div>


                      {/* PRODUCT DETAILS */}

                      <div className="product-details">

                        <div>

                          <div className="product-category-row">

                            <span className="product-category-badge">

                              {product.categoryName ||
                                "Pickle"}

                            </span>


                            {product.weight && (

                              <span className="product-weight">
                                {product.weight}
                              </span>

                            )}

                          </div>


                          <h4 className="product-title">

                            {product.name}

                          </h4>


                          {product.description && (

                            <p className="product-description">

                              {product.description}

                            </p>

                          )}

                        </div>


                        {/* PRICE */}

                        <div>

                          <div className="price-counter-row">

                            <span className="product-price">

                              ₹
                              {Number(
                                product.price
                              ).toLocaleString(
                                "en-IN"
                              )}

                            </span>


                            {currentQty > 0 &&
                              !isOutOfStock && (

                                <div className="card-counter-box">

                                  <button
                                    onClick={() =>
                                      updateProductCardQty(
                                        product.id,
                                        -1
                                      )
                                    }
                                    className="card-counter-btn"
                                  >
                                    −
                                  </button>


                                  <span className="card-counter-value">
                                    {currentQty}
                                  </span>


                                  <button
                                    onClick={() =>
                                      updateProductCardQty(
                                        product.id,
                                        1,
                                        product.stockQuantity
                                      )
                                    }
                                    className="card-counter-btn"
                                  >
                                    +
                                  </button>

                                </div>

                              )}

                          </div>


                          {/* ADD BUTTON */}

                          {currentQty === 0 ? (

                            <button
                              disabled={
                                isOutOfStock
                              }
                              onClick={() =>
                                addToCart(
                                  product
                                )
                              }
                              className={
                                isOutOfStock
                                  ? "add-to-bag-btn add-to-bag-disabled"
                                  : "add-to-bag-btn add-to-bag-active"
                              }
                            >

                              {isOutOfStock
                                ? "Sold Out"
                                : "Add to Bag 🛒"}

                            </button>

                          ) : (

                            <button
                              onClick={() =>
                                setCartOpen(
                                  true
                                )
                              }
                              className="add-to-bag-btn add-to-bag-active view-bag-button"
                            >

                              View Bag (
                              {currentQty}
                              ) 🛒

                            </button>

                          )}

                        </div>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

      </main>


      {/* =================================================
          MOBILE BOTTOM NAVIGATION
      ================================================= */}

      <nav className="mobile-bottom-nav">

        <Link
          to="/"
          className="bottom-nav-item-active"
        >
          <span>🏠</span>
          <span>Home</span>
        </Link>


        <a
          href="#catalog"
          className="bottom-nav-item"
        >
          <span>🥒</span>
          <span>Catalog</span>
        </a>


        <button
          onClick={() =>
            setCartOpen(true)
          }
          className="bottom-nav-cart-btn"
        >

          <span>🛒</span>

          <span>Bag</span>

          {totalCartItems > 0 && (

            <span className="bottom-nav-badge">

              {totalCartItems}

            </span>

          )}

        </button>


        <button
          onClick={() =>
            setMenuOpen(true)
          }
          className="bottom-nav-item"
        >
          <span>☰</span>
          <span>Menu</span>
        </button>

      </nav>


      {/* =================================================
          FOOTER
      ================================================= */}

      <Footer />

    </div>

  );
}