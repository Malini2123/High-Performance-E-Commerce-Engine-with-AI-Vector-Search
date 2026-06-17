import { useEffect, useState } from 'react'
import api from '../api/client'

function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    api.get('/products')
      .then(res => setProducts(res.data.data))
      .catch(err => console.error('Error fetching products:', err))
  }, [])

  return (
    <div>
      <h1>Products</h1>
      <p>{products.length} products loaded</p>
    </div>
  )
}

export default Home