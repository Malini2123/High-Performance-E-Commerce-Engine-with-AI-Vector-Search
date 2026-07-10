import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollRestorer from './components/ScrollRestorer';
import BackToTop from './components/BackToTop';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';
import Admin from './pages/Admin';
import apiClient from './api/client';

function App() {
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      apiClient.get('/wishlist')
        .then(res => {
          const list = res.data.wishlist || res.data || [];
          const ids = list.map(item => item._id);
          localStorage.setItem('wishlistIds', JSON.stringify(ids));
        })
        .catch(err => console.error('Error caching wishlist ids:', err));
    }
  }, []);

  return (
    <>
      <ScrollRestorer />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/search" element={<Search />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AnimatePresence>
      <Footer />
      <BackToTop />
      <Chatbot />
    </>
  );
}

export default App;