import React, { useState } from 'react';
import { Search, Database, Package, Loader2, Heart, ShoppingBag } from 'lucide-react';

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
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Explore Tech Collection</h2>
          <p className="text-gray-400 text-sm mt-1">High-performance items powered by vector-based semantic recommendations.</p>
        </div>

        {/* Search & Seeding Helpers */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search product details..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 py-2.5 text-sm"
            />
          </div>
          
          <button 
            onClick={handleSeedDatabase}
            disabled={processingAction}
            className="btn btn-outline py-2.5 px-4 text-xs font-semibold"
            title="Adds 10 premium sample products to MongoDB"
          >
            <Database className="w-4 h-4 text-cyan-400" />
            Seed Products
          </button>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-white/5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn py-1.5 px-4 text-xs rounded-full border ${
              selectedCategory === cat 
                ? 'btn-primary border-violet-500/30' 
                : 'btn-outline border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading Indicator */}
      {loadingProducts ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">Querying database models...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel text-center p-16 space-y-4">
          <Package className="w-16 h-16 text-gray-600 mx-auto" />
          <h3 className="text-xl font-bold text-white font-display">No Products in Database</h3>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Click the "Seed Products" button in the top right to populate MongoDB with a curated high-performance catalog.
          </p>
          <button onClick={handleSeedDatabase} className="btn btn-primary mt-2">
            <Database className="w-4 h-4" />
            Seed 10 Sample Products
          </button>
        </div>
      ) : (
        <div className="grid-products">
          {filteredProducts.map(product => {
            const isInWishlist = wishlist.products?.some(p => p._id === product._id);
            const isInCart = cart.items?.some(i => i.product?._id === product._id);
            return (
              <div 
                key={product._id} 
                className="glass-panel p-5 flex flex-col justify-between hover:scale-[1.02] active:scale-[0.99] border-white/5 group relative overflow-hidden"
              >
                {/* Glow design effects */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl group-hover:bg-violet-600/20 transition-all duration-300 pointer-events-none" />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest px-2.5 py-1 rounded-md bg-cyan-950/40 border border-cyan-800/30">
                      {product.category}
                    </span>
                    
                    <button
                      onClick={() => handleToggleWishlist(product._id)}
                      disabled={processingAction}
                      className={`p-2 rounded-full border transition-all ${
                        isInWishlist 
                          ? 'bg-rose-950/50 border-rose-500/30 text-rose-500' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <Heart className="w-4.5 h-4.5 fill-current" />
                    </button>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 h-8 leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Unit Price</p>
                    <p className="text-xl font-black text-white font-display">${product.price.toFixed(2)}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Stock status</p>
                    {product.stock > 0 ? (
                      <span className={`text-xs font-bold ${product.stock < 15 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {product.stock} units
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-500">Out of Stock</span>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => handleAddToCart(product._id, 1)}
                    disabled={product.stock === 0 || processingAction}
                    className={`btn w-full text-xs font-bold ${
                      product.stock === 0
                        ? 'btn-outline border-white/5 text-gray-500 cursor-not-allowed'
                        : isInCart
                        ? 'btn-secondary text-[#080711]'
                        : 'btn-primary'
                    }`}
                  >
                    <ShoppingBag className="w-4 h-4" />
                    {product.stock === 0 ? 'Out of stock' : isInCart ? 'Add More to Cart' : 'Add to Cart'}
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
