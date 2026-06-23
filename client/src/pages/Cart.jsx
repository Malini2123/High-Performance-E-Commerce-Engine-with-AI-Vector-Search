import React from 'react';
import { ShoppingBag as CartIcon, ArrowRight, Package, Trash2, Minus, Plus, CheckCircle, Loader2 } from 'lucide-react';

export default function Cart({
  cart,
  loadingCart,
  processingAction,
  cartItemCount,
  handleUpdateCartQuantity,
  handleRemoveFromCart,
  onProceedToCheckout,
  onContinueShopping
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Your Virtual Cart</h2>
        <p className="text-gray-400 text-sm mt-1">Review items, adjust quantities, and lock in current unit prices.</p>
      </div>

      {loadingCart ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">Syncing shopping basket...</p>
        </div>
      ) : !cart.items || cart.items.length === 0 ? (
        <div className="glass-panel text-center p-16 space-y-4">
          <CartIcon className="w-16 h-16 text-gray-600 mx-auto animate-bounce" />
          <h3 className="text-xl font-bold text-white font-display">Your Cart is Empty</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Browse our technology listing and click "Add to Cart" to start building your configuration.
          </p>
          <button onClick={onContinueShopping} className="btn btn-primary mt-2">
            <ArrowRight className="w-4 h-4 rotate-180" />
            Continue Shopping
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map(item => {
              const product = item.product || {};
              const priceDiff = product.price !== undefined && product.price !== item.priceAtAdd;
              return (
                <div 
                  key={item._id} 
                  className="glass-panel p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-white/5"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-violet-400">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white line-clamp-1">{product.name || 'Unknown Product'}</h3>
                      <p className="text-xs text-gray-400 capitalize mt-0.5">{product.category || 'N/A'}</p>
                      
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                          Unit: ${item.priceAtAdd.toFixed(2)}
                        </span>
                        {priceDiff && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-950/80 border border-amber-500/30 text-amber-300 rounded font-semibold" title={`Catalog price is currently $${product.price}`}>
                            Price locked (Saved)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-white/5">
                    <div className="flex items-center bg-white/5 border border-white/10 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateCartQuantity(product._id, item.quantity - 1)}
                        disabled={processingAction}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3.5 text-sm font-black text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQuantity(product._id, item.quantity + 1)}
                        disabled={processingAction}
                        className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-gray-500 font-semibold uppercase">Total</p>
                      <p className="text-base font-black text-white">${(item.priceAtAdd * item.quantity).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(product._id)}
                      disabled={processingAction}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-500/10 hover:border-rose-500/40 text-rose-400 hover:bg-rose-950/50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="space-y-6">
            <div className="glass-panel p-6 border-white/5 space-y-6">
              <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-display">Order Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal ({cartItemCount} items)</span>
                  <span className="font-semibold text-white">${cart.total?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-emerald-400 font-semibold">Free Delivery</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Sales Tax (GST)</span>
                  <span className="font-semibold text-white">$0.00</span>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex justify-between items-end">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                  <p className="text-2xl font-black text-cyan-400 font-display">${cart.total?.toFixed(2)}</p>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase">
                  Active Promo
                </span>
              </div>

              <button
                onClick={onProceedToCheckout}
                className="btn btn-primary w-full py-3"
              >
                Secure Checkout
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </button>
            </div>

            <div className="glass-panel p-4 border-white/5 bg-gradient-to-br from-cyan-950/20 to-violet-950/10 flex gap-3 text-xs text-gray-400">
              <CheckCircle className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Stock Allocation Locked</p>
                <p className="mt-0.5">Proceed to check out soon. Stock quantity is reserved on a first-come, first-served basis during checkout.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
