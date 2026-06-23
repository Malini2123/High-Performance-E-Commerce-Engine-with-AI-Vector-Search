import React from 'react';
import { MapPin, CheckCircle, Loader2 } from 'lucide-react';

export default function Checkout({
  cart,
  processingAction,
  handlePlaceOrder,
  address,
  setAddress,
  onBackToCart,
  onGoToProducts
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Secure Checkout</h2>
        <p className="text-gray-400 text-sm mt-1">Submit your delivery details to deploy and verify your order.</p>
      </div>

      {cart.items.length === 0 ? (
        <div className="glass-panel text-center p-16 space-y-4">
          <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto" />
          <h3 className="text-xl font-bold text-white font-display">Ready for Next Transaction</h3>
          <p className="text-gray-400 text-sm">You do not have any items in your checkout session. Return to products catalog.</p>
          <button onClick={onGoToProducts} className="btn btn-primary mt-2">
            Go to Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Form */}
          <form onSubmit={handlePlaceOrder} className="lg:col-span-2 glass-panel p-6 border-white/5 space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-cyan-400" />
              Shipping Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label">Street Address</label>
                <input 
                  type="text" 
                  required
                  value={address.street}
                  onChange={(e) => setAddress({...address, street: e.target.value})}
                  className="input-field" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">City</label>
                  <input 
                    type="text" 
                    required
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input 
                    type="text" 
                    required
                    value={address.state}
                    onChange={(e) => setAddress({...address, state: e.target.value})}
                    className="input-field" 
                  />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input 
                    type="text" 
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({...address, pincode: e.target.value})}
                    className="input-field" 
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-white/5 pt-6 space-y-4">
              <h4 className="text-sm font-semibold text-white">Payment Method Simulator</h4>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full border-4 border-cyan-400" />
                  <div>
                    <p className="text-sm font-bold text-white">Direct Engine Checkout (Sandbox)</p>
                    <p className="text-[10px] text-gray-400">Order executes immediately, updating inventories automatically.</p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30 font-bold uppercase">
                  Mock Mode
                </span>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                type="button"
                onClick={onBackToCart}
                className="btn btn-outline flex-1 py-3"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                disabled={processingAction}
                className="btn btn-primary flex-1 py-3"
              >
                {processingAction ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing Transaction...
                  </>
                ) : (
                  <>
                    Place Order (${cart.total?.toFixed(2)})
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Checkout Order Review Panel */}
          <div className="glass-panel p-6 border-white/5 h-fit space-y-6">
            <h3 className="text-lg font-bold text-white border-b border-white/5 pb-3 font-display">Review Order</h3>
            
            <div className="space-y-3 divide-y divide-white/5 max-h-72 overflow-y-auto pr-1">
              {cart.items.map(item => (
                <div key={item._id} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-white line-clamp-1">{item.product?.name}</p>
                    <p className="text-[10px] text-gray-400">Qty: {item.quantity} × ${item.priceAtAdd.toFixed(2)}</p>
                  </div>
                  <span className="text-sm font-semibold text-white">${(item.priceAtAdd * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-white/5 pt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-400">
                <span>Subtotal</span>
                <span>${cart.total?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>Shipping</span>
                <span className="text-emerald-400">Free</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2">
                <span>Total Amount</span>
                <span className="text-cyan-400">${cart.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
