import React, { useState } from 'react';
import { Search, Database, Package, Loader2, Heart, ShoppingCart, Tag } from 'lucide-react';

export default function Products({
  products,
  loadingProducts,
  wishlist,
  cart,
  processingAction,
  handleSeedDatabase,
  handleAddToCart,
  handleToggleWishlist
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format price in Indian Rupees (₹) — multiply USD by 83 for mock conversion
  const formatPrice = (price) => {
    const inr = Math.round(price * 83);
    return `₹${inr.toLocaleString('en-IN')}`;
  };

  return (
    <div className="animate-fade-in">

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          {loadingProducts ? 'Loading...' : `${filteredProducts.length} products loaded`}
        </p>
      </div>

      {/* ── Toolbar: Search + Seed ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-wrapper" style={{ width: 280 }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
          />
        </div>

        <button
          onClick={handleSeedDatabase}
          disabled={processingAction}
          className="btn btn-outline btn-sm"
          title="Seed MongoDB with sample products"
        >
          <Database size={14} />
          Seed Products
        </button>
      </div>

      {/* ── Category Filter Pills ── */}
      <div className="filter-pills">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`filter-pill${selectedCategory === cat ? ' active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── States: Loading / Empty / Grid ── */}
      {loadingProducts ? (
        <div className="loading-wrap">
          <Loader2 size={36} style={{ animation: 'spinSlow 1s linear infinite' }} color="var(--brand-teal)" />
          <span>Loading products…</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3>No Products Found</h3>
          <p>Click "Seed Products" above to populate the database with a curated catalog.</p>
          <button onClick={handleSeedDatabase} className="btn btn-primary mt-2">
            <Database size={15} />
            Seed Sample Products
          </button>
        </div>
      ) : (
        <div className="grid-products">
          {filteredProducts.map(product => {
            const isInWishlist = wishlist.products?.some(p => p._id === product._id);
            const isInCart = cart.items?.some(i => i.product?._id === product._id);
            const inStock = product.stock > 0;
            const lowStock = product.stock > 0 && product.stock < 15;

            return (
              <div key={product._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Image Placeholder */}
                <div className="card-img-placeholder">
                  <span className="card-category-tag">{product.category}</span>

                  {/* Wishlist Button */}
                  <button
                    onClick={() => handleToggleWishlist(product._id)}
                    disabled={processingAction}
                    className="btn btn-icon"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: isInWishlist ? '#fff1f2' : 'rgba(255,255,255,0.9)',
                      border: isInWishlist ? '1.5px solid #fecdd3' : '1.5px solid #e5e7eb',
                      color: isInWishlist ? '#f43f5e' : '#9ca3af',
                      zIndex: 1,
                    }}
                    aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart size={15} fill={isInWishlist ? '#f43f5e' : 'none'} />
                  </button>

                  {/* Placeholder icon */}
                  <Package size={40} color="rgba(0,0,0,0.12)" style={{ marginTop: 10 }} />
                </div>

                {/* Card Body */}
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-desc">{product.description}</p>

                  {/* Price + Stock */}
                  <div className="card-price-row">
                    <span className="card-price">{formatPrice(product.price)}</span>
                    <span className={`card-stock ${!inStock ? 'card-stock-out' : lowStock ? 'card-stock-low' : 'card-stock-ok'}`}>
                      {!inStock ? 'Out of stock' : `${product.stock} in stock`}
                    </span>
                  </div>

                  {/* Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(product._id, 1)}
                    disabled={!inStock || processingAction}
                    className={`btn btn-full${isInCart ? ' btn-secondary' : ' btn-primary'}`}
                    style={{ marginTop: 'auto' }}
                  >
                    <ShoppingCart size={15} />
                    {!inStock ? 'Out of Stock' : isInCart ? 'Add More to Cart' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
