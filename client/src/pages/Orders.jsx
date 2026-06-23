import React from 'react';
import { ClipboardList, Calendar, XCircle, Package, MapPin, Loader2 } from 'lucide-react';

export default function Orders({
  orders,
  loadingOrders,
  processingAction,
  handleCancelOrder,
  onStartShopping
}) {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">Order History</h2>
        <p className="text-gray-400 text-sm mt-1">Track transactional status, view past line items, and cancel pending requests.</p>
      </div>

      {loadingOrders ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-gray-400 text-sm">Fetching client transaction ledger...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel text-center p-16 space-y-4">
          <ClipboardList className="w-16 h-16 text-gray-600 mx-auto" />
          <h3 className="text-xl font-bold text-white font-display">No Orders Found</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            You have not placed any orders yet using this mock user account. Add some items to your cart and check out!
          </p>
          <button onClick={onStartShopping} className="btn btn-primary mt-2">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return (
              <div 
                key={order._id} 
                className="glass-panel border-white/5 overflow-hidden"
              >
                {/* Order Header info block */}
                <div className="bg-white/5 px-6 py-4 flex flex-wrap items-center justify-between gap-4 border-b border-white/5">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Order ID</p>
                      <p className="text-xs font-mono font-bold text-cyan-400">{order._id}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Date Placed</p>
                      <p className="text-xs text-white flex items-center gap-1 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-violet-400" />
                        {dateFormatted}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
                      <p className="text-sm font-bold text-white font-display">${order.totalAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Order Status Badges */}
                    {order.status === 'pending' && <span className="badge badge-warning">Pending Approval</span>}
                    {order.status === 'confirmed' && <span className="badge badge-primary">Confirmed</span>}
                    {order.status === 'shipped' && <span className="badge badge-info">Shipped</span>}
                    {order.status === 'delivered' && <span className="badge badge-success">Delivered ✔</span>}
                    {order.status === 'cancelled' && <span className="badge badge-danger">Cancelled</span>}

                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={processingAction}
                        className="btn btn-outline py-1 px-3 text-xs border-rose-500/20 text-rose-400 hover:bg-rose-950/30 hover:border-rose-500/60 font-semibold"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* Order items and shipping info */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Line Items</h4>
                    
                    <div className="space-y-3 divide-y divide-white/5">
                      {order.items?.map((item, idx) => (
                        <div key={item._id || idx} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/5 border border-white/10 rounded-lg text-violet-400">
                              <Package className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">{item.product?.name || 'Archived Product'}</p>
                              <p className="text-[10px] text-gray-500">Qty: {item.quantity} × ${item.priceAtOrder.toFixed(2)}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-white">${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address breakdown */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5 space-y-2 h-fit">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      Delivery Address
                    </h4>
                    <div className="text-xs text-gray-300 space-y-1 mt-2">
                      <p>{order.shippingAddress?.street}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                      <p className="font-mono mt-1 text-[10px] text-gray-500 font-semibold">ZIP: {order.shippingAddress?.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
