import React from 'react';
import { Heart, Trash2, ShoppingCart, Loader2, Package } from 'lucide-react';

export default function Wishlist({
  wishlist,
  loadingWishlist,
  processingAction,
  handleToggleWishlist,
  handleMoveToCart,
  onBrowseProducts
}) {
  const formatPrice = (price) => `₹${Math.round(price * 83).toLocaleString('en-IN')}`;

  return (
    <div className="animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Wishlist</h1>
        <p className="page-subtitle">
          {loadingWishlist ? 'Loading…' : `${wishlist.products?.length || 0} saved items`}
        </p>
      </div>

      {loadingWishlist ? (
        <div className="loading-wrap">
          <Loader2 size={36} color="var(--brand-teal)" style={{ animation: 'spinSlow 1s linear infinite' }} />
          <span>Loading wishlist…</span>
        </div>
      ) : !wishlist.products || wishlist.products.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state-icon">
            <Heart size={32} />
          </div>
          <h3>Your Wishlist is Empty</h3>
          <p>Tap the ❤️ icon on any product card to save it here for later.</p>
          <button onClick={onBrowseProducts} className="btn btn-primary mt-2">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid-products">
          {wishlist.products.map(product => {
            const inStock = product.stock > 0;
            const lowStock = product.stock > 0 && product.stock < 15;

            return (
              <div key={product._id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Image Placeholder */}
                <div className="card-img-placeholder">
                  <span className="card-category-tag">{product.category}</span>

                  {/* Remove from Wishlist */}
                  <button
                    onClick={() => handleToggleWishlist(product._id)}
                    disabled={processingAction}
                    className="btn btn-icon"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      background: 'rgba(255,255,255,0.9)',
                      border: '1.5px solid #fecdd3',
                      color: '#f43f5e',
                      zIndex: 1,
                    }}
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={15} />
                  </button>

                  <Package size={40} color="rgba(0,0,0,0.12)" style={{ marginTop: 10 }} />
                </div>

                {/* Card Body */}
                <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 className="card-title">{product.name}</h3>
                  <p className="card-desc">{product.description}</p>

                  <div className="card-price-row">
                    <span className="card-price">{formatPrice(product.price)}</span>
                    <span className={`card-stock ${!inStock ? 'card-stock-out' : lowStock ? 'card-stock-low' : 'card-stock-ok'}`}>
                      {!inStock ? 'Out of stock' : 'Available'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleMoveToCart(product._id)}
                    disabled={!inStock || processingAction}
                    className="btn btn-primary btn-full"
                    style={{ marginTop: 'auto' }}
                  >
                    <ShoppingCart size={15} />
                    Move to Cart
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
