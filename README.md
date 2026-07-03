# 🛒 High-Performance E-Commerce Engine with AI Vector Search

A full-stack e-commerce platform built with **React**, **Node/Express**, **MongoDB**, and **Redis** — featuring AI-powered vector search, real-time SSE notifications, and a robust caching layer.

---

## ✨ Features

| Layer | Highlights |
|---|---|
| **Auth** | JWT Bearer tokens, bcrypt password hashing, role-based access (`user` / `admin`) |
| **Products** | Full CRUD, category/price filtering, pagination, Redis-cached responses |
| **AI Search** | Vector embeddings via `@xenova/transformers`; semantic product search |
| **Cart** | Per-user cart with Redis invalidation on every mutation |
| **Orders** | Place, view, cancel orders; admin status management with real-time push |
| **Reviews** | Star ratings, comments, helpful-vote with Redis debounce (1 vote/IP/hour) |
| **Notifications** | **Server-Sent Events (SSE)** — push order status updates to buyers in real time |
| **Trending** | Redis sorted-set view tracker → `GET /api/stats/trending` |
| **Coupons** | Percentage & fixed discount codes with expiry |
| **Chatbot** | AI-powered product assistant |
| **Stats** | Product & order analytics with Redis caching; health-check endpoint |
| **Rate Limiting** | Global 100 req/15 min; stricter 10 req/15 min on auth routes |

---

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Lucide React
- **Backend**: Node.js, Express 5
- **Database**: MongoDB + Mongoose
- **Cache / Pub-Sub**: Redis 6 (`redis` npm client)
- **AI**: `@xenova/transformers` (ONNX-runtime, runs locally — no OpenAI key needed)
- **Auth**: `jsonwebtoken`, `bcryptjs`

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB (local or Atlas)
- Redis (local or Upstash)

### Server
```bash
cd server
cp .env.example .env   # fill in MONGO_URI, REDIS_URL, JWT_SECRET
npm install
npm run dev            # nodemon on port 5000
```

### Client
```bash
cd client
npm install
npm run dev            # Vite on port 5173
```

---

## 📡 API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login, returns JWT |

### Products
| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List with filters, sort, pagination (Redis cached) |
| GET | `/api/products/:id` | Single product (Redis cached 1 h) |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product (invalidates cache) |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/:id/recommendations` | AI vector-similar products |

### Cart (🔐 Auth required)
| Method | Path | Description |
|---|---|---|
| GET | `/api/cart` | Get current user's cart |
| POST | `/api/cart/add` | Add item `{ productId, quantity }` |
| PUT | `/api/cart/update` | Update quantity `{ productId, quantity }` |
| DELETE | `/api/cart/remove` | Remove item `{ productId }` |
| DELETE | `/api/cart/clear/:userId` | Clear entire cart |

### Orders (🔐 Auth required)
| Method | Path | Description |
|---|---|---|
| POST | `/api/orders` | Place order |
| GET | `/api/orders` | My orders |
| GET | `/api/orders/:id` | Single order |
| PATCH | `/api/orders/:id/cancel` | Cancel pending order |
| PATCH | `/api/orders/:id/status` | 🛡️ **Admin**: update status (triggers SSE push) |
| GET | `/api/orders/admin/all` | 🛡️ **Admin**: paginated order list |

### Reviews
| Method | Path | Description |
|---|---|---|
| POST | `/api/reviews` | Post a review |
| GET | `/api/reviews/:productId` | Get reviews + avg rating |
| PATCH | `/api/reviews/:id/helpful` | Mark helpful (Redis debounce) |
| DELETE | `/api/reviews/:id` | Delete review |

### Notifications (🔐 Auth via `?token=`)
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications/stream` | Open SSE stream for real-time events |
| GET | `/api/notifications/online` | Active connection count |

### Stats
| Method | Path | Description |
|---|---|---|
| GET | `/api/stats/products` | Category & price analytics (cached 5 min) |
| GET | `/api/stats/orders` | Revenue & status breakdown (cached 2 min) |
| GET | `/api/stats/trending` | Top products by view count (`?days=7&limit=10`) |
| POST | `/api/stats/track-view/:productId` | Record a product page view |
| GET | `/api/stats/health` | Uptime, memory, Redis connectivity |

### Search & Other
| Method | Path | Description |
|---|---|---|
| GET | `/api/search` | AI vector search |
| GET | `/api/chatbot` | Product chatbot |
| GET | `/api/wishlist` | Manage wishlist |
| GET | `/api/coupons` | Coupon management |

---

## 🔔 Real-Time Notifications (SSE)

Connect once per session with:

```js
const es = new EventSource(
  `http://localhost:5000/api/notifications/stream?token=${jwt}`
);

es.addEventListener('order_update', (e) => {
  const { orderId, status, message } = JSON.parse(e.data);
  showToast(message);
});

es.addEventListener('connected', () => console.log('SSE live'));
```

The server sends a `: heartbeat` comment every 25 s to keep proxies from closing the connection.

---

## 📈 Trending Products

Every product page view should call:
```
POST /api/stats/track-view/:productId
```

Then fetch the leaderboard:
```
GET /api/stats/trending?days=7&limit=10
```

View counts are stored in daily Redis sorted sets (`trending:views:YYYY-MM-DD`) and automatically expire after 7 days.