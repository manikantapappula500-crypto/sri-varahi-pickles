import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Checkout.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://sri-varahi-pickles.onrender.com";

export default function Checkout({
  isOpen = true,
  onClose,
  cart = []
}) {
  const navigate = useNavigate();

  // =====================================================
  // CART
  // =====================================================

  const activeCart = useMemo(() => {
    if (cart && cart.length > 0) {
      return cart;
    }

    try {
      const savedCart =
        JSON.parse(
          localStorage.getItem("cart") || "[]"
        );

      return Array.isArray(savedCart)
        ? savedCart
        : [];
    } catch {
      return [];
    }
  }, [cart]);


  // =====================================================
  // FORM
  // =====================================================

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    deliveryAddress: "",
    state: "",
    pincode: ""
  });


  // =====================================================
  // UI STATE
  // =====================================================

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [orderSuccess, setOrderSuccess] =
    useState(false);

  const [orderDetails, setOrderDetails] =
    useState(null);


  // =====================================================
  // PRICE
  // =====================================================

  const subtotalPrice = useMemo(() => {

    return activeCart.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
        Number(item.quantity || 0),
      0
    );

  }, [activeCart]);


  const shippingFee =
    subtotalPrice > 0 ? 50 : 0;


  const grandTotal =
    subtotalPrice + shippingFee;


  // =====================================================
  // FORMAT PRICE
  // =====================================================

  const formatPrice = (value) => {

    return Number(value || 0)
      .toLocaleString("en-IN");

  };


  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    // -----------------------------------------------
    // Phone
    // -----------------------------------------------

    if (name === "phoneNumber") {

      const cleaned =
        value
          .replace(/\D/g, "")
          .slice(0, 10);

      setFormData(prev => ({
        ...prev,
        phoneNumber: cleaned
      }));

      return;
    }


    // -----------------------------------------------
    // Pincode
    // -----------------------------------------------

    if (name === "pincode") {

      const cleaned =
        value
          .replace(/\D/g, "")
          .slice(0, 6);

      setFormData(prev => ({
        ...prev,
        pincode: cleaned
      }));

      return;
    }


    // -----------------------------------------------
    // Normal fields
    // -----------------------------------------------

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

  };


  // =====================================================
  // VALIDATION
  // =====================================================

  const validateForm = () => {

    if (activeCart.length === 0) {

      return "Your shopping bag is empty.";

    }


    if (
      !formData.fullName.trim()
    ) {

      return "Please enter your full name.";

    }


    if (
      !/^[6-9]\d{9}$/.test(
        formData.phoneNumber
      )
    ) {

      return "Please enter a valid 10-digit Indian mobile number.";

    }


    if (
      !formData.deliveryAddress.trim()
    ) {

      return "Please enter your complete delivery address.";

    }


    if (!formData.state) {

      return "Please select your delivery state.";

    }


    if (
      !/^\d{6}$/.test(
        formData.pincode
      )
    ) {

      return "Please enter a valid 6-digit pincode.";

    }


    return "";

  };


  // =====================================================
  // SUBMIT ORDER
  // =====================================================

  const handleCheckoutSubmit =
    async (e) => {

      e.preventDefault();

      setErrorMessage("");


      // -----------------------------------------------
      // Validate
      // -----------------------------------------------

      const validationError =
        validateForm();


      if (validationError) {

        setErrorMessage(
          validationError
        );

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });

        return;
      }


      try {

        setSubmitting(true);


        // ---------------------------------------------
        // IMPORTANT
        // Don't send grandTotal as authority.
        // Backend calculates the final amount.
        // ---------------------------------------------

        const response =
          await axios.post(
            `${API_URL}/api/orders/checkout`,
            {
              customer: {
                fullName:
                  formData.fullName.trim(),

                email:
                  formData.email.trim(),

                phoneNumber:
                  formData.phoneNumber.trim(),

                deliveryAddress:
                  formData.deliveryAddress.trim(),

                state:
                  formData.state,

                pincode:
                  formData.pincode.trim()
              },

              items: activeCart
            }
          );


        // ---------------------------------------------
        // Success
        // ---------------------------------------------

        if (
          response.data?.success
        ) {

          const order =
            response.data.order;


          setOrderDetails(order);

          setOrderSuccess(true);


          // Clear cart
          localStorage.removeItem(
            "cart"
          );


          // Notify other tabs/components
          window.dispatchEvent(
            new Event("cartUpdated")
          );

        } else {

          throw new Error(
            response.data?.message ||
            "Order could not be placed."
          );

        }

      } catch (error) {

        console.error(
          "Checkout error:",
          error
        );


        const message =
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to place order. Please try again.";


        setErrorMessage(message);

      } finally {

        setSubmitting(false);

      }

    };


  // =====================================================
  // CLOSE
  // =====================================================

  const handleClose = () => {

    if (submitting) {
      return;
    }

    if (onClose) {
      onClose();
    } else {
      navigate("/");
    }

  };


  // =====================================================
  // IF CLOSED
  // =====================================================

  if (!isOpen) {
    return null;
  }


  // =====================================================
  // SUCCESS SCREEN
  // =====================================================

  if (orderSuccess) {

    return (

      <div className="checkout-overlay">

        <div
          className="checkout-modal"
          onClick={e =>
            e.stopPropagation()
          }
        >

          <div className="checkout-success">

            <div className="checkout-success-icon">
              ✓
            </div>


            <h2>
              Order Placed!
            </h2>


            <p>
              Thank you for ordering
              from Sri Vaarahi Pickles.
            </p>


            {orderDetails && (

              <div className="order-success-card">

                <div className="order-success-row">

                  <span>
                    Order Number
                  </span>

                  <strong>
                    #{orderDetails.id}
                  </strong>

                </div>


                <div className="order-success-row">

                  <span>
                    Amount
                  </span>

                  <strong>
                    ₹
                    {formatPrice(
                      orderDetails.totalAmount
                    )}
                  </strong>

                </div>


                <div className="order-success-row">

                  <span>
                    Payment
                  </span>

                  <strong>
                    Cash on Delivery
                  </strong>

                </div>


                <div className="order-success-status">
                  Order Status:{" "}
                  <strong>
                    {orderDetails.status}
                  </strong>
                </div>

              </div>

            )}


            <button
              type="button"
              className="success-home-btn"
              onClick={() =>
                navigate("/")
              }
            >
              Continue Shopping
            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // CHECKOUT
  // =====================================================

  return (

    <div
      className="checkout-overlay"
      onClick={handleClose}
    >

      <div
        className="checkout-modal"
        onClick={e =>
          e.stopPropagation()
        }
      >

        {/* ===============================================
            HEADER
        =============================================== */}

        <div className="checkout-header">

          <div className="header-title-wrapper">

            <h3>
              Secure Checkout
            </h3>

            <p>
              Complete your delivery details
            </p>

          </div>


          <button
            type="button"
            onClick={handleClose}
            className="checkout-close-btn"
            aria-label="Close checkout"
          >
            ✕
          </button>

        </div>


        {/* ===============================================
            FORM
        =============================================== */}

        <form
          onSubmit={
            handleCheckoutSubmit
          }
          className="checkout-form-layout"
        >

          {/* =============================================
              CUSTOMER DETAILS
          ============================================= */}

          <div className="checkout-main-content">

            <h4 className="section-title">
              📦 Delivery Information
            </h4>


            {/* ERROR */}

            {errorMessage && (

              <div className="checkout-error">
                ⚠️ {errorMessage}
              </div>

            )}


            <div className="form-grid">


              {/* FULL NAME */}

              <div className="form-group">

                <label>
                  Full Name{" "}
                  <span className="required-star">
                    *
                  </span>
                </label>


                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>


                  <input
                    type="text"
                    name="fullName"
                    placeholder="Enter your full name"
                    value={
                      formData.fullName
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="name"
                    required
                  />

                </div>

              </div>


              {/* PHONE */}

              <div className="form-group">

                <label>
                  WhatsApp Mobile Number{" "}
                  <span className="required-star">
                    *
                  </span>
                </label>


                <div className="input-wrapper">

                  <span className="input-icon">
                    📱
                  </span>


                  <input
                    type="tel"
                    inputMode="numeric"
                    name="phoneNumber"
                    placeholder="10-digit mobile number"
                    value={
                      formData.phoneNumber
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="tel"
                    maxLength={10}
                    required
                  />

                </div>

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <label>
                  Email
                  <span
                    style={{
                      color: "#94a3b8",
                      fontWeight: 500
                    }}
                  >
                    {" "}
                    (Optional)
                  </span>
                </label>


                <div className="input-wrapper">

                  <span className="input-icon">
                    ✉️
                  </span>


                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    value={
                      formData.email
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* ADDRESS */}

              <div className="form-group full-width">

                <label>
                  Delivery Address{" "}
                  <span className="required-star">
                    *
                  </span>
                </label>


                <div className="input-wrapper textarea-wrapper">

                  <span className="input-icon textarea-icon">
                    🏠
                  </span>


                  <textarea
                    name="deliveryAddress"
                    placeholder="House / Flat No., Street, Area, Landmark"
                    value={
                      formData.deliveryAddress
                    }
                    onChange={
                      handleChange
                    }
                    autoComplete="street-address"
                    required
                  />

                </div>

              </div>


              {/* STATE */}

              <div className="form-group">

                <label>
                  State{" "}
                  <span className="required-star">
                    *
                  </span>
                </label>


                <div className="input-wrapper select-wrapper">

                  <span className="input-icon">
                    📍
                  </span>


                  <select
                    name="state"
                    value={
                      formData.state
                    }
                    onChange={
                      handleChange
                    }
                    required
                  >

                    <option
                      value=""
                      disabled
                    >
                      Select State
                    </option>

                    <option value="Andhra Pradesh">
                      Andhra Pradesh
                    </option>

                    <option value="Telangana">
                      Telangana
                    </option>

                    <option value="Karnataka">
                      Karnataka
                    </option>

                    <option value="Tamil Nadu">
                      Tamil Nadu
                    </option>

                    <option value="Maharashtra">
                      Maharashtra
                    </option>

                    <option value="Kerala">
                      Kerala
                    </option>

                    <option value="Other">
                      Other
                    </option>

                  </select>

                </div>

              </div>


              {/* PINCODE */}

              <div className="form-group">

                <label>
                  Pincode{" "}
                  <span className="required-star">
                    *
                  </span>
                </label>


                <div className="input-wrapper">

                  <span className="input-icon">
                    📮
                  </span>


                  <input
                    type="text"
                    inputMode="numeric"
                    name="pincode"
                    placeholder="6-digit pincode"
                    value={
                      formData.pincode
                    }
                    onChange={
                      handleChange
                    }
                    maxLength={6}
                    autoComplete="postal-code"
                    required
                  />

                </div>

              </div>

            </div>

          </div>


          {/* =============================================
              ORDER SUMMARY
          ============================================= */}

          <div className="checkout-sidebar-summary">

            <h4 className="section-title">
              🛒 Order Summary
            </h4>


            <div className="summary-card">

              {/* ITEMS */}

              {activeCart.map(item => (

                <div
                  className="summary-row"
                  key={item.id}
                >

                  <span>
                    {item.name}
                    {" "}
                    ×{" "}
                    {item.quantity}
                  </span>

                  <span>
                    ₹
                    {formatPrice(
                      Number(item.price) *
                      Number(item.quantity)
                    )}
                  </span>

                </div>

              ))}


              <div className="summary-divider" />


              {/* SUBTOTAL */}

              <div className="summary-row">

                <span>
                  Items Subtotal
                </span>

                <span>
                  ₹
                  {formatPrice(
                    subtotalPrice
                  )}
                </span>

              </div>


              {/* SHIPPING */}

              <div className="summary-row">

                <span>
                  Delivery
                </span>

                <span>
                  ₹
                  {formatPrice(
                    shippingFee
                  )}
                </span>

              </div>


              <div className="summary-divider" />


              {/* TOTAL */}

              <div className="summary-row total-row">

                <span>
                  Total
                </span>

                <span className="amount-highlight">
                  ₹
                  {formatPrice(
                    grandTotal
                  )}
                </span>

              </div>

            </div>


            {/* COD */}

            <div className="payment-badge-note">

              🔒 Cash on Delivery available

            </div>


            {/* PLACE ORDER */}

            <button
              type="submit"
              className="place-order-btn"
              disabled={
                submitting ||
                activeCart.length === 0
              }
            >

              {submitting ? (

                <>
                  <span>
                    Placing Order...
                  </span>
                </>

              ) : (

                <>
                  <span>
                    Confirm & Place Order
                  </span>

                  <span>
                    🚀
                  </span>
                </>

              )}

            </button>

          </div>

        </form>

      </div>

    </div>

  );
}