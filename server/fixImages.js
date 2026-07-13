/**
 * Fix all product images by replacing any broken/blocked image URLs
 * with reliable Unsplash images based on product name/category.
 *
 * Usage: node fixImages.js
 */
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Product = require('./models/product');

// Unsplash image mapping by product name keywords
function getUnsplashImage(name, category) {
  const n = (name || '').toLowerCase();
  const cat = (category || '').toLowerCase();

  // === BOOKS ===
  if (n.includes('atomic habits')) return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=450&fit=crop&q=80';
  if (n.includes('alchemist')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=450&fit=crop&q=80';
  if (n.includes('rich dad')) return 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&h=450&fit=crop&q=80';
  if (n.includes('harry potter')) return 'https://images.unsplash.com/photo-1609866138210-84bb689f3c61?w=600&h=450&fit=crop&q=80';
  if (n.includes('sapiens')) return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=450&fit=crop&q=80';
  if (n.includes('psychology of money')) return 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=450&fit=crop&q=80';
  if (n.includes('zero to one')) return 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=450&fit=crop&q=80';
  if (n.includes('deep work')) return 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&h=450&fit=crop&q=80';
  if (n.includes('7 habits') || n.includes('seven habits')) return 'https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=600&h=450&fit=crop&q=80';
  if (n.includes('lean startup')) return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=450&fit=crop&q=80';
  if (n.includes('power of now')) return 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=600&h=450&fit=crop&q=80';
  if (n.includes('ikigai')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=450&fit=crop&q=80';
  if (n.includes('subtle art')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=450&fit=crop&q=80';
  if (n.includes('start with why')) return 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&h=450&fit=crop&q=80';
  if (n.includes('think and grow')) return 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&h=450&fit=crop&q=80';
  if (cat === 'books') return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=450&fit=crop&q=80';

  // === FOOD ===
  if (n.includes('green tea') || n.includes('tea bag')) return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&h=450&fit=crop&q=80';
  if (n.includes('pink salt') || n.includes('himalayan salt')) return 'https://images.unsplash.com/photo-1619546952812-520e98064a52?w=600&h=450&fit=crop&q=80';
  if (n.includes('dry fruit') || n.includes('mixed nut')) return 'https://images.unsplash.com/photo-1574570083767-bf9ff1627f62?w=600&h=450&fit=crop&q=80';
  if (n.includes('olive oil')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&h=450&fit=crop&q=80';
  if (n.includes('dark chocolate') || n.includes('chocolate')) return 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=600&h=450&fit=crop&q=80';
  if (n.includes('honey')) return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&h=450&fit=crop&q=80';
  if (n.includes('oat') || n.includes('oatmeal')) return 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=600&h=450&fit=crop&q=80';
  if (n.includes('peanut butter')) return 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop&q=80';
  if (n.includes('masala chai') || n.includes('chai')) return 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=600&h=450&fit=crop&q=80';
  if (n.includes('basmati') || n.includes('rice')) return 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=600&h=450&fit=crop&q=80';
  if (n.includes('granola') || n.includes('granola bar')) return 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=450&fit=crop&q=80';
  if (n.includes('apple cider') || n.includes('vinegar')) return 'https://images.unsplash.com/photo-1598511726623-d2e9996e6cff?w=600&h=450&fit=crop&q=80';
  if (n.includes('almond')) return 'https://images.unsplash.com/photo-1574570083767-bf9ff1627f62?w=600&h=450&fit=crop&q=80';
  if (n.includes('coconut oil') || n.includes('coconut')) return 'https://images.unsplash.com/photo-1525385133772-2a8b97a3d848?w=600&h=450&fit=crop&q=80';
  if (n.includes('protein powder') || n.includes('whey')) return 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&h=450&fit=crop&q=80';
  if (cat === 'food') return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=450&fit=crop&q=80';

  // === BEAUTY ===
  if (n.includes('vitamin c') && n.includes('serum')) return 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=450&fit=crop&q=80';
  if (n.includes('hyaluronic') || n.includes('moisturizer')) return 'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=600&h=450&fit=crop&q=80';
  if (n.includes('sunscreen') || n.includes('spf')) return 'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=600&h=450&fit=crop&q=80';
  if (n.includes('retinol') || n.includes('night cream')) return 'https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=600&h=450&fit=crop&q=80';
  if (n.includes('rose water') || n.includes('toner')) return 'https://images.unsplash.com/photo-1598454444314-28cf5b58b11c?w=600&h=450&fit=crop&q=80';
  if (n.includes('charcoal face wash') || n.includes('face wash') || n.includes('cleanser')) return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=450&fit=crop&q=80';
  if (n.includes('argan oil') || n.includes('hair serum')) return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=450&fit=crop&q=80';
  if (n.includes('lipstick') || n.includes('lip')) return 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f9e?w=600&h=450&fit=crop&q=80';
  if (n.includes('niacinamide') || n.includes('serum')) return 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&h=450&fit=crop&q=80';
  if (n.includes('micellar') || n.includes('makeup remover')) return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=450&fit=crop&q=80';
  if (n.includes('keratin') || n.includes('hair mask')) return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600&h=450&fit=crop&q=80';
  if (n.includes('perfume') || n.includes('eau de parfum') || n.includes('fragrance')) return 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&h=450&fit=crop&q=80';
  if (n.includes('eye cream') || n.includes('dark circle')) return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=450&fit=crop&q=80';
  if (n.includes('bb cream') || n.includes('foundation')) return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=450&fit=crop&q=80';
  if (n.includes('aloe vera')) return 'https://images.unsplash.com/photo-1598454444314-28cf5b58b11c?w=600&h=450&fit=crop&q=80';
  if (cat === 'beauty') return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&h=450&fit=crop&q=80';

  // === ELECTRONICS ===
  if (n.includes('laptop')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=450&fit=crop&q=80';
  if (n.includes('samsung') && n.includes('monitor')) return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=450&fit=crop&q=80';
  if (n.includes('phone') || n.includes('iphone') || n.includes('samsung') || n.includes('smartphone')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=450&fit=crop&q=80';
  if (n.includes('watch') || n.includes('smartwatch')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=450&fit=crop&q=80';
  if (n.includes('headphone') || n.includes('earphone') || n.includes('earbud') || n.includes('airpod')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=450&fit=crop&q=80';
  if (n.includes('speaker') || n.includes('bluetooth')) return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=450&fit=crop&q=80';
  if (n.includes('tablet') || n.includes('ipad')) return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=450&fit=crop&q=80';
  if (n.includes('camera') || n.includes('dslr')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=450&fit=crop&q=80';
  if (n.includes('keyboard')) return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=450&fit=crop&q=80';
  if (n.includes('mouse')) return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&h=450&fit=crop&q=80';
  if (n.includes('monitor') || n.includes('screen') || n.includes('display')) return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=450&fit=crop&q=80';
  if (n.includes('ssd') || n.includes('hard drive') || n.includes('storage')) return 'https://images.unsplash.com/photo-1631977134049-80f29c0e9d74?w=600&h=450&fit=crop&q=80';
  if (n.includes('charger') || n.includes('power bank')) return 'https://images.unsplash.com/photo-1609592806596-b8a4bc5f2e81?w=600&h=450&fit=crop&q=80';
  if (n.includes('acer') || n.includes('dell') || n.includes('hp ') || n.includes('lenovo')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&h=450&fit=crop&q=80';
  if (cat === 'electronics') return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600&h=450&fit=crop&q=80';

  // === CLOTHING ===
  if (n.includes('t shirt') || n.includes('tshirt') || n.includes('t-shirt') || n.includes('womens t')) return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=450&fit=crop&q=80';
  if (n.includes('jacket') || n.includes('coat') || n.includes('raincoat')) return 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=600&h=450&fit=crop&q=80';
  if (n.includes('dress') || n.includes('gown')) return 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&h=450&fit=crop&q=80';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('boot') || n.includes('sandal')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=450&fit=crop&q=80';
  if (n.includes('watch') && cat === 'clothing') return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=450&fit=crop&q=80';
  if (n.includes('bag') || n.includes('purse') || n.includes('handbag')) return 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=450&fit=crop&q=80';
  if (n.includes('jewel') || n.includes('ring') || n.includes('necklace') || n.includes('bracelet')) return 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=450&fit=crop&q=80';
  if (n.includes('sunglass')) return 'https://images.unsplash.com/photo-1508296695146-257a814070b4?w=600&h=450&fit=crop&q=80';
  if (cat === 'clothing') return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&h=450&fit=crop&q=80';

  // === SPORTS ===
  if (n.includes('yoga mat') || n.includes('yoga')) return 'https://images.unsplash.com/photo-1601925228596-8e41c7ecdabe?w=600&h=450&fit=crop&q=80';
  if (n.includes('dumbbell') || n.includes('weight') || n.includes('gym')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=450&fit=crop&q=80';
  if (n.includes('bicycle') || n.includes('bike') || n.includes('cycling')) return 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&h=450&fit=crop&q=80';
  if (n.includes('football') || n.includes('soccer')) return 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&h=450&fit=crop&q=80';
  if (n.includes('cricket')) return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600&h=450&fit=crop&q=80';
  if (n.includes('tennis') || n.includes('racket')) return 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&h=450&fit=crop&q=80';
  if (n.includes('basketball')) return 'https://images.unsplash.com/photo-1546519638405-a2d8e8f9e86d?w=600&h=450&fit=crop&q=80';
  if (cat === 'sports') return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=450&fit=crop&q=80';

  return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=450&fit=crop&q=80';
}

async function fixImages() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let updated = 0;
    for (const p of products) {
      // Force update all images to guarantee high-quality working Unsplash URLs
      const needsUpdate = true;

      if (needsUpdate) {
        const newImg = getUnsplashImage(p.name, p.category);
        await Product.findByIdAndUpdate(p._id, { image: newImg });
        console.log(`✅ [${p.category}] ${p.name.substring(0, 50)} → ${newImg.substring(0, 60)}`);
        updated++;
      }
    }

    console.log(`\n✅ Done. Updated ${updated} product images.`);

    // Clear Redis cache
    try {
      const { createClient } = require('redis');
      const redisClient = createClient({ url: process.env.REDIS_URL });
      await redisClient.connect();
      await redisClient.flushAll();
      console.log('🗑️  Redis cache cleared');
      await redisClient.disconnect();
    } catch (e) {
      console.log('⚠️  Redis clear skipped:', e.message);
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Fatal:', err);
    process.exit(1);
  }
}

fixImages();
