import { useState, useEffect } from 'react';
import apiClient from '../api/client';
import ProductCard from '../components/ProductCard';

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/products')
      .then((res) => {
        setProducts(res.data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={styles.message}>Loading products...</div>;
  if (error) return <div style={styles.message}>Error: {error}</div>;

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Products</h1>
      <p style={styles.subtitle}>{products.length} products loaded</p>
      <div style={styles.grid}>
        {products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 20px',
  },
  title: {
    fontSize: '32px',
    margin: '0 0 4px',
  },
  subtitle: {
    color: '#888',
    marginBottom: '24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
  },
  message: {
    textAlign: 'center',
    padding: '60px',
    fontSize: '16px',
    color: '#888',
  },
};

export default Home;