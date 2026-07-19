import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '../api/client';

function Profile() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name || '', address: user?.address || '', profilePic: user?.profilePic || '' });
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      let res;
      // If there's a file, we MUST use FormData
      if (profilePicFile) {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('address', form.address);
        formData.append('profilePicFile', profilePicFile);
        
        res = await apiClient.put('/auth/profile', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        // Otherwise use standard JSON
        res = await apiClient.put('/auth/profile', form);
      }
      
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setSuccess(true);
      setIsEditing(false);
      window.location.reload(); 
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
    setLoading(false);
  };

  return (
    <AnimatedPage>
      <div style={styles.container}>
        {/* Decorative Header Background */}
        <div style={styles.coverPhoto}>
          <div style={styles.coverOverlay} />
        </div>

        <div style={styles.contentWrapper}>
          <div style={styles.mainCard}>
            
            {/* Avatar Section - overlaps cover photo */}
            <div style={styles.avatarContainer}>
              <motion.div 
                style={styles.avatarLarge}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              >
                {user.profilePic ? (
                  <img src={user.profilePic.startsWith('http') ? user.profilePic : `http://localhost:5000${user.profilePic}`} alt={user.name} style={styles.avatarImage} />
                ) : (
                  user.name ? user.name[0].toUpperCase() : 'U'
                )}
              </motion.div>
              <div style={styles.roleBadgeContainer}>
                <span style={styles.roleBadgeGlow}>{user.role}</span>
              </div>
            </div>

            <div style={styles.cardBody}>
              <AnimatePresence mode="wait">
                {!isEditing ? (
                  <motion.div
                    key="view"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    style={styles.viewMode}
                  >
                    <h1 style={styles.userName}>{user.name}</h1>
                    <p style={styles.userEmail}>{user.email}</p>
                    
                    <div style={styles.infoSection}>
                      <h3 style={styles.sectionTitle}>Shipping Address</h3>
                      {user.address ? (
                        <div style={styles.addressBox}>
                          <span style={styles.addressIcon}>📍</span>
                          <p style={styles.addressText}>{user.address}</p>
                        </div>
                      ) : (
                        <div style={styles.emptyAddress}>
                          <p>No address provided yet. Add one for faster checkout!</p>
                        </div>
                      )}
                    </div>

                    <motion.button 
                      onClick={() => setIsEditing(true)} 
                      style={styles.editBtn}
                      whileHover={{ scale: 1.02, backgroundColor: 'var(--primary)', color: '#fff' }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Edit Profile
                    </motion.button>
                    {success && <div style={styles.successMessage}>✓ Profile updated successfully!</div>}
                  </motion.div>
                ) : (
                  <motion.div
                    key="edit"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 style={styles.editTitle}>Edit Your Details</h2>
                    <form onSubmit={handleUpdate} style={styles.form}>
                      {error && <div style={styles.error}>{error}</div>}
                      
                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Full Name</label>
                        <input
                          style={styles.input}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          required
                          placeholder="Your Name"
                        />
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Profile Picture (Upload)</label>
                        <input
                          style={styles.input}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setProfilePicFile(e.target.files[0]);
                            }
                          }}
                        />
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Or keep it blank to retain your current avatar.
                        </div>
                      </div>

                      <div style={styles.inputGroup}>
                        <label style={styles.label}>Shipping Address</label>
                        <textarea
                          style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                          value={form.address}
                          onChange={(e) => setForm({ ...form, address: e.target.value })}
                          placeholder="Enter your full delivery address..."
                        />
                      </div>

                      <div style={styles.actionButtons}>
                        <motion.button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setForm({ name: user.name, address: user.address || '', profilePic: user.profilePic || '' });
                            setProfilePicFile(null);
                          }}
                          style={styles.cancelBtn}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="submit"
                          style={styles.saveBtn}
                          disabled={loading}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </motion.button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}

const styles = {
  container: {
    minHeight: '80vh',
    backgroundColor: '#f1f5f9', // Updated to match site background usually
    position: 'relative',
    paddingBottom: '60px',
  },
  coverPhoto: {
    width: '100%',
    height: '240px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    overflow: 'hidden',
  },
  coverOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.15) 100%)',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\\"60\\" height=\\"60\\" viewBox=\\"0 0 60 60\\" xmlns=\\"http://www.w3.org/2000/svg\\"%3E%3Cg fill=\\"none\\" fill-rule=\\"evenodd\\"%3E%3Cg fill=\\"%23ffffff\\" fill-opacity=\\"0.05\\"%3E%3Cpath d=\\"M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '700px',
    margin: '0 auto',
    paddingTop: '160px', 
    paddingLeft: '20px',
    paddingRight: '20px',
  },
  mainCard: {
    backgroundColor: 'var(--card-bg)',
    borderRadius: '24px',
    boxShadow: 'var(--shadow-xl)',
    border: '1px solid var(--border)',
    // Removed overflow hidden to prevent clipping the negative-margin avatar
  },
  avatarContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '-50px',
    position: 'relative',
  },
  avatarLarge: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '40px',
    fontWeight: 800,
    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
    border: '4px solid var(--card-bg)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  roleBadgeContainer: {
    marginTop: '-12px',
    zIndex: 2,
  },
  roleBadgeGlow: {
    display: 'inline-block',
    background: '#1e293b',
    color: '#f8fafc',
    padding: '4px 16px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  cardBody: {
    padding: '40px',
    textAlign: 'center',
  },
  viewMode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  userName: {
    fontSize: '32px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    margin: '0 0 4px',
    letterSpacing: '-0.02em',
  },
  userEmail: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    margin: '0 0 32px',
    fontWeight: 500,
  },
  infoSection: {
    width: '100%',
    textAlign: 'left',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '32px',
    border: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: 700,
    color: 'var(--text-muted)',
    margin: '0 0 16px',
  },
  addressBox: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  addressIcon: {
    fontSize: '20px',
    marginTop: '2px',
  },
  addressText: {
    fontSize: '15px',
    color: 'var(--text-primary)',
    lineHeight: '1.6',
    margin: 0,
    fontWeight: 500,
  },
  emptyAddress: {
    fontSize: '15px',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  editBtn: {
    padding: '12px 32px',
    background: 'transparent',
    border: '2px solid var(--primary)',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--primary)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  successMessage: {
    marginTop: '16px',
    color: 'var(--primary)',
    fontWeight: 600,
    fontSize: '14px',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '8px 16px',
    borderRadius: '20px',
  },
  editTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    textAlign: 'left',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  input: {
    padding: '14px 16px',
    border: '2px solid var(--border)',
    borderRadius: '12px',
    fontSize: '15px',
    background: 'var(--card-bg)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    marginTop: '12px',
  },
  cancelBtn: {
    flex: 1,
    padding: '14px',
    background: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 1,
    padding: '14px',
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
  }
};

export default Profile;
