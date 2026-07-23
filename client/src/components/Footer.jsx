import { motion } from 'framer-motion';

function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={styles.footer}
    >
      <div style={styles.container}>
        {/* Left Brand Col */}
        <div style={styles.col}>
          <div style={styles.logo}>
            ZapCart
          </div>
          <p style={styles.brandText}>
            Your one-stop destination for Electronics, Clothing, Books, Sports, Beauty & Food — curated deals at unbeatable prices.
          </p>
          <div style={styles.socials}>
            {['📱', '💬', '📸', '🐦'].map((icon, idx) => (
              <span key={idx} style={styles.socialIcon}>{icon}</span>
            ))}
          </div>
        </div>

        {/* Links Col 1 */}
        <div style={styles.col}>
          <h4 style={styles.heading}>Shop Categories</h4>
          <ul style={styles.list}>
            {[
              { icon: '💻', label: 'Electronics' },
              { icon: '👕', label: 'Clothing' },
              { icon: '🍎', label: 'Food' },
              { icon: '📚', label: 'Books' },
              { icon: '⚽', label: 'Sports' },
              { icon: '✨', label: 'Beauty' },
            ].map((item) => (
              <li key={item.label} style={styles.listItem}>
                <span style={styles.link}>{item.icon} {item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Col 2 */}
        <div style={styles.col}>
          <h4 style={styles.heading}>Company</h4>
          <ul style={styles.list}>
            {['About Us', 'Contact Us', 'Careers', 'Our Story'].map((item) => (
              <li key={item} style={styles.listItem}>
                <span style={styles.link}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Links Col 3 */}
        <div style={styles.col}>
          <h4 style={styles.heading}>Policies & Support</h4>
          <ul style={styles.list}>
            {['7-Day Return Policy', 'Terms & Conditions', 'Privacy Policy', 'Secure Shopping'].map((item) => (
              <li key={item} style={styles.listItem}>
                <span style={styles.link}>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact Info Col */}
        <div style={styles.col}>
          <h4 style={styles.heading}>ZapCart Contacts</h4>
          <p style={styles.contactText}>🌐 <a href="https://zapcart.com" target="_blank" rel="noreferrer" style={styles.link}>zapcart.com</a></p>
          <p style={styles.contactText}>✉️ <a href="mailto:hello@zapcart.com" style={styles.link}>hello@zapcart.com</a></p>
          <p style={styles.contactText}>📞 <a href="tel:+48577612187" style={styles.link}>+48577612187</a></p>
        </div>
      </div>

      <div style={styles.bottomBar}>
        <div style={styles.bottomContainer}>
          <p style={styles.copy}>© 2026 ZapCart E-Commerce. All rights reserved.</p>
          <div style={styles.payments}>
            {['💵 COD', '💳 Razorpay', '🛡️ Safe Checkout'].map((badge) => (
              <span key={badge} style={styles.paymentBadge}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </motion.footer>
  );
}

const styles = {
  footer: {
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    padding: '60px 0 0 0',
    marginTop: 'auto',
    borderTop: '1px solid var(--border)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '40px',
  },
  col: {
    flex: '1 1 200px',
    minWidth: '200px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  logo: {
    color: 'var(--primary)',
    fontSize: '28px',
    fontWeight: 700,
    fontFamily: 'var(--heading)',
    letterSpacing: '-0.02em',
    textTransform: 'lowercase',
  },
  brandText: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    margin: 0,
  },
  socials: {
    display: 'flex',
    gap: '12px',
  },
  socialIcon: {
    width: '32px',
    height: '32px',
    background: 'rgba(30,45,31,0.06)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  heading: {
    fontSize: '13px',
    fontWeight: 800,
    color: 'var(--primary)',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    marginBottom: '4px',
    fontFamily: 'var(--sans)',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  listItem: {
    fontSize: '13px',
  },
  link: {
    color: 'var(--text-secondary)',
    textDecoration: 'none',
    transition: 'color 0.2s',
    cursor: 'pointer',
  },
  contactText: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    margin: 0,
  },
  bottomBar: {
    background: 'var(--bg-secondary)',
    padding: '24px 24px',
    borderTop: '1px solid var(--border)',
  },
  bottomContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  copy: {
    fontSize: '12px',
    color: 'var(--text-muted)',
    margin: 0,
  },
  payments: {
    display: 'flex',
    gap: '10px',
  },
  paymentBadge: {
    fontSize: '11px',
    fontWeight: 700,
    background: 'var(--border)',
    padding: '4px 10px',
    borderRadius: '12px',
    color: 'var(--text-secondary)',
  },
};

export default Footer;
