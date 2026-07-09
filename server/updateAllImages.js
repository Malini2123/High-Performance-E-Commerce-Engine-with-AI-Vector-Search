const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/product');

function cleanNameForSearch(name) {
  let q = name;
  q = q.replace(/\b\d+L\b/gi, '');
  q = q.replace(/\b\d+g\b/gi, '');
  q = q.replace(/\b\d+kg\b/gi, '');
  q = q.replace(/\b\d+Ton\b/gi, '');
  q = q.replace(/\b\d+HP\b/gi, '');
  q = q.replace(/\b\d+ml\b/gi, '');
  q = q.replace(/\b\d+\s*pcs\b/gi, '');
  q = q.replace(/\bPack of \d+\b/gi, '');
  q = q.replace(/\b\d+\"\b/gi, '');
  q = q.replace(/\b\d+th Generation\b/gi, '');
  q = q.replace(/\bMen's\b/gi, '');
  q = q.replace(/\bWomen's\b/gi, '');
  q = q.replace(/\bKids\b/gi, '');
  q = q.replace(/[^a-zA-Z0-9\s]/g, ' ');
  q = q.replace(/\s+/g, ' ');
  return q.trim();
}

async function updateAllImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to update`);

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const query = cleanNameForSearch(p.name);
      console.log(`[${i+1}/${products.length}] Fetching image for: "${p.name}" (Query: "${query}")`);
      
      try {
        const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query)}`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        let data = await res.json();
        
        // Fallback: If no results found, search using the first 2 words
        if (!data.results || data.results.length === 0) {
          const fallbackQuery = query.split(' ').slice(0, 2).join(' ');
          console.log(`   No results for "${query}". Trying fallback: "${fallbackQuery}"`);
          const fbUrl = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(fallbackQuery)}`;
          const fbRes = await fetch(fbUrl);
          if (fbRes.ok) {
            data = await fbRes.json();
          }
        }

        if (data.results && data.results.length > 0) {
          const standardPhoto = data.results.find(item => !item.is_premium) || data.results[0];
          const imgUrl = standardPhoto.urls.regular.split('?')[0] + '?w=600&h=450&fit=crop&q=80';
          
          await Product.findByIdAndUpdate(p._id, { image: imgUrl });
          console.log(`   Updated: ${imgUrl}`);
        } else {
          console.log(`   No images found on Unsplash for: ${query}`);
        }
      } catch (err) {
        console.error(`   Error updating "${p.name}":`, err.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log('Completed updating all product images!');
    process.exit(0);
  } catch (err) {
    console.error('Connection/Update error:', err);
    process.exit(1);
  }
}

updateAllImages();
