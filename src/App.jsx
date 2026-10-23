import "./mobile-responsive-overrides.css";

import { useEffect, useState } from "react";

import "./App.css";

const API_URL =

  "https\://script.google.com/macros/s/AKfycbwsZw83dmTpWFJ4ah-tTXuJEoGkkIbxdyK4_FV63O26-8rZYFUGM5zb3u3XDuBTgVTq/exec";

function App() {

  const [username, setUsername] = useState("");

  const [mobile, setMobile] = useState("");

  const [loggedIn, setLoggedIn] = useState(false);

  const [sessionChecking, setSessionChecking] = useState(true);

  const [sessionToken, setSessionToken] = useState("");

  const [products, setProducts] = useState([]);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState("all");

  const [availability, setAvailability] = useState("all");

  const [sortBy, setSortBy] = useState("newest");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [detailsImageIndex, setDetailsImageIndex] = useState(0);

  const [detailsProduct, setDetailsProduct] = useState(null);

  const [quantity, setQuantity] = useState(1);

  const [cart, setCart] = useState([]);

  const [showCart, setShowCart] = useState(false);

  const [activePage, setActivePage] = useState("catalogue");

  const [myOrders, setMyOrders] = useState([]);

  const [ordersLoading, setOrdersLoading] = useState(false);

  const [cartSubmitting, setCartSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState("");

  const [customerMobile, setCustomerMobile] = useState("");

  

  useEffect(() => {
  let cancelled = false;

  async function restoreSession() {
    try {
      const savedSession = localStorage.getItem("aal_session");

      if (!savedSession) return;

      const session = JSON.parse(savedSession);

      if (
        !session.sessionToken ||
        !session.expiresAt ||
        Date.now() >= session.expiresAt
      ) {
        localStorage.removeItem("aal_session");
        return;
      }

      const result = await apiRequest({
        action: "products",
        sessionToken: session.sessionToken,
      });

      if (cancelled) return;

      if (!result.success) {
        localStorage.removeItem("aal_session");
        return;
      }

      setSessionToken(session.sessionToken);
      setProducts(result.products || []);
      setLoggedIn(true);
    } catch (error) {
      console.error("Session restore failed:", error);
    } finally {
      if (!cancelled) {
        setSessionChecking(false);
      }
    }
  }

  restoreSession();

  return () => {
    cancelled = true;
  };
}, []);

  async function apiRequest(payload) {

    const response = await fetch(API_URL, {

      method: "POST",

      headers: { "Content-Type": "text/plain;charset=utf-8" },

      body: JSON.stringify(payload),

    });

    return response.json();

  }

  async function handleLogin(event) {

    event.preventDefault();

    setLoading(true);

    setMessage("");

    try {

      const result = await apiRequest({

        action: "login",

        username: username.trim(),

        mobile: mobile.trim(),

      });

      if (!result.success) {

        setMessage(result.message || "Login failed.");

        return;

      }

      setSessionToken(result.sessionToken);

      localStorage.setItem(
  "aal_session",
  JSON.stringify({
    sessionToken: result.sessionToken,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })
);

      const productResult = await apiRequest({

        action: "products",

        sessionToken: result.sessionToken,

      });

      if (!productResult.success) {

        setMessage(productResult.message || "Unable to load products.");

        return;

      }

      setProducts(productResult.products || []);

      setLoggedIn(true);

      setMessage("");

    } catch {

      setMessage(

        "Connection failed. Please check the API deployment and try again."

      );

    } finally {

      setLoading(false);

    }

  }

async function loadMyOrders() {

  setOrdersLoading(true);

  setMessage("");

  try {

    const result = await apiRequest({

      action: "myOrders",

      sessionToken

    });

    if (!result.success) {

      setMessage(result.message || "Unable to load your orders.");

      return;

    }

    setMyOrders(result.orders || []);

    setActivePage("myOrders");

  } catch {

    setMessage("Could not load orders. Please try again.");

  } finally {

    setOrdersLoading(false);

  }

}

  async function handleLogout() {

    try {

      await apiRequest({ action: "logout", sessionToken });

    } catch {

      // Local logout still proceeds if the network is unavailable.

    }
    localStorage.removeItem("aal_session");
    setLoggedIn(false);

    setSessionToken("");

    setProducts([]);

    setUsername("");

    setMobile("");

    setSelectedProduct(null);

    setMessage("");

  }


function openProductDetails(product) {
  setDetailsProduct(product);
  setDetailsImageIndex(0);
  setMessage("");
}
  
function addToCart(product, event) {
  if (Number(product.stockQty) <= 0) {
    setMessage("This product is currently out of stock.");
    return;
  }

  const button = event?.currentTarget;
  const cartButton = document.querySelector(".cart-header-button");

  // Start the flying product image animation.
  const productCard = button?.closest(".product-card");
  const sourceImage =
    productCard?.querySelector(".product-image img") ||
    document.querySelector(".details-main-image img");

  if (sourceImage && cartButton) {
    const start = sourceImage.getBoundingClientRect();
    const end = cartButton.getBoundingClientRect();

    const flyingImage = sourceImage.cloneNode(true);

    Object.assign(flyingImage.style, {
      position: "fixed",
      left: `${start.left}px`,
      top: `${start.top}px`,
      width: `${start.width}px`,
      height: `${start.height}px`,
      objectFit: "contain",
      zIndex: "99999",
      pointerEvents: "none",
      borderRadius: "10px",
      boxShadow: "0 0 18px rgba(255, 204, 0, 0.7)",
      margin: "0",
    });

    document.body.appendChild(flyingImage);

    const deltaX =
      end.left + end.width / 2 - (start.left + start.width / 2);

    const deltaY =
      end.top + end.height / 2 - (start.top + start.height / 2);

    const animation = flyingImage.animate(
      [
        {
          transform: "translate(0, 0) scale(1)",
          opacity: 1,
          filter: "drop-shadow(0 0 5px rgba(255, 204, 0, 0.5))",
        },
        {
          transform: `translate(${deltaX * 0.55}px, ${deltaY * 0.55 - 70}px) scale(0.55)`,
          opacity: 0.95,
          offset: 0.65,
        },
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(0.12)`,
          opacity: 0.15,
          filter: "drop-shadow(0 0 12px rgba(255, 204, 0, 1))",
        },
      ],
      {
        duration: 900,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      }
    );

    animation.onfinish = () => {
      flyingImage.remove();

      cartButton.classList.remove("cart-fly-bounce");

      // Restart the bounce animation.
      void cartButton.offsetWidth;

      cartButton.classList.add("cart-fly-bounce");

      window.setTimeout(() => {
        cartButton.classList.remove("cart-fly-bounce");
      }, 500);
    };

    animation.oncancel = () => flyingImage.remove();
  }

  setCart((current) => {
    const existing = current.find(
      (item) => item.product.productId === product.productId
    );

    if (existing) {
      if (existing.quantity >= Number(product.stockQty)) {
        return current;
      }

      return current.map((item) =>
        item.product.productId === product.productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    }

    return [...current, { product, quantity: 1 }];
  });

  setMessage(`CART_ADDED:${product.itemName}`);

 window.setTimeout(() => {
  setMessage((current) =>
    current === `CART_ADDED:${product.itemName}` ? "" : current
  );
}, 2200);
}

  function changeCartQuantity(productId, nextQuantity) {

    const product = products.find((item) => item.productId === productId);

    const qty = Number(nextQuantity);

    if (!product || !Number.isInteger(qty) || qty < 1) return;

    setCart((current) => current.map((item) => item.product.productId === productId

      ? { ...item, quantity: Math.min(qty, Number(product.stockQty) || 1) } : item));

  }

  function removeFromCart(productId) {

    setCart((current) => current.filter((item) => item.product.productId !== productId));

  }


async function submitCartOrder() {
  if (!cart.length) return;

  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.product.retailPrice || 0) *
        Number(item.quantity || 0),
    0
  );

  if (cartTotal < 1500) {
    setMessage(
      `Minimum order value is ₹1,500. Add ₹${Math.ceil(
        1500 - cartTotal
      ).toLocaleString("en-IN")} more to continue.`
    );
    return;
  }

  if (!customerName.trim()) {
    setMessage("Please enter your name.");
    return;
  }

  if (!/^[6-9]\d{9}$/.test(customerMobile.trim())) {
    setMessage("Enter a valid 10-digit mobile number.");
    return;
  }

  // Validate quantities before sending the cart.
  for (const item of cart) {
    const quantity = Number(item.quantity);
    const stock = Number(item.product.stockQty);

    if (!Number.isSafeInteger(quantity) || quantity < 1) {
      setMessage("Please enter a valid quantity for every product.");
      return;
    }

    if (Number.isFinite(stock) && quantity > stock) {
      setMessage(
        `Requested quantity exceeds available stock for ${
          item.product.itemName || "a product"
        }.`
      );
      return;
    }
  }

  setCartSubmitting(true);
  setMessage("");

  try {
    const result = await apiRequest({
      action: "cartOrder",
      sessionToken,
      customerName: customerName.trim(),
      customerMobile: customerMobile.trim(),
      items: cart.map((item) => ({
        productId: item.product.productId,
        quantity: Number(item.quantity),
      })),
    });

    if (result.success) {
      const requestIds = Array.isArray(result.requestIds)
        ? result.requestIds.join(", ")
        : "";

      setMessage(
        `SUCCESS: ${result.message || "Cart order submitted."}${
          requestIds ? ` Request IDs: ${requestIds}` : ""
        }`
      );

      setCart([]);
      setShowCart(false);

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } else {
      setMessage(result.message || "Order request failed.");
    }
  } catch {
    setMessage(
      "Connection issue while submitting cart. Please check My Orders before retrying."
    );
  } finally {
    setCartSubmitting(false);
  }
}


  async function submitRequest(outOfStock = false) {

    if (!selectedProduct) return;

    if (!outOfStock) {

  const qty = Number(quantity);

  if (!customerName.trim()) {

    setMessage("Please enter your name.");

    return;

  }

  if (!/^\d{10}$/.test(customerMobile)) {

    setMessage("Enter a valid 10-digit mobile number.");

    return;

  }

  if (

    !Number.isInteger(qty) ||

    qty < 1 ||

    qty > selectedProduct.stockQty

  ) {

    setMessage("Enter a valid quantity within available stock.");

    return;

  }

}

    setLoading(true);

    setMessage("");

    try {

      const result = await apiRequest({

        action: outOfStock ? "outOfStock" : "order",

        sessionToken,

        productId: selectedProduct.productId,

        quantity: Number(quantity),

        customerName: customerName.trim(),

customerMobile: customerMobile,

      });

     setMessage(

  result.success

    ? `SUCCESS: ${result.message} Request ID: ${result.requestId}`

    : result.message || "Request failed."

);

if (result.success) {

  setTimeout(() => {

    setMessage("");

  }, 5000);

}

      if (result.success) setSelectedProduct(null);

    } catch {

      setMessage("Could not submit the request. Please try again.");

    } finally {

      setLoading(false);

    }

  }

  const categories = [...new Set(

    products.map((product) => String(product.category || "").trim()).filter(Boolean)

  )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

const catalogueSource =

  activePage === "outOfStock"

    ? products.filter((product) => Number(product.stockQty) <= 0)

    : products.filter((product) => Number(product.stockQty) > 0);

  const filteredProducts = catalogueSource

    .map((product, originalIndex) => ({ product, originalIndex }))

    .filter(({ product }) => {

      const query = search.trim().toLocaleLowerCase();

      const searchableText = [product.itemName, product.category, product.description, product.productId]

        .map((value) => String(value || ""))

        .join(" ")

        .toLocaleLowerCase();

      const matchesSearch = !query || searchableText.includes(query);

      const productCategory = String(product.category || "").trim().toLocaleLowerCase();

      const matchesCategory = selectedCategory === "all"

        || productCategory === String(selectedCategory).trim().toLocaleLowerCase();

      const stock = Number(product.stockQty) || 0;

      const matchesAvailability = availability === "all"

        || (availability === "in-stock" && stock > 0)

        || (availability === "out-of-stock" && stock <= 0);

      return matchesSearch && matchesCategory && matchesAvailability;

    })

    .sort((a, b) => {

      const productA = a.product;

      const productB = b.product;

      const priceA = Number(productA.retailPrice) || 0;

      const priceB = Number(productB.retailPrice) || 0;

      switch (sortBy) {

        case "price-asc":

          return priceA - priceB || a.originalIndex - b.originalIndex;

        case "price-desc":

          return priceB - priceA || a.originalIndex - b.originalIndex;

        case "name-asc":

          return String(productA.itemName || "").localeCompare(

            String(productB.itemName || ""), undefined, { sensitivity: "base" }

          ) || a.originalIndex - b.originalIndex;

        case "newest":

        default: {

          const timeA = Date.parse(productA.updatedAt || productA.createdAt || "") || 0;

          const timeB = Date.parse(productB.updatedAt || productB.createdAt || "") || 0;

          // If timestamps are present, newest comes first; otherwise keep the sheet's order.

          return (timeB - timeA) || a.originalIndex - b.originalIndex;

        }

      }

    })

    .map(({ product }) => product);

    if (sessionChecking) {
return (
  <main className="jarvis-loader">
    <div className="jarvis-grid" aria-hidden="true" />

    <div className="jarvis-loader-content">
      <div className="jarvis-status">
        <span className="jarvis-status-dot" />
        AAL ENTERPRISES <span>•</span> SYSTEM ONLINE
      </div>

      <div
        className="jarvis-core"
        role="status"
        aria-label="Checking your session"
      >
        <div className="jarvis-ring jarvis-ring-outer" />
        <div className="jarvis-ring jarvis-ring-middle" />
        <div className="jarvis-ring jarvis-ring-inner" />

        <div className="jarvis-scan-line" />

        <div className="jarvis-core-logo">
          <span>AAL</span>
          <small>SECURE</small>
        </div>
      </div>

      <h2 className="jarvis-title">INITIALIZING ACCESS</h2>

      <p className="jarvis-description">
        Verifying your session...
      </p>

      <div className="jarvis-progress">
        <div className="jarvis-progress-fill" />
      </div>

      <div className="jarvis-footer">
        <span>SESSION AUTHENTICATION</span>
        <span className="jarvis-live">● LIVE</span>
      </div>
    </div>
  </main>
);
    }

if (!loggedIn) {

  return (

    

    <main className="login-preview">

      <div className="preview-site">

        <header className="preview-nav">

          <div className="brand">

            <div className="brand-mark small">AAL</div>

            <div>

              <strong>AAL Enterprises</strong>

              <span>Wholesale &amp; Electronics</span>

            </div>

          </div>

          <nav>

            <a href="#home">Home</a>

            <a href="#products">Products</a>

            <button

              className="primary-button"

              onClick={() => document.getElementById("username")?.focus()}

            >

              Login to catalogue

            </button>

          </nav>

        </header>

        <section className="preview-hero" id="home">

          <div className="preview-hero-copy">

            <p className="eyebrow">YOUR B2B WHOLESALE PARTNER</p>

            <h1>

              Discover products.

              <br />

              <span>Request with ease.</span>

            </h1>

            <p>

              Explore electronics, home appliances and more.

              Access our catalogue by signing in with your registered details.

            </p>

            <button

              className="primary-button"

              onClick={() => document.getElementById("username")?.focus()}

            >

              Explore Catalogue →

            </button>

          </div>

          <div className="preview-emblem">

            <div className="preview-emblem-inner">

              <strong>AAL</strong>

              <span>ENTERPRISES</span>

              <small>Online Wholesale Market</small>

            </div>

          </div>

        </section>

        <section className="preview-catalogue" id="products">

          <p className="eyebrow">OUR CATALOGUE</p>

          <h2>Explore Products</h2>

          <p>Quality products from your wholesale partner.</p>

          <div className="preview-grid">

            {[

              { name: "Audio & Earbuds", category: "Electronics" },

              { name: "Home Appliances", category: "Home" },

              { name: "Chargers & Cables", category: "Accessories" },

              { name: "Speakers", category: "Electronics" },

            ].map((item) => (

              <article className="preview-product" key={item.name}>

                <div className="preview-product-image">

                  <span>AAL</span>

                </div>

                <div className="preview-product-info">

                  <span>{item.category}</span>

                  <h3>{item.name}</h3>

                  <p>

                    Sign in to view product details and pricing.

                  </p>

                </div>

              </article>

            ))}

          </div>

        </section>

      </div>

      <div className="login-overlay">

        <section className="login-card">

          <div className="brand-mark">AAL</div>

          <p className="eyebrow">AAL ENTERPRISES</p>

          <h1>Access your catalogue</h1>

          <p className="muted">

            Enter the name and mobile number registered with AAL Enterprises.

          </p>

          <form onSubmit={handleLogin}>

            <label htmlFor="username">Full name</label>

            <input

              id="username"

              value={username}

              onChange={(e) => setUsername(e.target.value)}

              placeholder="Enter your registered name"

              autoComplete="name"

              required

            />

            <label htmlFor="mobile">Mobile number</label>

            <input

              id="mobile"

              value={mobile}

              onChange={(e) => setMobile(e.target.value)}

              placeholder="10-digit mobile number"

              inputMode="numeric"

              autoComplete="tel"

              maxLength={10}

              pattern="[0-9]{10}"

              required

            />

            {message && <p className="message error">{message}</p>}

            <button className="primary-button" disabled={loading}>

              {loading ? "Checking..." : "Continue →"}

            </button>

          </form>

          <p className="login-footnote">

            Access is limited to registered customers.

          </p>

        </section>

      </div>

    </main>

  );

}

  return (

<main className="store-page">

        {detailsProduct && activePage === "catalogue" && (
        <section className="catalogue product-details-page">
          <button
            className="outline-button"
            onClick={() => setDetailsProduct(null)}
          >
            ← Back to Catalogue
          </button>

          <div className="product-details-layout">
           
<div className="product-details-image">
  {(() => {
    const galleryImages =
      Array.isArray(detailsProduct.galleryImages) &&
      detailsProduct.galleryImages.length
        ? detailsProduct.galleryImages
        : detailsProduct.imageUrl
          ? [detailsProduct.imageUrl]
          : [];

    const safeIndex = Math.min(
      detailsImageIndex,
      Math.max(galleryImages.length - 1, 0)
    );

    return galleryImages.length > 0 ? (
      <>
        <div className="details-main-image">
          <img
            src={getDisplayImageUrl(galleryImages[safeIndex])}
            alt={detailsProduct.itemName}
            referrerPolicy="no-referrer"
          />
          
        </div>

        {galleryImages.length > 1 && (
          <div className="details-gallery-thumbnails">
            {galleryImages.map((image, index) => (
              <button
                type="button"
                key={`${image}-${index}`}
                className={`details-gallery-thumb ${
                  safeIndex === index ? "active" : ""
                }`}
                onClick={() => setDetailsImageIndex(index)}
                aria-label={`View image ${index + 1}`}
                aria-pressed={safeIndex === index}
              >
                <img
                  src={getDisplayImageUrl(image)}
                  alt={`${detailsProduct.itemName} ${index + 1}`}
                  referrerPolicy="no-referrer"
                />
                <span>{index + 1}</span>
              </button>
            ))}
          </div>
        )}
      </>
    ) : (
      <div className="product-image-placeholder">
        Image unavailable
      </div>
    );
  })()}
    </div>

    <div className="product-details-info">

              <p className="product-id-label details-product-id">
  Product ID: {detailsProduct.productId}
</p>
              <p className="eyebrow">
                {detailsProduct.category || "PRODUCT DETAILS"}
              </p>

              <h1>{detailsProduct.itemName}</h1>

              <p>
                {detailsProduct.description ||
                  "Quality product from AAL Enterprises."}
              </p>

              <h2>
                ₹{Number(detailsProduct.retailPrice || 0).toLocaleString("en-IN")}
              </h2>

              <p>
                Availability:{" "}
                {Number(detailsProduct.stockQty || 0) > 0
                  ? `${detailsProduct.stockQty} available`
                  : "Out of stock"}
              </p>

              {Number(detailsProduct.stockQty || 0) > 0 ? (
                <button
  className="cart-add-button"
  onClick={(event) => addToCart(detailsProduct, event)}
>
                  + Add to Cart
                </button>
              ) : null}

              <button
                className="primary-button"
                onClick={() => {
                  setSelectedProduct(detailsProduct);
                  setQuantity(1);
                  setMessage("");
                }}
              >
                {Number(detailsProduct.stockQty || 0) > 0
                  ? "Request order"
                  : "Request stock"}
              </button>

            </div>
</div>
</section>
         )}

      {activePage === "myOrders" && (

        <section className="catalogue my-orders-page">

            <div className="section-heading">

              <div>

                <p className="eyebrow">YOUR ACCOUNT</p>

                <h2>My Orders</h2>

                <p>View your submitted order requests.</p>

              </div>

              <button

                className="outline-button"

                onClick={() => setActivePage("catalogue")}

              >

                Back to Catalogue

              </button>

            </div>

            {ordersLoading ? (

              <p>Loading your orders...</p>

            ) : myOrders.length === 0 ? (

              <div className="empty-state">

                <h3>No orders found</h3>

                <p>Your submitted orders will appear here.</p>

              </div>

            ) : (

              <div className="product-grid">

               {myOrders.map((order) => (
  <article className="my-order-card" key={order.requestId}>
    <div className="my-order-header">
      <div className="my-order-reference">
        <span className="my-order-label">ORDER REFERENCE</span>
        <strong>{order.requestId}</strong>
      </div>

      <span
        className={`my-order-status status-${String(
          order.requestStatus || "Pending"
        )
          .toLowerCase()
          .replace(/\s+/g, "-")}`}
      >
        {order.requestStatus || "Pending"}
      </span>
    </div>

    <div className="my-order-product">
      <div className="my-order-product-icon" aria-hidden="true">
        📦
      </div>

      <div className="my-order-product-info">
        <h3>{order.itemName}</h3>
        <p>
          Quantity: <strong>{order.quantity}</strong>
        </p>
      </div>

      <div className="my-order-price">
        <span>Price per item</span>
        <strong>
          ₹{Number(order.retailPrice || 0).toLocaleString("en-IN")}
        </strong>

        <span className="my-order-total-label">Total Value</span>
        <strong className="my-order-total-value">
          ₹
          {(
            Number(order.retailPrice || 0) *
            Number(order.quantity || 0)
          ).toLocaleString("en-IN")}
        </strong>
      </div>
    </div>

    <div className="my-order-customer">
      <div>
        <span>Customer</span>
        <strong>{order.customerName || "—"}</strong>
      </div>

      <div>
        <span>Mobile Number</span>
        <strong>{order.customerMobile || "—"}</strong>
      </div>
    </div>
  </article>
))}

              </div>

            )}

          </section>

      )}

    {activePage !== "myOrders" && (

      <header className="store-header">

        <div className="brand">

          <div className="brand-mark small">AAL</div>

          <div>

            <strong>AAL Enterprises</strong>

            <small>Online Wholesale Market</small>

          </div>

        </div>

        <div className="header-actions">

          <button className="cart-header-button" onClick={() => { setShowCart(true); setMessage(""); }}>

            Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})

          </button>

          <button

  className="outline-button"

  onClick={loadMyOrders}

  disabled={ordersLoading}

>

  {ordersLoading ? "Loading Orders..." : "My Orders"}

</button>

          <button

  className="outline-button"

  onClick={() => {

    setActivePage((current) =>

      current === "catalogue" ? "outOfStock" : "catalogue"

    );

    setMessage("");

  }}
>

  {activePage === "catalogue"

    ? "OUT OF STOCK"

    : "Back to Catalogue"}

</button>

          <button className="outline-button" onClick={handleLogout}>Logout</button>

        </div>

      </header>

      )}

      {activePage !== "myOrders" && !detailsProduct && (

      <section className="welcome-banner">

        <p className="eyebrow">

  {activePage === "outOfStock"

    ? "OUT OF STOCK PRODUCTS"

    : "YOUR PRODUCT CATALOGUE"}

</p>

        <h1>

  {activePage === "outOfStock"

    ? "Currently Out of Stock"

    : "Find the right product."}

</h1>

        <p>

  {activePage === "outOfStock"

    ? "Request unavailable products and we will record your request."

    : "Explore available items and submit an order request."}

</p>

        <div className="search-row">

          <input

            className="search-input"

            value={search}

            onChange={(e) => setSearch(e.target.value)}

            placeholder="Search products or categories..."

            aria-label="Search products or categories"

          />

          <button

            type="button"

            className="filter-reset-button search-reset-button"

            onClick={() => { setSearch(""); setSelectedCategory("all"); setAvailability("all"); setSortBy("newest"); }}

          >

            Reset filters

          </button>

        </div>

        <div className="catalogue-filters" aria-label="Catalogue filters">

          <label className="filter-field">

            <span>Category</span>

            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>

              <option value="all">All Categories</option>

              {categories.map((category) => (

                <option value={category} key={category}>{category}</option>

              ))}

            </select>

          </label>

          <label className="filter-field">

            <span>Sort By</span>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>

              <option value="newest">Newest First</option>

              <option value="price-asc">Price: Low to High</option>

              <option value="price-desc">Price: High to Low</option>

              <option value="name-asc">Name: A–Z</option>

            </select>

          </label>

        </div>

      </section>

      )}

      
    
{message && (
  message.startsWith("SUCCESS:") ? (
    <div className="aal-success-card" role="status" aria-live="polite">
      <div className="aal-success-icon" aria-hidden="true">
        ✓
      </div>

      <div className="aal-success-content">
        <span className="aal-success-label">AAL ENTERPRISES</span>

        <h3>Order Request Submitted!</h3>

        <p>
          Your order requests have been submitted successfully.
          You can track their status in My Orders.
        </p>

        {(() => {
          const idsMatch = message.match(/Request IDs:\s*(.+)$/);
          const requestIds = idsMatch
            ? idsMatch[1].split(",").map((id) => id.trim()).filter(Boolean)
            : [];

          return requestIds.length > 0 ? (
            <div className="aal-order-references">
              <span className="aal-reference-title">ORDER REFERENCE</span>

              <div className="aal-reference-list">
                {requestIds.map((id) => (
                  <span className="aal-reference-badge" key={id}>
                    {id}
                  </span>
                ))}
              </div>
            </div>
          ) : null;
        })()}
      </div>

      <button
        type="button"
        className="aal-success-close"
        onClick={() => setMessage("")}
        aria-label="Dismiss success message"
      >
        ×
      </button>
     </div>
  ) : (
    message.startsWith("CART_ADDED:") ? (
    <div className="aal-cart-toast" role="status" aria-live="polite">
      <span className="aal-cart-toast-check">✓</span>

      <div className="aal-cart-toast-text">
        <strong>Added to Cart!</strong>
        <span>{message.slice("CART_ADDED:".length)}</span>
      </div>
    </div>
  ) : (
    <p className="message">{message}</p>
  )
  )
)}

  


      {activePage !== "myOrders" && !detailsProduct && (
  <section className="catalogue">

        <div className="section-heading">

          <div>

            <p className="eyebrow">OUR INVENTORY</p>

            <h2>Products</h2>

          </div>

          <span className="product-count">

            {filteredProducts.length} items

          </span>

        </div>

        {filteredProducts.length === 0 ? (

          <div className="empty-state">

            <h3>No products found</h3>

            <p>Products marked Active in the inventory will appear here.</p>

          </div>

        ) : (

          <div className="product-grid">

            {filteredProducts.map((product) => (

              <article className="product-card" key={product.productId}>

                <div className="product-image">

                  {product.imageUrl ? (

<img

  src={getDisplayImageUrl(product.imageUrl)}

referrerPolicy="no-referrer"

  alt={product.itemName}
  onClick={() => openProductDetails(product)}
style={{ cursor: "pointer" }}

onError={(e) => {

  const img = e.currentTarget;

  const originalUrl = img.src;

  if (

    originalUrl.includes("drive.google.com/thumbnail") &&

    !img.dataset.fallbackTried

  ) {

    img.dataset.fallbackTried = "true";

    const match = originalUrl.match(/[?&]id=([^&]+)/);

    if (match) {

      img.src =

        `https\://drive.google.com/uc?export=view&id=${match[1]}`;

      return;

    }

  }

  img.style.display = "none";

}}

/>

                  ) : (

                    <span className="image-placeholder">

                      {product.category || "AAL"}

                    </span>

                  )}

                  <span

                    className={`stock-badge ${

                      product.stockQty > 0 ? "in-stock" : "out-stock"

                    }`}

                  >

                    {product.stockQty > 0 ? "In stock" : "Out of stock"}

                  </span>

                </div>

                <div className="product-info">


<p className="category-label">{product.category}</p>

<h3
  className="product-title-clickable"
  onClick={() => openProductDetails(product)}
  role="button"
  tabIndex={0}
  onKeyDown={(event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openProductDetails(product);
    }
  }}
>
  {product.itemName}
</h3>

<p className="product-id">
  Product ID: {product.productId}
</p>
          

                  <div className="price-row">

                    <strong>₹{product.retailPrice.toLocaleString("en-IN")}</strong>

                    {product.discount > 0 && (

                      <span>{product.discount}% off</span>

                    )}

                  </div>

                  <p className="stock-text">

                    {product.stockQty > 0

                      ? `${product.stockQty} available`

                      : "Currently unavailable"}

                  </p>

                  {Number(product.stockQty) > 0 && (

                   <button
  className="cart-add-button"
  onClick={(event) => addToCart(product, event)}
>+ Add to Cart</button>

                  )}

                  <button

                    className="primary-button"

                    onClick={() => {

                      setSelectedProduct(product);

                      setQuantity(1);

                      setMessage("");

                    }}

                  >

                    {product.stockQty > 0 ? "Request order" : "Request stock"}

                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

      )}

      <footer className="store-footer">

        © {new Date().getFullYear()} AAL Enterprises

      </footer>

      {showCart && (

        <div className="modal-backdrop" onClick={() => setShowCart(false)}>

          <section className="request-modal cart-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="cart-title">

            <button className="modal-close" onClick={() => setShowCart(false)} aria-label="Close cart">×</button>

            <p className="eyebrow">YOUR SELECTION</p><h2 id="cart-title">Shopping Cart</h2>

            {cart.length === 0 ? <p className="muted">Your cart is empty. Add products from the catalogue.</p> : <>

              <div className="cart-items">

                {cart.map(({ product, quantity: qty }) => <div className="cart-item" key={product.productId}>

                  <div className="cart-item-copy"><strong>{product.itemName}</strong><span>₹{Number(product.retailPrice).toLocaleString("en-IN")} each</span></div>

<div className="cart-item-controls">

  <button

    type="button"

    onClick={() =>

      changeCartQuantity(product.productId, qty - 1)

    }

    disabled={qty <= 1}

  >

    −

  </button>

<input

  className="cart-quantity-input"

  type="number"

  min="1"

  max={Number(product.stockQty)}

  step="1"

  value={qty}

  aria-label={`Quantity for ${product.itemName}`}

  onChange={(e) => {

    const value = e.target.value;

    const stock = Number(product.stockQty);

    if (value === "") {

      setCart((current) =>

        current.map((item) =>

          item.product.productId === product.productId

            ? { ...item, quantity: "" }

            : item

        )

      );

      return;

    }

    const nextQty = Number(value);

    if (

      Number.isInteger(nextQty) &&

      nextQty >= 1 &&

      nextQty <= stock

    ) {

      changeCartQuantity(product.productId, nextQty);

    }

  }}

  onBlur={(e) => {

    const value = Number(e.target.value);

    const stock = Number(product.stockQty);

    if (!Number.isInteger(value) || value < 1) {

      changeCartQuantity(product.productId, 1);

    } else if (value > stock) {

      changeCartQuantity(product.productId, stock);

    }

  }}

/>

  <button

    type="button"

    onClick={() =>

      changeCartQuantity(product.productId, qty + 1)

    }

    disabled={qty >= Number(product.stockQty)}

  >

    +

  </button>

  <button

    type="button"

    className="cart-remove"

    onClick={() => removeFromCart(product.productId)}

  >

    Remove

  </button>

</div>

<p className="cart-available-stock">

  Available stock: {product.stockQty}

</p>

<strong className="cart-line-total">

  ₹{(Number(product.retailPrice) * qty).toLocaleString("en-IN")}

</strong>

                </div>)}

              </div>

              <div className="cart-total"><span>Estimated total</span><strong>₹{cart.reduce((sum, item) => sum + Number(item.product.retailPrice || 0) * item.quantity, 0).toLocaleString("en-IN")}</strong></div>

              
{(() => {
  const cartTotal = cart.reduce(
    (sum, item) =>
      sum +
      Number(item.product.retailPrice || 0) * Number(item.quantity || 0),
    0
  );
  const remaining = Math.max(0, 1500 - cartTotal);

  return (
    <div className={`minimum-order-notice ${remaining === 0 ? "reached" : ""}`}>
      <strong>
        {remaining > 0
          ? "Minimum order not reached"
          : "Minimum order reached"}
      </strong>
      <p>
        {remaining > 0
          ? `Minimum order value is ₹1,500. Add ₹${remaining.toLocaleString("en-IN")} more to continue.`
          : "Your cart meets the minimum order value of ₹1,500."}
      </p>
    </div>
  );
})()}


              <p className="muted cart-note">Each product is submitted as a separate order request. Final stock and price are checked by the backend.</p>

              <label htmlFor="cartCustomerName">Customer Name</label>

              <input id="cartCustomerName" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" autoComplete="name" />

              <label htmlFor="cartCustomerMobile">Mobile Number</label>

              <input id="cartCustomerMobile" type="tel" value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" maxLength={10} />

             
<button
  className={`primary-button ${
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.product.retailPrice || 0) *
          Number(item.quantity || 0),
      0
    ) < 1500
      ? "minimum-order-pending"
      : "minimum-order-ready"
  }`}
  disabled={
    cartSubmitting ||
    cart.length === 0 ||
    cart.reduce(
      (sum, item) =>
        sum +
        Number(item.product.retailPrice || 0) *
          Number(item.quantity || 0),
      0
    ) < 1500
  }
  onClick={submitCartOrder}
>
  {cartSubmitting ? "Submitting..." : "Submit all order requests"}
</button>


            </>}

          </section>

        </div>

      )}

      {selectedProduct && (

        <div className="modal-backdrop" onClick={() => setSelectedProduct(null)}>

          <section

            className="request-modal"

            onClick={(e) => e.stopPropagation()}

            role="dialog"

            aria-modal="true"

            aria-labelledby="request-title"

          >

            <button

              className="modal-close"

              onClick={() => setSelectedProduct(null)}

              aria-label="Close"

            >

              ×

            </button>

            <p className="eyebrow">REQUEST DETAILS</p>

            <h2 id="request-title">{selectedProduct.itemName}</h2>

            <p className="muted">

              Price: ₹{selectedProduct.retailPrice.toLocaleString("en-IN")}

            </p>

            <label htmlFor="quantity">Quantity</label>

            <input

              id="quantity"

              type="number"

              min="1"

              max={selectedProduct.stockQty > 0 ? selectedProduct.stockQty : 999}

              value={quantity}

              onChange={(e) => setQuantity(e.target.value)}

            />

            <label htmlFor="customerName">Customer Name</label>

<input

  id="customerName"

  type="text"

  value={customerName}

  onChange={(e) => setCustomerName(e.target.value)}

  placeholder="Enter your full name"

  autoComplete="name"

  required

/>

<label htmlFor="customerMobile">Mobile Number</label>

<input

  id="customerMobile"

  type="tel"

  value={customerMobile}

  onChange={(e) =>

    setCustomerMobile(e.target.value.replace(/\D/g, "").slice(0, 10))

  }

  placeholder="Enter 10-digit mobile number"

  inputMode="numeric"

  autoComplete="tel"

  maxLength={10}

  required

/>

            <button

              className="primary-button"

              disabled={loading || selectedProduct.stockQty <= 0}

              onClick={() => submitRequest(false)}

            >

              {loading ? "Submitting..." : "Submit order request"}

            </button>

            {selectedProduct.stockQty <= 0 && (

              <button

                className="outline-button full-width"

                disabled={loading}

                onClick={() => submitRequest(true)}

              >

                Request when back in stock

              </button>

            )}

          </section>

        </div>

      )}

    </main>

  );

}

function getDisplayImageUrl(url) {

  const value = String(url || "").trim();

  if (!value) return "";

  
  const match = value.match(
    /drive\.google\.com\/file\/d\/([^/?#]+)|[?&]id=([^&#]+)/
  );


  if (match) {

    const fileId = match[1] || match[2];

    return `https\://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w1000`;

  }

  return value;

}
export default App;
