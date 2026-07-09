require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/product');

// Product-specific image mapping based on keywords
function getImageUrl(name, category) {
  const n = name.toLowerCase();
  
  // Food items
  if (n.includes('moringa')) return 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&h=300&fit=crop';
  if (n.includes('flaxseed')) return 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=400&h=300&fit=crop';
  if (n.includes('green coffee') || n.includes('coffee bean')) return 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop';
  if (n.includes('dates') || n.includes('medjool')) return 'https://images.unsplash.com/photo-1593904308074-f73c14abde73?w=400&h=300&fit=crop';
  if (n.includes('black pepper') || n.includes('pepper')) return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop';
  if (n.includes('olive oil')) return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=300&fit=crop';
  if (n.includes('multivitamin') || n.includes('vitamin') || n.includes('tablet')) return 'https://images.unsplash.com/photo-1550572017-edd951b55104?w=400&h=300&fit=crop';
  if (n.includes('cashew')) return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=400&h=300&fit=crop';
  if (n.includes('turmeric')) return 'https://images.unsplash.com/photo-1596040033229-jd_V5Ui3pe4?w=400&h=300&fit=crop';
  if (n.includes('chia')) return 'https://images.unsplash.com/photo-1501020579208-ece480a28701?w=400&h=300&fit=crop';
  if (n.includes('almond')) return 'https://images.unsplash.com/photo-1574570083767-bf9ff1627f62?w=400&h=300&fit=crop';
  if (n.includes('walnut')) return 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=400&h=300&fit=crop';
  if (n.includes('honey')) return 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=300&fit=crop';
  if (n.includes('protein') || n.includes('whey')) return 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=300&fit=crop';
  if (n.includes('green tea') || n.includes('tea')) return 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop';
  if (n.includes('coconut oil') || n.includes('coconut')) return 'https://images.unsplash.com/photo-1526181438849-3e0e31ece72e?w=400&h=300&fit=crop';
  if (n.includes('quinoa')) return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop';
  if (n.includes('oat') || n.includes('oatmeal')) return 'https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=400&h=300&fit=crop';
  if (n.includes('apple cider') || n.includes('vinegar')) return 'https://images.unsplash.com/photo-1598511726623-d2e9996e6cff?w=400&h=300&fit=crop';
  if (n.includes('spirulina')) return 'https://images.unsplash.com/photo-1622484211901-5b6e6a3c2b4c?w=400&h=300&fit=crop';
  if (n.includes('ashwagandha')) return 'https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?w=400&h=300&fit=crop';
  if (n.includes('hemp')) return 'https://images.unsplash.com/photo-1611144701643-7f8c3f5a7d1c?w=400&h=300&fit=crop';
  if (n.includes('pumpkin seed') || n.includes('pumpkin')) return 'https://images.unsplash.com/photo-1570586437263-ab629fccc818?w=400&h=300&fit=crop';
  if (n.includes('sunflower seed')) return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=300&fit=crop';
  if (n.includes('rice') || n.includes('brown rice')) return 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&h=300&fit=crop';
  if (n.includes('lentil') || n.includes('dal')) return 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop';
  if (n.includes('chickpea') || n.includes('chick pea')) return 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?w=400&h=300&fit=crop';
  if (n.includes('dark chocolate') || n.includes('chocolate')) return 'https://images.unsplash.com/photo-1481391243133-f96216dcb5d2?w=400&h=300&fit=crop';
  if (n.includes('maca')) return 'https://images.unsplash.com/photo-1615485290840-c4f25b86bb44?w=400&h=300&fit=crop';
  if (n.includes('ginger')) return 'https://images.unsplash.com/photo-1615485291234-9d694218aeb6?w=400&h=300&fit=crop';
  if (n.includes('cinnamon')) return 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=300&fit=crop';
  if (n.includes('cardamom')) return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop';
  if (n.includes('cumin') || n.includes('jeera')) return 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&h=300&fit=crop';
  if (n.includes('saffron')) return 'https://images.unsplash.com/photo-1615485290840-c4f25b86bb44?w=400&h=300&fit=crop';
  if (n.includes('sesame')) return 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&h=300&fit=crop';

  // Electronics
  if (n.includes('headphone') || n.includes('earphone')) return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop';
  if (n.includes('laptop')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=300&fit=crop';
  if (n.includes('phone') || n.includes('mobile') || n.includes('smartphone')) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop';
  if (n.includes('tablet') || n.includes('ipad')) return 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop';
  if (n.includes('watch') || n.includes('smartwatch')) return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop';
  if (n.includes('camera')) return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop';
  if (n.includes('speaker') || n.includes('bluetooth')) return 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=300&fit=crop';
  if (n.includes('keyboard')) return 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop';
  if (n.includes('mouse')) return 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop';
  if (n.includes('charger') || n.includes('power bank')) return 'https://images.unsplash.com/photo-1609592806596-b8a4bc5f2e81?w=400&h=300&fit=crop';
  if (n.includes('monitor') || n.includes('screen')) return 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop';
  if (n.includes('printer')) return 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400&h=300&fit=crop';
  if (n.includes('router') || n.includes('wifi')) return 'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?w=400&h=300&fit=crop';
  if (n.includes('usb') || n.includes('pen drive') || n.includes('flash drive')) return 'https://images.unsplash.com/photo-1625634741537-7a63dc5f15d4?w=400&h=300&fit=crop';

  // Clothing
  if (n.includes('t-shirt') || n.includes('tshirt') || n.includes('shirt')) return 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop';
  if (n.includes('jeans') || n.includes('denim')) return 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=300&fit=crop';
  if (n.includes('jacket') || n.includes('coat')) return 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=300&fit=crop';
  if (n.includes('dress')) return 'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=400&h=300&fit=crop';
  if (n.includes('shoe') || n.includes('sneaker') || n.includes('footwear')) return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop';
  if (n.includes('sock')) return 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=300&fit=crop';
  if (n.includes('cap') || n.includes('hat')) return 'https://images.unsplash.com/photo-1521369909029-2afed882baee?w=400&h=300&fit=crop';
  if (n.includes('saree') || n.includes('sari')) return 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=300&fit=crop';
  if (n.includes('kurta')) return 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400&h=300&fit=crop';
  if (n.includes('trouser') || n.includes('pant')) return 'https://images.unsplash.com/photo-1602293589930-45aad59ba3ab?w=400&h=300&fit=crop';

  // Sports
  if (n.includes('football') || n.includes('soccer ball')) return 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=400&h=300&fit=crop';
  if (n.includes('cricket')) return 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=300&fit=crop';
  if (n.includes('badminton')) return 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=300&fit=crop';
  if (n.includes('tennis')) return 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=300&fit=crop';
  if (n.includes('basketball')) return 'https://images.unsplash.com/photo-1546519638405-a2d8e8f9e86d?w=400&h=300&fit=crop';
  if (n.includes('yoga mat') || n.includes('yoga')) return 'https://images.unsplash.com/photo-1601925228596-8e41c7ecdabe?w=400&h=300&fit=crop';
  if (n.includes('dumbbell') || n.includes('weight')) return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=300&fit=crop';
  if (n.includes('cycling') || n.includes('bicycle') || n.includes('bike')) return 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=300&fit=crop';
  if (n.includes('swimming') || n.includes('swim')) return 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=300&fit=crop';
  if (n.includes('glove') || n.includes('boxing')) return 'https://images.unsplash.com/photo-1509563268479-0f004cf3f58b?w=400&h=300&fit=crop';

  // Books
  if (n.includes('novel') || n.includes('fiction')) return 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop';
  if (n.includes('cookbook') || n.includes('recipe')) return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=300&fit=crop';
  if (n.includes('self help') || n.includes('self-help')) return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop';
  if (n.includes('textbook') || n.includes('academic')) return 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=300&fit=crop';
  if (n.includes('comic') || n.includes('manga')) return 'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop';
  if (n.includes('biograph')) return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop';

  // Home
  if (n.includes('sofa') || n.includes('couch')) return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
  if (n.includes('lamp') || n.includes('light')) return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=300&fit=crop';
  if (n.includes('pillow') || n.includes('cushion')) return 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=400&h=300&fit=crop';
  if (n.includes('blanket') || n.includes('bedsheet') || n.includes('bed sheet')) return 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop';
  if (n.includes('curtain')) return 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=400&h=300&fit=crop';
  if (n.includes('cookware') || n.includes('pan') || n.includes('pot')) return 'https://images.unsplash.com/photo-1585836012334-37a7a9a2c2e0?w=400&h=300&fit=crop';
  if (n.includes('mug') || n.includes('cup')) return 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&h=300&fit=crop';
  if (n.includes('bottle') || n.includes('water bottle')) return 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop';
  if (n.includes('candle')) return 'https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=400&h=300&fit=crop';
  if (n.includes('plant') || n.includes('flower pot')) return 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop';

  // Beauty
  if (n.includes('face wash') || n.includes('cleanser')) return 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=300&fit=crop';
  if (n.includes('moisturizer') || n.includes('cream') || n.includes('lotion')) return 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400&h=300&fit=crop';
  if (n.includes('lipstick') || n.includes('lip')) return 'https://images.unsplash.com/photo-1586495777744-4e6232bf2f9e?w=400&h=300&fit=crop';
  if (n.includes('mascara') || n.includes('eyeliner') || n.includes('eye')) return 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=400&h=300&fit=crop';
  if (n.includes('perfume') || n.includes('fragrance')) return 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=300&fit=crop';
  if (n.includes('shampoo') || n.includes('hair')) return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=400&h=300&fit=crop';
  if (n.includes('sunscreen') || n.includes('spf')) return 'https://images.unsplash.com/photo-1556228852-6d35a585d566?w=400&h=300&fit=crop';
  if (n.includes('serum')) return 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=300&fit=crop';
  if (n.includes('nail') || n.includes('nail polish')) return 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=300&fit=crop';

  // Category fallbacks
  const cat = category?.toLowerCase();
  if (cat === 'food') return 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop';
  if (cat === 'electronics') return 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop';
  if (cat === 'clothing') return 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop';
  if (cat === 'books') return 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=300&fit=crop';
  if (cat === 'sports') return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=300&fit=crop';
  if (cat === 'home') return 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
  if (cat === 'beauty') return 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=300&fit=crop';

  return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop';
}

async function updateImages() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    let updated = 0;
    for (const product of products) {
      const imageUrl = getImageUrl(product.name, product.category);
      await Product.findByIdAndUpdate(product._id, { image: imageUrl });
      console.log(`✅ ${product.name} → ${imageUrl}`);
      updated++;
    }

    console.log(`\n✅ Updated ${updated} products with images!`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateImages();