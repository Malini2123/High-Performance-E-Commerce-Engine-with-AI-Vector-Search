import React, { useState } from 'react';
import { apiFetch } from '../utils/api';

/**
 * CouponInput — lets the user apply a coupon code during checkout.
 *
 * Props:
 *  orderTotal    {number}   — current cart total (before discount)
 *  onApply       {fn}       — called with { code, discountAmount, finalTotal }
 *  onRemove      {fn}       — called when the user removes a coupon
 *  appliedCoupon {object|null} — currently applied coupon (or null)
 */
export default function CouponInput({ orderTotal, onApply, onRemove, appliedCoupon }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError('Please enter a coupon code.'); return; }
    setError('');
    setLoading(true);
    try {
      const res  = await apiFetch('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: trimmed, orderTotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        setError(data.error || 'Invalid coupon code.');
      } else {
        onApply({ code: data.code, discountAmount: data.discountAmount, finalTotal: data.finalTotal, description: data.description });
        setCode('');
      }
    } catch {
      setError('Could not validate coupon. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleApply();
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-widget">
        <label>🎟️ Coupon Code</label>
        <div className="coupon-success">
          <span>✅</span>
          <span>
            <strong>{appliedCoupon.code}</strong>
            {appliedCoupon.description && <span style={{ fontWeight: 400, opacity: 0.8 }}> — {appliedCoupon.description}</span>}
          </span>
          <span style={{ marginLeft: 'auto', color: 'inherit' }}>
            −₹{appliedCoupon.discountAmount.toFixed(2)}
          </span>
          <button className="coupon-remove" onClick={onRemove} title="Remove coupon">✕ Remove</button>
        </div>
      </div>
    );
  }

  return (
    <div className="coupon-widget">
      <label>🎟️ Have a Coupon Code?</label>
      <div className="coupon-input-row">
        <input
          id="coupon-code-input"
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError(''); }}
          onKeyDown={handleKeyDown}
          placeholder="e.g. SAVE10"
          maxLength={30}
          disabled={loading}
        />
        <button
          className="coupon-apply-btn"
          onClick={handleApply}
          disabled={loading || !code.trim()}
          id="coupon-apply-btn"
        >
          {loading ? '…' : 'Apply'}
        </button>
      </div>
      {error && (
        <p className="coupon-error">
          <span>⚠️</span> {error}
        </p>
      )}
    </div>
  );
}
