const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Product = require('./models/product');

async function generateEmbedding(text) {
  const { pipeline } = await import('@xenova/transformers');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

const products = [
  // Electronics (20)
  { name: 'Samsung 4K Smart TV 55"', category: 'Electronics', price: 45999, stock: 25, description: 'Ultra HD 4K smart television with HDR, built-in WiFi, Netflix and YouTube support' },
  { name: 'Apple iPhone 15 Pro', category: 'Electronics', price: 134999, stock: 15, description: 'Latest Apple smartphone with titanium design, A17 Pro chip, 48MP camera system' },
  { name: 'Sony WH-1000XM5 Headphones', category: 'Electronics', price: 29999, stock: 40, description: 'Premium wireless noise cancelling headphones with 30hr battery life and crystal clear audio' },
  { name: 'Dell Inspiron 15 Laptop', category: 'Electronics', price: 55999, stock: 20, description: 'High performance laptop with Intel Core i7, 16GB RAM, 512GB SSD for work and gaming' },
  { name: 'Canon EOS R50 Camera', category: 'Electronics', price: 67999, stock: 12, description: 'Mirrorless digital camera with 24.2MP sensor, 4K video recording and fast autofocus' },
  { name: 'iPad Air 5th Generation', category: 'Electronics', price: 59999, stock: 18, description: 'Powerful Apple tablet with M1 chip, 10.9 inch Liquid Retina display and all-day battery' },
  { name: 'Xiaomi Robot Vacuum Cleaner', category: 'Electronics', price: 19999, stock: 30, description: 'Smart robot vacuum with laser navigation, auto-cleaning and app control for home floors' },
  { name: 'JBL Flip 6 Bluetooth Speaker', category: 'Electronics', price: 9999, stock: 50, description: 'Portable waterproof bluetooth speaker with powerful bass and 12 hours playtime' },
  { name: 'LG 1.5 Ton Split AC', category: 'Electronics', price: 34999, stock: 22, description: 'Energy efficient air conditioner with 5 star rating, dual inverter compressor and WiFi control' },
  { name: 'Samsung Galaxy Watch 6', category: 'Electronics', price: 24999, stock: 35, description: 'Advanced smartwatch with health monitoring, GPS, sleep tracking and long battery life' },
  { name: 'OnePlus Nord CE 3 Lite', category: 'Electronics', price: 17999, stock: 45, description: 'Budget Android smartphone with 108MP camera, 67W fast charging and AMOLED display' },
  { name: 'Lenovo Tab P11 Pro', category: 'Electronics', price: 39999, stock: 16, description: 'Premium Android tablet with OLED display, quad speakers and stylus pen support' },
  { name: 'Corsair K95 Mechanical Keyboard', category: 'Electronics', price: 12999, stock: 28, description: 'RGB mechanical gaming keyboard with Cherry MX switches, macro keys and wrist rest' },
  { name: 'Logitech MX Master 3 Mouse', category: 'Electronics', price: 8999, stock: 42, description: 'Advanced wireless mouse with hyper-fast scrolling, ergonomic design for productivity' },
  { name: 'Philips Air Fryer HD9252', category: 'Electronics', price: 7999, stock: 38, description: 'Digital air fryer with rapid air technology, 4.1L capacity for healthy oil-free cooking' },
  { name: 'Boat Airdopes 141 TWS', category: 'Electronics', price: 1299, stock: 100, description: 'True wireless earbuds with 42hr total playtime, ENx noise cancellation and IPX4 rating' },
  { name: 'Mi Smart Band 8', category: 'Electronics', price: 3499, stock: 80, description: 'Fitness tracker with AMOLED display, heart rate monitor, SpO2 sensor and 16 day battery' },
  { name: 'Epson L3250 Printer', category: 'Electronics', price: 13999, stock: 20, description: 'All-in-one WiFi ink tank printer for home and office with print scan copy functions' },
  { name: 'TP-Link WiFi Router AX1800', category: 'Electronics', price: 4999, stock: 55, description: 'Dual band WiFi 6 router with high speed internet, parental controls and easy setup' },
  { name: 'Portronics Power Bank 20000mAh', category: 'Electronics', price: 1999, stock: 90, description: 'High capacity power bank with dual USB output, fast charging for smartphones and tablets' },

  // Clothing (20)
  { name: "Men's Cotton Formal Shirt", category: 'Clothing', price: 899, stock: 150, description: 'Classic formal cotton shirt for office and business meetings, available in multiple colors' },
  { name: "Women's Kurti Ethnic Wear", category: 'Clothing', price: 699, stock: 200, description: 'Beautiful traditional Indian kurti with floral print, comfortable for daily and festive wear' },
  { name: "Men's Slim Fit Jeans", category: 'Clothing', price: 1299, stock: 120, description: 'Stylish slim fit denim jeans with stretch fabric, modern cut for casual everyday wear' },
  { name: "Women's Leggings Pack of 3", category: 'Clothing', price: 599, stock: 250, description: 'Comfortable cotton blend leggings, perfect for yoga, gym workout and casual wear' },
  { name: "Men's Sports T-Shirt", category: 'Clothing', price: 499, stock: 180, description: 'Dry-fit polyester sports t-shirt with moisture wicking technology for gym and outdoor activities' },
  { name: "Women's Saree Silk Banarasi", category: 'Clothing', price: 3499, stock: 60, description: 'Traditional Banarasi silk saree with golden zari border, ideal for weddings and festivals' },
  { name: "Kids School Uniform Set", category: 'Clothing', price: 799, stock: 100, description: 'Durable school uniform set with shirt and trousers, easy to wash and iron' },
  { name: "Men's Winter Jacket", category: 'Clothing', price: 2499, stock: 75, description: 'Warm padded winter jacket with hood, water resistant outer shell for cold weather' },
  { name: "Women's Anarkali Dress", category: 'Clothing', price: 1599, stock: 90, description: 'Elegant flared Anarkali dress with embroidery, perfect for parties and celebrations' },
  { name: "Men's Running Shorts", category: 'Clothing', price: 399, stock: 200, description: 'Lightweight running shorts with inner brief, quick dry fabric for jogging and sports' },
  { name: "Women's Blazer Formal", category: 'Clothing', price: 1999, stock: 65, description: 'Professional formal blazer for office and business meetings, slim fit tailored look' },
  { name: "Men's Ethnic Kurta Pajama", category: 'Clothing', price: 1299, stock: 110, description: 'Traditional cotton kurta pajama set for festivals, weddings and casual Indian occasions' },
  { name: "Women's Summer Dress", category: 'Clothing', price: 999, stock: 130, description: 'Floral print cotton summer dress, lightweight and breathable for hot weather' },
  { name: "Men's Woolen Sweater", category: 'Clothing', price: 1499, stock: 85, description: 'Warm woolen pullover sweater with round neck, perfect for winter and cold mornings' },
  { name: "Women's Sports Bra", category: 'Clothing', price: 599, stock: 160, description: 'High support sports bra with moisture wicking fabric for intense gym workout and yoga' },
  { name: "Kids Winter Hooded Jacket", category: 'Clothing', price: 999, stock: 95, description: 'Cozy hooded jacket for children with soft inner lining, keeps kids warm in winter' },
  { name: "Men's Cargo Pants", category: 'Clothing', price: 1199, stock: 105, description: 'Durable cargo pants with multiple pockets, comfortable fit for outdoor and casual wear' },
  { name: "Women's Palazzo Pants", category: 'Clothing', price: 699, stock: 175, description: 'Flowy wide-leg palazzo pants in georgette fabric, stylish and comfortable for daily wear' },
  { name: "Men's Polo T-Shirt", category: 'Clothing', price: 799, stock: 140, description: 'Classic polo collar t-shirt in premium cotton pique, smart casual look for all occasions' },
  { name: "Women's Denim Jacket", category: 'Clothing', price: 1799, stock: 70, description: 'Trendy denim jacket with button closure, perfect layering piece for casual outfits' },

  // Home & Garden (20)
  { name: 'Prestige Pressure Cooker 5L', category: 'Home & Garden', price: 1799, stock: 60, description: 'Stainless steel pressure cooker for fast cooking of rice, dal, vegetables and meat' },
  { name: 'Cotton Bed Sheet King Size', category: 'Home & Garden', price: 899, stock: 120, description: 'Soft 100% cotton bed sheet with two pillow covers, 300 thread count for comfortable sleep' },
  { name: 'Wooden Dining Table 6 Seater', category: 'Home & Garden', price: 24999, stock: 10, description: 'Solid sheesham wood dining table with 6 chairs, durable and elegant for dining room' },
  { name: 'Milton Water Bottle 1L', category: 'Home & Garden', price: 349, stock: 200, description: 'Insulated stainless steel water bottle that keeps liquids hot or cold for 24 hours' },
  { name: 'Garden Soil Mix 10kg', category: 'Home & Garden', price: 499, stock: 80, description: 'Premium potting soil mix with fertilizer for indoor plants, outdoor garden and terrace farming' },
  { name: 'Wooden Bookshelf 5 Tier', category: 'Home & Garden', price: 3999, stock: 25, description: 'Space saving 5 tier wooden bookshelf for books, decoratives and home organization' },
  { name: 'Non-Stick Cookware Set 5pcs', category: 'Home & Garden', price: 2499, stock: 45, description: 'Complete non-stick pan and pot set for everyday Indian cooking, easy to clean' },
  { name: 'Curtains Blackout 2 Panels', category: 'Home & Garden', price: 1299, stock: 70, description: 'Room darkening blackout curtains for bedroom, blocks sunlight and reduces noise' },
  { name: 'Indoor Plant Money Plant', category: 'Home & Garden', price: 299, stock: 150, description: 'Easy to grow money plant for home and office decoration, brings good luck and purifies air' },
  { name: 'Wall Clock Wooden Antique', category: 'Home & Garden', price: 999, stock: 55, description: 'Decorative wooden wall clock with antique finish, silent quartz movement for living room' },
  { name: 'Sofa Couch 3 Seater', category: 'Home & Garden', price: 18999, stock: 8, description: 'Comfortable fabric sofa with foam cushioning, modern design for living room relaxation' },
  { name: 'Kitchen Storage Container Set', category: 'Home & Garden', price: 799, stock: 90, description: 'Airtight plastic storage containers for kitchen pantry organization of rice, flour and spices' },
  { name: 'Bamboo Floor Mat', category: 'Home & Garden', price: 1499, stock: 40, description: 'Eco-friendly bamboo floor mat for bathroom, kitchen and entrance, anti-slip base' },
  { name: 'LED Ceiling Light 24W', category: 'Home & Garden', price: 899, stock: 75, description: 'Bright energy saving LED ceiling light for bedroom and living room, warm white light' },
  { name: 'Bathroom Accessories Set', category: 'Home & Garden', price: 1199, stock: 50, description: 'Complete bathroom set with soap dispenser, toothbrush holder, tumbler and soap dish' },
  { name: 'Balcony Garden Planter Pots', category: 'Home & Garden', price: 599, stock: 100, description: 'Set of 5 colorful plastic planter pots for balcony and terrace gardening' },
  { name: 'Memory Foam Pillow', category: 'Home & Garden', price: 1299, stock: 65, description: 'Orthopedic memory foam pillow for neck and back support, perfect for good sleep posture' },
  { name: 'Stainless Steel Dinner Set 24pcs', category: 'Home & Garden', price: 2199, stock: 35, description: 'Complete stainless steel dinner set with plates, bowls and spoons for family dining' },
  { name: 'Doormat Anti Slip', category: 'Home & Garden', price: 399, stock: 130, description: 'Heavy duty rubber doormat with anti-slip bottom, absorbs dirt and moisture at entrance' },
  { name: 'Study Table with Drawer', category: 'Home & Garden', price: 4999, stock: 20, description: 'Compact wooden study table with storage drawer for students and home office work' },

  // Sports & Fitness (20)
  { name: 'Yoga Mat Non Slip 6mm', category: 'Sports', price: 799, stock: 100, description: 'Premium non-slip yoga mat with carrying strap, ideal for yoga, pilates and floor exercises' },
  { name: 'Dumbbell Set 10kg Pair', category: 'Sports', price: 1299, stock: 60, description: 'Cast iron dumbbell set for home gym workout, strength training and muscle building' },
  { name: 'Cricket Bat Kashmir Willow', category: 'Sports', price: 1499, stock: 45, description: 'Full size Kashmir willow cricket bat for amateur and club level cricket players' },
  { name: 'Football Nike Strike', category: 'Sports', price: 1999, stock: 55, description: 'Official size 5 football with high visibility design, machine stitched for durability' },
  { name: 'Badminton Racket Yonex', category: 'Sports', price: 2499, stock: 40, description: 'Lightweight Yonex badminton racket with isometric head for powerful smashes and control' },
  { name: 'Cycling Helmet Adult', category: 'Sports', price: 1299, stock: 50, description: 'Lightweight ventilated cycling helmet with adjustable fit for road and mountain biking safety' },
  { name: 'Resistance Bands Set 5pcs', category: 'Sports', price: 699, stock: 120, description: 'Set of 5 resistance bands with different tension levels for stretching and strength training' },
  { name: 'Protein Whey Powder 1kg', category: 'Sports', price: 1899, stock: 75, description: 'Chocolate flavored whey protein powder for muscle recovery and building after gym workout' },
  { name: 'Treadmill Motorized 2HP', category: 'Sports', price: 29999, stock: 12, description: 'Home treadmill with 2HP motor, LCD display, multiple speed settings for cardio workout' },
  { name: 'Swimming Goggles Anti Fog', category: 'Sports', price: 599, stock: 90, description: 'Anti fog UV protection swimming goggles with adjustable strap for pool and open water' },
  { name: 'Skipping Rope Speed Cable', category: 'Sports', price: 399, stock: 150, description: 'Speed jumping rope with ball bearings for fast rotation, ideal for cardio and boxing training' },
  { name: 'Gym Gloves Weight Lifting', category: 'Sports', price: 499, stock: 110, description: 'Padded gym gloves with wrist support for weight lifting, pull-ups and strength training' },
  { name: 'Tennis Racket Beginners', category: 'Sports', price: 1799, stock: 35, description: 'Lightweight aluminum tennis racket for beginners and recreational players, includes cover' },
  { name: 'Ankle Support Brace Pair', category: 'Sports', price: 599, stock: 80, description: 'Elastic ankle support brace for injury prevention and recovery during sports and running' },
  { name: 'Basketball Spalding Size 7', category: 'Sports', price: 2499, stock: 30, description: 'Official size 7 indoor outdoor basketball with deep channel design for better grip' },
  { name: 'Foam Roller Exercise', category: 'Sports', price: 899, stock: 65, description: 'High density foam roller for muscle recovery, myofascial release and stretching after workout' },
  { name: 'Sports Water Bottle 750ml', category: 'Sports', price: 449, stock: 140, description: 'BPA free squeeze sports water bottle with straw for gym, cycling and outdoor activities' },
  { name: 'Pull Up Bar Doorframe', category: 'Sports', price: 1299, stock: 55, description: 'No screw doorframe pull up bar for home gym, supports chin-ups and body weight exercises' },
  { name: 'Volleyball Set with Net', category: 'Sports', price: 1999, stock: 28, description: 'Complete volleyball set with ball and net for beach and indoor recreational play' },
  { name: 'Cycling Gloves Padded', category: 'Sports', price: 699, stock: 70, description: 'Half finger cycling gloves with gel padding for comfort on long road and mountain bike rides' },

  // Food & Grocery (20)
  { name: 'Basmati Rice Premium 5kg', category: 'Food', price: 599, stock: 200, description: 'Long grain aged Basmati rice with rich aroma, perfect for biryani, pulao and everyday cooking' },
  { name: 'Cold Pressed Coconut Oil 1L', category: 'Food', price: 499, stock: 120, description: 'Pure virgin cold pressed coconut oil for cooking, hair care and skin moisturizing' },
  { name: 'Organic Green Tea 100 bags', category: 'Food', price: 349, stock: 180, description: 'Natural organic green tea with antioxidants for weight loss, immunity and metabolism boost' },
  { name: 'Almonds Raw Premium 500g', category: 'Food', price: 499, stock: 150, description: 'California raw almonds rich in protein, vitamin E and healthy fats for daily snacking' },
  { name: 'Honey Raw Organic 500g', category: 'Food', price: 399, stock: 130, description: 'Pure raw organic honey with natural enzymes, antioxidants and antibacterial properties' },
  { name: 'Oats Quaker 1kg', category: 'Food', price: 249, stock: 200, description: 'Whole grain rolled oats for healthy breakfast, high in fiber and protein for weight management' },
  { name: 'Dark Chocolate 70% Cocoa', category: 'Food', price: 299, stock: 160, description: 'Premium dark chocolate with 70% cocoa content, rich antioxidants and intense flavor' },
  { name: 'Protein Granola Bar Pack 6', category: 'Food', price: 349, stock: 140, description: 'High protein granola bars with nuts and seeds, healthy snack for gym and on the go' },
  { name: 'Apple Cider Vinegar 500ml', category: 'Food', price: 299, stock: 110, description: 'Raw unfiltered apple cider vinegar with mother for digestion, weight loss and immunity' },
  { name: 'Peanut Butter Crunchy 1kg', category: 'Food', price: 449, stock: 125, description: 'Natural crunchy peanut butter high in protein, no added sugar for gym and healthy eating' },
  { name: 'Chia Seeds Organic 250g', category: 'Food', price: 299, stock: 145, description: 'Organic chia seeds rich in omega-3, fiber and protein for smoothies and healthy recipes' },
  { name: 'Turmeric Powder Organic 200g', category: 'Food', price: 199, stock: 170, description: 'Pure organic turmeric powder with high curcumin content for cooking and health benefits' },
  { name: 'Cashews Roasted Salted 250g', category: 'Food', price: 349, stock: 135, description: 'Premium roasted and salted cashews for snacking, cooking and gifting' },
  { name: 'Multivitamin Tablets 60pcs', category: 'Food', price: 599, stock: 95, description: 'Complete daily multivitamin with vitamins and minerals for energy, immunity and overall health' },
  { name: 'Olive Oil Extra Virgin 500ml', category: 'Food', price: 699, stock: 100, description: 'Cold pressed extra virgin olive oil from Mediterranean olives for cooking and salad dressing' },
  { name: 'Black Pepper Whole 100g', category: 'Food', price: 149, stock: 190, description: 'Whole black pepper corns with strong aroma and flavor for grinding fresh in cooking' },
  { name: 'Dates Medjool Premium 500g', category: 'Food', price: 599, stock: 85, description: 'Soft and sweet Medjool dates rich in natural energy, iron and fiber for healthy snacking' },
  { name: 'Green Coffee Beans 250g', category: 'Food', price: 449, stock: 75, description: 'Raw unroasted green coffee beans for weight loss, metabolism boost and antioxidants' },
  { name: 'Flaxseeds Golden 500g', category: 'Food', price: 249, stock: 155, description: 'Organic golden flaxseeds rich in omega-3 fatty acids and lignans for heart and gut health' },
  { name: 'Moringa Powder Organic 100g', category: 'Food', price: 299, stock: 115, description: 'Pure organic moringa leaf powder superfood with vitamins, minerals and antioxidants' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    await Product.deleteMany({});
    console.log('Cleared existing products');

    console.log('Generating embeddings for 100 products... (this takes 3-5 mins)');

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const text = `${p.name} ${p.category} ${p.description}`;
      const embedding = await generateEmbedding(text);
      await Product.create({ ...p, embedding });
      console.log(`✅ ${i + 1}/100: ${p.name}`);
    }

    console.log('\n🎉 100 real products seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seedDatabase();