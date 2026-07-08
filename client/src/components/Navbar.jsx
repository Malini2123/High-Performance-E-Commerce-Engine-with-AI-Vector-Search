import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    window.location.reload();
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>🛍️ ShopAI</Link>
        <div style={styles.links}>
          <Link to="/" style={styles.link}>Products</Link>
          <Link to="/search" style={styles.link}>🔍 Search</Link>
          <Link to="/cart" style={styles.link}>🛒 Cart</Link>
          <Link to="/wishlist" style={styles.link}>❤️ Wishlist</Link>
          <Link to="/orders" style={styles.link}>📦 Orders</Link>
          <Link to="/analytics" style={styles.link}>📊 Analytics</Link>

          {user ? (
            <>
              <span style={styles.username}>Hi, {user.name} 👋</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: '#1a1a1a',
    padding: '0 20px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '60px',
  },
  logo: {
    color: '#fff',
    textDecoration: 'none',
    fontSize: '20px',
    fontWeight: 700,
  },
  links: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  },
  link: {
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
  },
  username: {
    color: '#6ee7b7',
    fontSize: '14px',
    fontWeight: 500,
  },
  logoutBtn: {
    background: 'none',
    border: '1px solid #555',
    color: '#ccc',
    padding: '6px 14px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
  },
  registerBtn: {
    background: '#fff',
    color: '#1a1a1a',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    padding: '6px 14px',
    borderRadius: '6px',
  },
};

export default Navbar;