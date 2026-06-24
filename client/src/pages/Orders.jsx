import React from 'react';
import { ClipboardList, Calendar, XCircle, Package, MapPin, Loader2, ShoppingBag } from 'lucide-react';

export default function Orders({
  orders,
  loadingOrders,
  processingAction,
  handleCancelOrder,
  onStartShopping
}) {
  const formatPrice = (price) => `₹${Math.round(price * 83).toLocaleString('en-IN')}`;

  const statusConfig = {
    pending:   { label: 'Pending',   className: 'badge badge-warning'  },
    confirmed: { label: 'Confirmed', className: 'badge badge-primary'  },
    shipped:   { label: 'Shipped',   className: 'badge badge-info'     },
    delivered: { label: 'Delivered ✔', className: 'badge badge-success' },
    cancelled: { label: 'Cancelled', className: 'badge badge-danger'   },
  };

  return (
    <div className="animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">Track your orders, view line items, and cancel pending requests</p>
      </div>

      {loadingOrders ? (
        <div className="loading-wrap">
          <Loader2 size={36} color="var(--brand-teal)" style={{ animation: 'spinSlow 1s linear infinite' }} />
          <span>Fetching your orders…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state-icon">
            <ClipboardList size={32} />
          </div>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any orders. Add items to your cart and check out!</p>
          <button onClick={onStartShopping} className="btn btn-primary mt-2">
            <ShoppingBag size={15} />
            Start Shopping
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {orders.map(order => {
            const dateFormatted = new Date(order.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            const status = statusConfig[order.status] || { label: order.status, className: 'badge badge-dark' };

            return (
              <div key={order._id} className="panel" style={{ overflow: 'hidden' }}>

                {/* ── Order Header ── */}
                <div style={{
                  background: 'var(--bg-grey-light)',
                  borderBottom: '1px solid var(--border-light)',
                  padding: '14px 22px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 14,
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 28px', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Order ID</p>
                      <p style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-teal)', marginTop: 2 }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Date Placed</p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Calendar size={12} color="var(--text-muted)" />
                        {dateFormatted}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Total</p>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', marginTop: 2 }}>
                        {formatPrice(order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className={status.className}>{status.label}</span>
                    {order.status === 'pending' && (
                      <button
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={processingAction}
                        className="btn btn-danger btn-sm"
                      >
                        <XCircle size={13} />
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Order Body: Items + Address ── */}
                <div style={{ padding: '20px 22px', display: 'grid', gridTemplateColumns: '1fr 220px', gap: 20 }} className="order-body-grid">

                  {/* Line Items */}
                  <div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>
                      Order Items
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {order.items?.map((item, idx) => (
                        <div key={item._id || idx} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                          padding: '10px 0',
                          borderBottom: idx < order.items.length - 1 ? '1px solid var(--border-light)' : 'none',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, background: 'var(--bg-placeholder)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Package size={16} color="rgba(0,0,0,0.18)" />
                            </div>
                            <div>
                              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                {item.product?.name || 'Archived Product'}
                              </p>
                              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                Qty: {item.quantity} × {formatPrice(item.priceAtOrder)}
                              </p>
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                            {formatPrice(item.priceAtOrder * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div style={{
                    background: 'var(--bg-grey-light)',
                    borderRadius: 10,
                    border: '1px solid var(--border-light)',
                    padding: '14px 16px',
                    height: 'fit-content',
                  }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={12} color="var(--brand-teal)" />
                      Delivery Address
                    </p>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      <p>{order.shippingAddress?.street}</p>
                      <p>{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                      <p style={{ marginTop: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        PIN: {order.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .order-body-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
