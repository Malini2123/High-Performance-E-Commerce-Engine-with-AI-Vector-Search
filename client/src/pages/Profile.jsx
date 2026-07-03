import React, { useState, useEffect } from 'react';
import { apiFetch, saveSession } from '../utils/api';

/**
 * Profile page — shows user info, order stats, and lets the user
 * update their display name or change their password.
 *
 * Props:
 *  currentUser   {object}   — JWT-decoded user from App state
 *  orders        {array}    — user's orders array from App state
 *  onUserUpdated {fn}       — called with updated user object after save
 *  showToast     {fn}       — toast notification helper from App
 */
export default function Profile({ currentUser, orders, onUserUpdated, showToast }) {
  // ── Edit name form ─────────────────────────────────────────────────────────
  const [name, setName] = useState(currentUser?.name || '');
  const [savingName, setSavingName] = useState(false);

  // ── Change password form ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPw, setSavingPw]               = useState(false);

  // Keep name in sync if parent user changes
  useEffect(() => { setName(currentUser?.name || ''); }, [currentUser]);

  // ── Derived order stats ────────────────────────────────────────────────────
  const totalOrders    = orders.length;
  const pendingOrders  = orders.filter(o => o.status === 'pending').length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
  const totalSpent     = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.totalAmount || o.finalTotal || 0), 0);

  const initials = (currentUser?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // ── Save name ──────────────────────────────────────────────────────────────
  const handleSaveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return; }
    if (name.trim() === currentUser?.name) { showToast('No changes to save.', 'info'); return; }
    setSavingName(true);
    try {
      const res  = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        saveSession(data.token, data.user);
        onUserUpdated(data.user);
        showToast('Display name updated! 🎉');
      } else {
        showToast(data.error || 'Failed to update name.', 'error');
      }
    } catch {
      showToast('Connection error.', 'error');
    } finally {
      setSavingName(false);
    }
  };

  // ── Change password ────────────────────────────────────────────────────────
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) { showToast('All password fields are required.', 'error'); return; }
    if (newPassword.length < 6) { showToast('New password must be at least 6 characters.', 'error'); return; }
    if (newPassword !== confirmPassword) { showToast('Passwords do not match.', 'error'); return; }
    setSavingPw(true);
    try {
      const res  = await apiFetch('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        saveSession(data.token, data.user);
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
        showToast('Password changed successfully! 🔒');
      } else {
        showToast(data.error || 'Failed to change password.', 'error');
      }
    } catch {
      showToast('Connection error.', 'error');
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="profile-page">
      {/* ── Hero banner ───────────────────────────────────────────────────── */}
      <div className="profile-hero">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-hero-info">
          <h2>{currentUser?.name || 'User'}</h2>
          <p>{currentUser?.email}</p>
          <div className="profile-badge">
            {currentUser?.role === 'admin' ? '👑 Admin' : '👤 Member'}
          </div>
        </div>
      </div>

      {/* ── Stats grid ────────────────────────────────────────────────────── */}
      <div className="profile-stats-grid">
        <div className="profile-stat-card">
          <span className="profile-stat-icon">📦</span>
          <span className="profile-stat-value">{totalOrders}</span>
          <span className="profile-stat-label">Total Orders</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">⏳</span>
          <span className="profile-stat-value">{pendingOrders}</span>
          <span className="profile-stat-label">Pending</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">✅</span>
          <span className="profile-stat-value">{deliveredOrders}</span>
          <span className="profile-stat-label">Delivered</span>
        </div>
        <div className="profile-stat-card">
          <span className="profile-stat-icon">💸</span>
          <span className="profile-stat-value">₹{totalSpent.toFixed(0)}</span>
          <span className="profile-stat-label">Total Spent</span>
        </div>
      </div>

      {/* ── Edit display name ─────────────────────────────────────────────── */}
      <div className="profile-section">
        <h3>✏️ Edit Profile</h3>
        <form className="profile-form" onSubmit={handleSaveName}>
          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="profile-name">Display Name</label>
              <input
                id="profile-name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                maxLength={60}
                disabled={savingName}
              />
            </div>
            <div className="profile-input-group">
              <label htmlFor="profile-email">Email</label>
              <input
                id="profile-email"
                type="email"
                value={currentUser?.email || ''}
                disabled
                title="Email cannot be changed"
              />
            </div>
          </div>
          <div className="profile-input-group">
            <label htmlFor="profile-role">Role</label>
            <input
              id="profile-role"
              type="text"
              value={currentUser?.role === 'admin' ? '👑 Administrator' : '👤 Customer'}
              disabled
            />
          </div>
          <button
            id="profile-save-name-btn"
            type="submit"
            className="profile-save-btn"
            disabled={savingName}
          >
            {savingName ? '⏳ Saving…' : '💾 Save Changes'}
          </button>
        </form>
      </div>

      {/* ── Change password ────────────────────────────────────────────────── */}
      <div className="profile-section">
        <h3>🔒 Change Password</h3>
        <form className="profile-form" onSubmit={handleChangePassword}>
          <div className="profile-input-group">
            <label htmlFor="profile-current-pw">Current Password</label>
            <input
              id="profile-current-pw"
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Enter your current password"
              disabled={savingPw}
            />
          </div>
          <div className="profile-form-row">
            <div className="profile-input-group">
              <label htmlFor="profile-new-pw">New Password</label>
              <input
                id="profile-new-pw"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Min. 6 characters"
                disabled={savingPw}
              />
            </div>
            <div className="profile-input-group">
              <label htmlFor="profile-confirm-pw">Confirm Password</label>
              <input
                id="profile-confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                disabled={savingPw}
              />
            </div>
          </div>
          <button
            id="profile-change-pw-btn"
            type="submit"
            className="profile-save-btn"
            disabled={savingPw}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}
          >
            {savingPw ? '⏳ Updating…' : '🔑 Update Password'}
          </button>
        </form>
      </div>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <div className="profile-section" style={{ borderColor: 'rgba(244,63,94,0.25)' }}>
        <h3 style={{ color: 'var(--brand-rose)' }}>⚠️ Account Info</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Member since{' '}
          <strong style={{ color: 'var(--text-secondary)' }}>
            {currentUser?.createdAt
              ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })
              : 'N/A'}
          </strong>
          . Your data is secured with bcrypt-hashed passwords and JWT authentication.
        </p>
      </div>
    </div>
  );
}
