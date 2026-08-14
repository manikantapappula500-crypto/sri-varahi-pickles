import React, {
    useEffect,
    useMemo,
    useState,
} from "react";

import axios from "axios";
import { Link } from "react-router-dom";

import Footer from "../components/Footer";
import CartDrawer from "../components/CartDrawer";

import "./Home.css";


/* =========================================================
   API URL
========================================================= */

const API_URL =
    import.meta.env.VITE_API_URL ||
    "https://sri-varahi-pickles.onrender.com";


/* =========================================================
   IMAGE URL HELPER
========================================================= */

const getImageUrl = (imageUrl) => {

    if (!imageUrl) {
        return "";
    }

    const url = String(imageUrl).trim();

    if (!url) {
        return "";
    }

    /*
     * Already a complete URL
     *
     * Example:
     * https://sri-varahi-pickles.onrender.com/images/...
     */
    if (
        url.startsWith("http://") ||
        url.startsWith("https://")
    ) {
        return url;
    }

    /*
     * Remove accidental leading/trailing spaces
     */
    const cleanPath = url.startsWith("/")
        ? url
        : `/${url}`;

    /*
     * Backend image URL
     */
    return `${API_URL}${cleanPath}`;
};


/* =========================================================
   HOME COMPONENT
========================================================= */

export default function Home() {

    /* =====================================================
       STATE
    ===================================================== */

    const [products, setProducts] = useState([]);

    const [categories, setCategories] =
        useState([]);

    const [menuOpen, setMenuOpen] =
        useState(false);

    const [cartOpen, setCartOpen] =
        useState(false);

    const [
        mobilePicklesDropdown,
        setMobilePicklesDropdown,
    ] = useState(false);

    const [searchTerm, setSearchTerm] =
        useState("");

    const [selectedCategory, setSelectedCategory] =
        useState("All");

    const [cart, setCart] =
        useState([]);

    const [toastMessage, setToastMessage] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");


    /* =====================================================
       LOAD CART FROM LOCAL STORAGE
    ===================================================== */

    useEffect(() => {

        try {

            const savedCart =
                JSON.parse(
                    localStorage.getItem("cart") || "[]"
                );

            if (Array.isArray(savedCart)) {
                setCart(savedCart);
            }

        } catch (error) {

            console.error(
                "Error loading cart:",
                error
            );

            setCart([]);
        }

    }, []);


    /* =====================================================
       LOAD PRODUCTS + CATEGORIES
    ===================================================== */

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoading(true);
                setErrorMessage("");

                const [
                    productsResponse,
                    categoriesResponse,
                ] = await Promise.all([

                    axios.get(
                        `${API_URL}/api/products`
                    ),

                    axios.get(
                        `${API_URL}/api/categories`
                    ),

                ]);


                /* =========================================
                   PRODUCTS
                ========================================= */

                const productData =
                    productsResponse.data?.data ||
                    productsResponse.data ||
                    [];


                /* =========================================
                   CATEGORIES
                ========================================= */

                const categoryData =
                    categoriesResponse.data?.data ||
                    categoriesResponse.data ||
                    [];


                setProducts(
                    Array.isArray(productData)
                        ? productData
                        : []
                );


                setCategories(
                    Array.isArray(categoryData)
                        ? categoryData
                        : []
                );


                console.log(
                    "Products loaded:",
                    productData
                );

                console.log(
                    "Categories loaded:",
                    categoryData
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


    /* =====================================================
       CATEGORY LIST
    ===================================================== */

    const categoryList = useMemo(() => {

        return [
            {
                id: "all",
                name: "All",
            },

            ...categories.map((category) => ({

                id:
                    category.Id ??
                    category.id,

                name:
                    category.Name ??
                    category.name,

            })),

        ];

    }, [categories]);


    /* =====================================================
       FILTER PRODUCTS
    ===================================================== */

    const filteredProducts = useMemo(() => {

        let result = [...products];


        /* ================================================
           CATEGORY FILTER
        ================================================ */

        if (selectedCategory !== "All") {

            result = result.filter((product) => {

                const categoryName =
                    product.categoryName ??
                    product.CategoryName ??
                    product.category?.name ??
                    product.category?.Name ??
                    "";

                return (
                    String(categoryName)
                        .toLowerCase()
                        .trim() ===
                    String(selectedCategory)
                        .toLowerCase()
                        .trim()
                );

            });

        }


        /* ================================================
           SEARCH FILTER
        ================================================ */

        const search =
            searchTerm
                .trim()
                .toLowerCase();


        if (search) {

            result = result.filter((product) => {

                const name =
                    product.name ??
                    product.Name ??
                    "";

                const description =
                    product.description ??
                    product.Description ??
                    "";

                const category =
                    product.categoryName ??
                    product.CategoryName ??
                    product.category?.name ??
                    product.category?.Name ??
                    "";


                return (

                    String(name)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(description)
                        .toLowerCase()
                        .includes(search)

                    ||

                    String(category)
                        .toLowerCase()
                        .includes(search)

                );

            });

        }


        return result;

    }, [
        products,
        selectedCategory,
        searchTerm,
    ]);


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    const openMenu = () => {

        setMenuOpen(true);

    };


    const closeMenu = () => {

        setMenuOpen(false);

        setMobilePicklesDropdown(false);

    };


    const toggleMenu = () => {

        setMenuOpen((previous) => {

            const nextState =
                !previous;


            if (!nextState) {

                setMobilePicklesDropdown(false);

            }


            return nextState;

        });

    };


    /* =====================================================
       BODY SCROLL LOCK
    ===================================================== */

    useEffect(() => {

        if (menuOpen) {

            document.body.classList.add(
                "mobile-menu-open"
            );

        } else {

            document.body.classList.remove(
                "mobile-menu-open"
            );

        }


        return () => {

            document.body.classList.remove(
                "mobile-menu-open"
            );

        };

    }, [menuOpen]);


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    useEffect(() => {

        const handleKeyDown = (event) => {

            if (event.key === "Escape") {

                closeMenu();

            }

        };


        document.addEventListener(
            "keydown",
            handleKeyDown
        );


        return () => {

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

        };

    }, []);


    /* =====================================================
       SAVE CART
    ===================================================== */

    const saveAndSyncCart = (
        updatedCart
    ) => {

        setCart(updatedCart);

        localStorage.setItem(
            "cart",
            JSON.stringify(updatedCart)
        );

    };


    /* =====================================================
       ADD TO CART
    ===================================================== */

    const addToCart = (product) => {

        const productId =
            product.id ??
            product.Id;

        const stockQuantity =
            Number(
                product.stockQuantity ??
                product.StockQuantity ??
                0
            );


        if (
            !product ||
            stockQuantity <= 0
        ) {

            return;

        }


        const currentCart =
            [...cart];


        const existingIndex =
            currentCart.findIndex(
                (item) =>
                    item.id === productId
            );


        if (existingIndex >= 0) {

            const existingItem =
                currentCart[
                    existingIndex
                ];


            if (
                existingItem.quantity >=
                stockQuantity
            ) {

                showToast(
                    `Only ${stockQuantity} available`
                );

                return;

            }


            existingItem.quantity += 1;

        } else {

            currentCart.push({

                id: productId,

                name:
                    product.name ??
                    product.Name,

                price:
                    Number(
                        product.price ??
                        product.Price ??
                        0
                    ),

                weight:
                    product.weight ??
                    product.Weight,

                imageUrl:
                    product.imageUrl ??
                    product.ImageUrl ??
                    "",

                stockQuantity:
                    stockQuantity,

                quantity: 1,

            });

        }


        saveAndSyncCart(
            currentCart
        );


        setCartOpen(true);


        showToast(
            `${
                product.name ??
                product.Name ??
                "Product"
            } added to your bag`
        );

    };


    /* =====================================================
       UPDATE PRODUCT CARD QUANTITY
    ===================================================== */

    const updateProductCardQty = (
        productId,
        delta,
        maxStock
    ) => {

        const currentCart =
            [...cart];


        const index =
            currentCart.findIndex(
                (item) =>
                    item.id === productId
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

            currentCart.splice(
                index,
                1
            );

        } else {

            currentCart[index].quantity =
                newQuantity;

        }


        saveAndSyncCart(
            currentCart
        );

    };


    /* =====================================================
       UPDATE CART QUANTITY
    ===================================================== */

    const updateCartItemQty = (
        productId,
        delta
    ) => {

        const currentCart =
            [...cart];


        const index =
            currentCart.findIndex(
                (item) =>
                    item.id === productId
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
            newQuantity >
                item.stockQuantity
        ) {

            showToast(
                `Only ${item.stockQuantity} available`
            );

            return;

        }


        if (newQuantity <= 0) {

            currentCart.splice(
                index,
                1
            );

        } else {

            item.quantity =
                newQuantity;

        }


        saveAndSyncCart(
            currentCart
        );

    };


    /* =====================================================
       TOAST
    ===================================================== */

    const showToast = (
        message
    ) => {

        setToastMessage(message);


        setTimeout(() => {

            setToastMessage("");

        }, 2500);

    };


    /* =====================================================
       CART TOTALS
    ===================================================== */

    const totalCartItems =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.quantity || 0
                ),
            0
        );


    const subtotalPrice =
        cart.reduce(
            (sum, item) =>
                sum +
                Number(
                    item.price || 0
                ) *
                Number(
                    item.quantity || 0
                ),
            0
        );


    /* =====================================================
       SCROLL TO CATALOG
    ===================================================== */

    const scrollToCatalog = () => {

        const catalog =
            document.getElementById(
                "catalog"
            );


        if (!catalog) {

            return;

        }


        catalog.scrollIntoView({

            behavior: "smooth",

            block: "start",

        });

    };


    /* =====================================================
       MOBILE CATEGORY
    ===================================================== */

    const handleMobileCategoryClick = (
        categoryName
    ) => {

        setSelectedCategory(
            categoryName
        );


        closeMenu();


        setTimeout(() => {

            scrollToCatalog();

        }, 180);

    };


    /* =====================================================
       MOBILE CATALOG
    ===================================================== */

    const handleMobileCatalogClick = () => {

        scrollToCatalog();

    };


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <div className="page-container full-width-layout">


            {/* =================================================
                TOAST
            ================================================= */}

            {toastMessage && (

                <div className="toast">

                    <span>✨</span>

                    <span>
                        {toastMessage}
                    </span>

                </div>

            )}


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="header">


                {/* =============================================
                    BRAND
                ============================================= */}

                <div className="brand-container">

                    <img
                        src="/images/SriVarahiLogo.png"
                        alt="Sri Vaarahi Pickles"
                        className="logo"
                    />


                    <div className="brand-text-container">

                        <h1 className="brand-title">
                            SRI VAARAHI PICKLES
                        </h1>


                        <p className="brand-subtitle">
                            Authentic • Traditional • Homemade
                        </p>

                    </div>

                </div>


                {/* =============================================
                    DESKTOP MENU
                ============================================= */}

                <nav
                    className="desktop-nav"
                    aria-label="Main navigation"
                >

                    <Link
                        to="/"
                        className="desktop-nav-link"
                    >

                        <span className="desktop-nav-icon">
                            🏠
                        </span>

                        <span>
                            Home
                        </span>

                    </Link>


                    <Link
                        to="/about"
                        className="desktop-nav-link"
                    >

                        <span className="desktop-nav-icon">
                            📖
                        </span>

                        <span>
                            About Us
                        </span>

                    </Link>


                    <Link
                        to="/products"
                        className="desktop-nav-link"
                    >

                        <span className="desktop-nav-icon">
                            📦
                        </span>

                        <span>
                            Products
                        </span>

                    </Link>


                    <a
                        href="#catalog"
                        className="desktop-nav-link"
                    >

                        <span className="desktop-nav-icon">
                            🥒
                        </span>

                        <span>
                            Pickles
                        </span>

                    </a>


                    <Link
                        to="/cart"
                        className="desktop-nav-link"
                    >

                        <span className="desktop-nav-icon">
                            🛒
                        </span>

                        <span>
                            Cart
                        </span>

                    </Link>

                </nav>


                {/* =============================================
                    HEADER ACTIONS
                ============================================= */}

                <div className="header-actions">


                    {/* CART */}

                    <button
                        type="button"
                        onClick={() =>
                            setCartOpen(true)
                        }
                        className="cart-button"
                        aria-label="Open shopping cart"
                    >

                        <span className="cart-icon">
                            🛒
                        </span>


                        <span className="cart-badge-desktop">
                            {totalCartItems}
                        </span>

                    </button>


                    {/* MOBILE MENU BUTTON */}

                    <button
                        type="button"
                        onClick={toggleMenu}
                        className={
                            menuOpen
                                ? "mobile-menu-button mobile-menu-button-open"
                                : "mobile-menu-button"
                        }
                        aria-label={
                            menuOpen
                                ? "Close menu"
                                : "Open menu"
                        }
                        aria-expanded={
                            menuOpen
                        }
                        aria-controls="mobile-navigation-drawer"
                    >

                        <span className="hamburger-bar" />

                        <span className="hamburger-bar" />

                        <span className="hamburger-bar" />

                    </button>

                </div>

            </header>


            {/* =================================================
                CART DRAWER
            ================================================= */}

            <CartDrawer
                isOpen={cartOpen}

                onClose={() =>
                    setCartOpen(false)
                }

                cart={cart}

                totalCartItems={
                    totalCartItems
                }

                subtotalPrice={
                    subtotalPrice
                }

                updateCartItemQty={
                    updateCartItemQty
                }
            />


            {/* =================================================
                MOBILE DRAWER
            ================================================= */}

            {menuOpen && (

                <div
                    className="drawer-overlay"
                    onClick={closeMenu}
                >

                    <aside
                        id="mobile-navigation-drawer"
                        className="menu-drawer-content"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                        role="dialog"
                        aria-modal="true"
                        aria-label="Navigation menu"
                    >


                        {/* =====================================
                            DRAWER HEADER
                        ===================================== */}

                        <div className="drawer-header">

                            <div className="drawer-brand">

                                <img
                                    src="/images/SriVarahiLogo.png"
                                    alt="Sri Vaarahi Pickles"
                                    className="drawer-logo"
                                />


                                <div className="drawer-brand-text">

                                    <h3 className="drawer-title">
                                        SRI VAARAHI
                                    </h3>

                                    <span className="drawer-subtitle">
                                        PICKLES
                                    </span>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={closeMenu}
                                className="close-button"
                                aria-label="Close menu"
                            >
                                ✕
                            </button>

                        </div>


                        {/* =====================================
                            DIVIDER
                        ===================================== */}

                        <div className="drawer-divider" />


                        {/* =====================================
                            MENU LINKS
                        ===================================== */}

                        <div className="mobile-menu-links">


                            {/* HOME */}

                            <Link
                                to="/"
                                onClick={closeMenu}
                                className="menu-link"
                            >

                                <span className="menu-link-left">

                                    <span className="menu-link-icon">
                                        🏠
                                    </span>

                                    <span className="menu-link-text">
                                        Home
                                    </span>

                                </span>


                                <span className="menu-link-arrow">
                                    ›
                                </span>

                            </Link>


                            {/* ABOUT */}

                            <Link
                                to="/about"
                                onClick={closeMenu}
                                className="menu-link"
                            >

                                <span className="menu-link-left">

                                    <span className="menu-link-icon">
                                        📖
                                    </span>

                                    <span className="menu-link-text">
                                        About Us
                                    </span>

                                </span>


                                <span className="menu-link-arrow">
                                    ›
                                </span>

                            </Link>


                            {/* PRODUCTS */}

                            <Link
                                to="/products"
                                onClick={closeMenu}
                                className="menu-link"
                            >

                                <span className="menu-link-left">

                                    <span className="menu-link-icon">
                                        📦
                                    </span>

                                    <span className="menu-link-text">
                                        Products
                                    </span>

                                </span>


                                <span className="menu-link-arrow">
                                    ›
                                </span>

                            </Link>


                            {/* PICKLES */}

                            <div className="mobile-menu-dropdown">


                                <button
                                    type="button"
                                    onClick={() =>
                                        setMobilePicklesDropdown(
                                            (previous) =>
                                                !previous
                                        )
                                    }
                                    className={
                                        mobilePicklesDropdown
                                            ? "dropdown-toggle-btn dropdown-toggle-active"
                                            : "dropdown-toggle-btn"
                                    }
                                    aria-expanded={
                                        mobilePicklesDropdown
                                    }
                                >

                                    <span className="menu-link-left">

                                        <span className="menu-link-icon">
                                            🥒
                                        </span>

                                        <span className="menu-link-text">
                                            Pickles
                                        </span>

                                    </span>


                                    <span
                                        className={
                                            mobilePicklesDropdown
                                                ? "dropdown-arrow dropdown-arrow-open"
                                                : "dropdown-arrow"
                                        }
                                    >
                                        ▼
                                    </span>

                                </button>


                                {/* PICKLES SUBMENU */}

                                {mobilePicklesDropdown && (

                                    <div className="dropdown-sub-menu">

                                        {categoryList.map(
                                            (category) => (

                                                <button
                                                    type="button"
                                                    key={category.id}
                                                    onClick={() =>
                                                        handleMobileCategoryClick(
                                                            category.name
                                                        )
                                                    }
                                                    className={
                                                        selectedCategory ===
                                                        category.name
                                                            ? "dropdown-sub-item dropdown-sub-item-active"
                                                            : "dropdown-sub-item"
                                                    }
                                                >

                                                    <span className="submenu-dot">
                                                        •
                                                    </span>


                                                    <span className="submenu-name">
                                                        {category.name}
                                                    </span>


                                                    {selectedCategory ===
                                                        category.name && (

                                                        <span className="submenu-check">
                                                            ✓
                                                        </span>

                                                    )}

                                                </button>

                                            )
                                        )}

                                    </div>

                                )}

                            </div>


                            {/* CART */}

                            <Link
                                to="/cart"
                                onClick={closeMenu}
                                className="menu-link"
                            >

                                <span className="menu-link-left">

                                    <span className="menu-link-icon">
                                        🛒
                                    </span>

                                    <span className="menu-link-text">
                                        My Cart
                                    </span>

                                </span>


                                <span className="mobile-menu-cart-right">

                                    {totalCartItems > 0 && (

                                        <span className="mobile-menu-cart-badge">
                                            {totalCartItems}
                                        </span>

                                    )}


                                    <span className="menu-link-arrow">
                                        ›
                                    </span>

                                </span>

                            </Link>

                        </div>


                        {/* =====================================
                            DRAWER FOOTER
                        ===================================== */}

                        <div className="drawer-footer">

                            <span>
                                🌿 Authentic Andhra Flavours
                            </span>

                        </div>

                    </aside>

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
                            onChange={(event) =>
                                setSearchTerm(
                                    event.target.value
                                )
                            }
                            className="search-input"
                        />


                        {searchTerm && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearchTerm("")
                                }
                                className="clear-search-btn"
                                aria-label="Clear search"
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


                {/* =============================================
                    CATEGORY FILTER
                ============================================= */}

                <div className="filter-row">

                    <div className="filter-pills-container">

                        {categoryList.map(
                            (category) => (

                                <button
                                    type="button"
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

                            )
                        )}

                    </div>


                    {!loading && (

                        <span className="item-count-text">

                            {filteredProducts.length}

                            {" "}

                            {filteredProducts.length ===
                                1
                                ? "item"
                                : "items"}

                        </span>

                    )}

                </div>


                {/* =============================================
                    LOADING
                ============================================= */}

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


                {/* =============================================
                    ERROR
                ============================================= */}

                {!loading &&
                    errorMessage && (

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
                                type="button"
                                onClick={() =>
                                    window.location.reload()
                                }
                                className="add-to-bag-btn add-to-bag-active"
                            >
                                Try Again
                            </button>

                        </div>

                    )}


                {/* =============================================
                    NO PRODUCTS
                ============================================= */}

                {!loading &&
                    !errorMessage &&
                    filteredProducts.length ===
                        0 && (

                        <div className="no-results-box">

                            <p className="no-results-icon">
                                🔍
                            </p>


                            <h3>
                                No products found
                            </h3>


                            <p>
                                Try another search or
                                category.
                            </p>


                            <button
                                type="button"
                                onClick={() => {

                                    setSearchTerm("");

                                    setSelectedCategory(
                                        "All"
                                    );

                                }}
                                className="add-to-bag-btn add-to-bag-active"
                            >
                                View All Products
                            </button>

                        </div>

                    )}


                {/* =============================================
                    PRODUCTS
                ============================================= */}

                {!loading &&
                    !errorMessage &&
                    filteredProducts.length >
                        0 && (

                        <div className="product-grid">

                            {filteredProducts.map(
                                (product) => {

                                    /* =================================
                                       NORMALIZE API VALUES
                                    ================================= */

                                    const productId =
                                        product.id ??
                                        product.Id;


                                    const productName =
                                        product.name ??
                                        product.Name ??
                                        "Pickle";


                                    const productDescription =
                                        product.description ??
                                        product.Description ??
                                        "";


                                    const productCategory =
                                        product.categoryName ??
                                        product.CategoryName ??
                                        product.category?.name ??
                                        product.category?.Name ??
                                        "Pickle";


                                    const productWeight =
                                        product.weight ??
                                        product.Weight ??
                                        "";


                                    const productPrice =
                                        Number(
                                            product.price ??
                                            product.Price ??
                                            0
                                        );


                                    const productStock =
                                        Number(
                                            product.stockQuantity ??
                                            product.StockQuantity ??
                                            0
                                        );


                                    const productImage =
                                        product.imageUrl ??
                                        product.ImageUrl ??
                                        "";


                                    const imageUrl =
                                        getImageUrl(
                                            productImage
                                        );


                                    /* =================================
                                       CART ITEM
                                    ================================= */

                                    const cartItem =
                                        cart.find(
                                            (item) =>
                                                item.id ===
                                                productId
                                        );


                                    const currentQty =
                                        cartItem
                                            ? cartItem.quantity
                                            : 0;


                                    /* =================================
                                       STOCK
                                    ================================= */

                                    const isOutOfStock =
                                        productStock <=
                                        0;


                                    return (

                                        <div
                                            key={productId}
                                            className="product-card"
                                        >


                                            {/* =============================
                                                PRODUCT IMAGE
                                            ============================= */}

                                            <div className="product-image-wrapper">


                                                {imageUrl ? (

                                                    <img
                                                        src={imageUrl}
                                                        alt={productName}
                                                        className="image-fit"
                                                        loading="lazy"

                                                        onLoad={(event) => {

                                                            event.currentTarget.classList.add(
                                                                "image-loaded"
                                                            );

                                                        }}

                                                        onError={(event) => {

                                                            console.error(
                                                                "Product image failed:",
                                                                {
                                                                    product:
                                                                        productName,
                                                                    image:
                                                                        productImage,
                                                                    finalUrl:
                                                                        imageUrl,
                                                                }
                                                            );


                                                            event.currentTarget.style.display =
                                                                "none";


                                                            const fallback =
                                                                event.currentTarget
                                                                    .parentElement
                                                                    ?.querySelector(
                                                                        ".image-error-fallback"
                                                                    );


                                                            if (fallback) {

                                                                fallback.style.display =
                                                                    "flex";

                                                            }

                                                        }}
                                                    />

                                                ) : null}


                                                {/* =================================
                                                    IMAGE FALLBACK
                                                ================================= */}

                                                <div
                                                    className="image-error-fallback"
                                                    style={{
                                                        display:
                                                            imageUrl
                                                                ? "none"
                                                                : "flex",
                                                    }}
                                                >

                                                    <span>
                                                        🥒
                                                    </span>

                                                    <small>
                                                        Image unavailable
                                                    </small>

                                                </div>


                                                {/* =================================
                                                    SOLD OUT
                                                ================================= */}

                                                {isOutOfStock && (

                                                    <div className="out-of-stock-overlay">
                                                        SOLD OUT
                                                    </div>

                                                )}

                                            </div>


                                            {/* =============================
                                                PRODUCT DETAILS
                                            ============================= */}

                                            <div className="product-details">

                                                <div>


                                                    {/* CATEGORY + WEIGHT */}

                                                    <div className="product-category-row">

                                                        <span className="product-category-badge">

                                                            {productCategory}

                                                        </span>


                                                        {productWeight && (

                                                            <span className="product-weight">

                                                                {productWeight}

                                                            </span>

                                                        )}

                                                    </div>


                                                    {/* PRODUCT NAME */}

                                                    <h4 className="product-title">

                                                        {productName}

                                                    </h4>


                                                    {/* DESCRIPTION */}

                                                    {productDescription && (

                                                        <p className="product-description">

                                                            {productDescription}

                                                        </p>

                                                    )}

                                                </div>


                                                {/* =============================
                                                    PRICE + CART
                                                ============================= */}

                                                <div>


                                                    <div className="price-counter-row">


                                                        {/* PRICE */}

                                                        <span className="product-price">

                                                            ₹
                                                            {productPrice.toLocaleString(
                                                                "en-IN"
                                                            )}

                                                        </span>


                                                        {/* COUNTER */}

                                                        {currentQty >
                                                            0 &&
                                                            !isOutOfStock && (

                                                                <div className="card-counter-box">


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            updateProductCardQty(
                                                                                productId,
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
                                                                        type="button"
                                                                        onClick={() =>
                                                                            updateProductCardQty(
                                                                                productId,
                                                                                1,
                                                                                productStock
                                                                            )
                                                                        }
                                                                        className="card-counter-btn"
                                                                    >
                                                                        +
                                                                    </button>

                                                                </div>

                                                            )}

                                                    </div>


                                                    {/* ADD / VIEW BAG */}

                                                    {currentQty ===
                                                        0 ? (

                                                        <button
                                                            type="button"
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
                                                            type="button"
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

            <nav
                className="mobile-bottom-nav"
                aria-label="Mobile navigation"
            >


                {/* HOME */}

                <Link
                    to="/"
                    className="bottom-nav-item-active"
                >

                    <span className="bottom-nav-icon">
                        🏠
                    </span>

                    <span className="bottom-nav-label">
                        Home
                    </span>

                </Link>


                {/* CATALOG */}

                <button
                    type="button"
                    onClick={
                        handleMobileCatalogClick
                    }
                    className="bottom-nav-item"
                >

                    <span className="bottom-nav-icon">
                        🥒
                    </span>

                    <span className="bottom-nav-label">
                        Catalog
                    </span>

                </button>


                {/* BAG */}

                <button
                    type="button"
                    onClick={() =>
                        setCartOpen(true)
                    }
                    className="bottom-nav-cart-btn"
                >

                    <span className="bottom-nav-icon">
                        🛒
                    </span>

                    <span className="bottom-nav-label">
                        Bag
                    </span>


                    {totalCartItems > 0 && (

                        <span className="bottom-nav-badge">

                            {totalCartItems}

                        </span>

                    )}

                </button>


                {/* MENU */}

                <button
                    type="button"
                    onClick={openMenu}
                    className="bottom-nav-item"
                    aria-label="Open menu"
                >

                    <span className="bottom-nav-icon">
                        ☰
                    </span>

                    <span className="bottom-nav-label">
                        Menu
                    </span>

                </button>

            </nav>


            {/* =================================================
                FOOTER
            ================================================= */}

            <Footer />

        </div>

    );

}