import React, { useState } from 'react';
import { MapPin, CheckCircle, Loader2, ArrowLeft, CreditCard, Package } from 'lucide-react';
import CouponInput from '../components/CouponInput';

export default function Checkout({
  cart,
  processingAction,
  handlePlaceOrder,
  address,
  setAddress,
  onBackToCart,
  onGoToProducts
}) {
  const formatPrice = (price) => `₹${Math.round(price * 83).toLocaleString('en-IN')}`;

  // ── Coupon state (local to Checkout) ──────────────────────────────────────
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const finalTotal = cart.total - discountAmount;

  return (
    <div className="animate-fade-in">

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
        <p className="page-subtitle">Fill in your delivery details to complete the order</p>
      </div>

      {cart.items.length === 0 ? (
        <div className="panel empty-state">
          <div className="empty-state-icon">
            <CheckCircle size={32} color="var(--brand-green)" />
          </div>
          <h3>Cart is Empty</h3>
          <p>You don't have any items to check out. Head back to browse products.</p>
          <button onClick={onGoToProducts} className="btn btn-primary mt-2">
            Go to Products
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}
             className="checkout-grid">

          {/* ── Delivery Form ── */}
          <form onSubmit={handlePlaceOrder} className="panel" style={{ padding: 28 }}>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: 22, display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={18} color="var(--brand-teal)" />
              Shipping Details
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="label">Street Address</label>
                <input
                  type="text"
                  required
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="input-field"
                  placeholder="e.g. 123 Tech Park Avenue"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">City</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="input-field"
                    placeholder="Bangalore"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <input
                    type="text"
                    required
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="input-field"
                    placeholder="Karnataka"
                  />
                </div>
                <div>
                  <label className="label">Pincode</label>
                  <input
                    type="text"
                    required
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="input-field"
                    placeholder="560001"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <CreditCard size={16} color="var(--text-muted)" />
                Payment Method
              </h3>
              <div style={{
                padding: '14px 18px',
                border: '1.5px solid var(--brand-teal)',
                borderRadius: 10,
                background: '#f0f9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', border: '4px solid var(--brand-teal)', background: '#fff' }} />
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Direct Engine Checkout</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      Sandbox mode — order executes instantly and updates inventory
                    </p>
                  </div>
                </div>
                <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>Mock Mode</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <button type="button" onClick={onBackToCart} className="btn btn-outline" style={{ flex: 1 }}>
                <ArrowLeft size={15} />
                Back to Cart
              </button>
              <button type="submit" disabled={processingAction} className="btn btn-primary" style={{ flex: 2, padding: '13px 20px' }}>
                {processingAction ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spinSlow 1s linear infinite' }} />
                    Placing Order…
                  </>
                ) : (
                  <>
                    Place Order ({formatPrice(cart.total)})
                    <CheckCircle size={16} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* ── Order Review Panel ── */}
          <div className="panel" style={{ padding: 24 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid var(--border-light)' }}>
              Order Review
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 280, overflowY: 'auto', paddingRight: 4 }}>
              {cart.items.map((item, i) => (
                <div key={item._id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                  padding: '12px 0',
                  borderBottom: i < cart.items.length - 1 ? '1px solid var(--border-light)' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, background: 'var(--bg-placeholder)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Package size={16} color="rgba(0,0,0,0.18)" />
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {item.product?.name}
                      </p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        Qty: {item.quantity} × {formatPrice(item.priceAtAdd)}
                      </p>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                    {formatPrice(item.priceAtAdd * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Coupon Widget */}
            <div style={{ margin: '16px 0' }}>
              <CouponInput
                orderTotal={cart.total}
                appliedCoupon={appliedCoupon}
                onApply={setAppliedCoupon}
                onRemove={() => setAppliedCoupon(null)}
              />
            </div>

            <hr className="divider" style={{ margin: '4px 0 14px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span><span>{formatPrice(cart.total)}</span>
              </div>
              {appliedCoupon && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--brand-green)', fontWeight: 600 }}>
                  <span>🎟️ Coupon ({appliedCoupon.code})</span>
                  <span>−{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Shipping</span>
                <span style={{ color: 'var(--brand-green)', fontWeight: 600 }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                <span>Total</span>
                <span style={{ fontFamily: 'var(--font-display)' }}>{formatPrice(finalTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          .checkout-grid form > div:nth-child(2) > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
