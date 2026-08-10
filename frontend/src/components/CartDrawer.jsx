import React from "react";
import { Link } from "react-router-dom";
import "./CartDrawer.css";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  totalCartItems,
  subtotalPrice,
  updateCartItemQty
}) {
  if (!isOpen) return null;

  const formatPrice = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>

      <aside
        className="cart-drawer"
        onClick={(e) => e.stopPropagation()}
      >

        {/* ================================
            HEADER
        ================================= */}

        <div className="cart-drawer-header">

          <div>
            <h2>Your Shopping Bag</h2>

            <span>
              {totalCartItems}{" "}
              {totalCartItems === 1 ? "item" : "items"}
            </span>
          </div>

          <button
            type="button"
            className="cart-drawer-close"
            onClick={onClose}
            aria-label="Close cart"
          >
            ✕
          </button>

        </div>


        {/* ================================
            CART CONTENT
        ================================= */}

        <div className="cart-drawer-body">

          {cart.length === 0 ? (

            <div className="cart-empty">

              <div className="cart-empty-icon">
                🛒
              </div>

              <h3>
                Your bag is empty
              </h3>

              <p>
                Add your favourite homemade pickles
                to get started.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="cart-continue-btn"
              >
                Explore Pickles
              </button>

            </div>

          ) : (

            <div className="cart-items">

              {cart.map((item) => (

                <div
                  className="cart-drawer-item"
                  key={item.id}
                >

                  {/* IMAGE */}

                  <div className="cart-drawer-image">

                    {item.imageUrl ? (

                      <img
                        src={item.imageUrl}
                        alt={item.name}
                      />

                    ) : (

                      <span>🥒</span>

                    )}

                  </div>


                  {/* DETAILS */}

                  <div className="cart-drawer-details">

                    <h4>
                      {item.name}
                    </h4>

                    <p>
                      {item.weight || "Pack"}
                    </p>

                    <strong>
                      ₹{formatPrice(item.price)}
                    </strong>


                    {/* QUANTITY */}

                    <div className="cart-quantity">

                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQty(
                            item.id,
                            -1
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateCartItemQty(
                            item.id,
                            1
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>


                  {/* TOTAL */}

                  <div className="cart-drawer-item-total">

                    ₹
                    {formatPrice(
                      Number(item.price) *
                      Number(item.quantity)
                    )}

                  </div>

                </div>

              ))}

            </div>

          )}

        </div>


        {/* ================================
            FOOTER
        ================================= */}

        {cart.length > 0 && (

          <div className="cart-drawer-footer">

            <div className="cart-subtotal">

              <div>
                <span>
                  Subtotal
                </span>

                <small>
                  Delivery charges calculated at checkout
                </small>
              </div>

              <strong>
                ₹{formatPrice(subtotalPrice)}
              </strong>

            </div>


            <Link
              to="/checkout"
              onClick={onClose}
              className="cart-checkout-btn"
            >
              Proceed to Checkout
              <span>→</span>
            </Link>


            <button
              type="button"
              onClick={onClose}
              className="cart-continue-shopping"
            >
              Continue Shopping
            </button>

          </div>

        )}

      </aside>

    </div>
  );
}