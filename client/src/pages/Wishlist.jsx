import React from 'react';
import { Heart, Trash2, ShoppingBag, Loader2 } from 'lucide-react';

export default function Wishlist({
  wishlist,
  loadingWishlist,
  processingAction,
  handleToggleWishlist,
  handleMoveToCart,
  onBrowseProducts
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Saved Wishlist</h2>
        <p className="text-gray-400 text-sm mt-1">Keep track of items you like. Transfer them directly to your active shopping cart.</p>
      </div>

      {loadingWishlist ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">Querying wishlist model...</p>
        </div>
      ) : !wishlist.products || wishlist.products.length === 0 ? (
        <div className="glass-panel text-center p-16 space-y-4">
          <Heart className="w-16 h-16 text-gray-600 mx-auto" />
          <h3 className="text-xl font-bold text-white font-display">Your Wishlist is Empty</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Click the heart icon on product cards while browsing the store to save items here for later.
          </p>
          <button onClick={onBrowseProducts} className="btn btn-primary mt-2">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid-products">
          {wishlist.products.map(product => (
            <div 
              key={product._id} 
              className="glass-panel p-5 flex flex-col justify-between border-white/5 hover:scale-[1.02] transition-transform"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/30">
                    {product.category}
                  </span>
                  
                  <button
                    onClick={() => handleToggleWishlist(product._id)}
                    disabled={processingAction}
                    className="p-2 rounded-full bg-rose-950/30 border border-rose-500/20 text-rose-400 hover:bg-rose-950/60 hover:border-rose-500/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white">{product.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 h-8 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Price</p>
                  <p className="text-lg font-black text-white">${product.price?.toFixed(2)}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stock status</p>
                  {product.stock > 0 ? (
                    <span className="text-xs font-semibold text-emerald-400">Available</span>
                  ) : (
                    <span className="text-xs font-semibold text-rose-500">Out of Stock</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleMoveToCart(product._id)}
                  disabled={product.stock === 0 || processingAction}
                  className="btn btn-primary flex-1 text-xs font-bold"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Move to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
