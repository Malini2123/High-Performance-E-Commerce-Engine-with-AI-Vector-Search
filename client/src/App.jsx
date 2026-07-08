import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';
import Login from './pages/Login';
import Register from './pages/Register';
import Cart from './pages/Cart';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Analytics from './pages/Analytics';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/search" element={<Search />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </>
  );
}

export default App;