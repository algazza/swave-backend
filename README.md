To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

open http://localhost:3000

## Dashboard API Documentation

Base URL:

```txt
/api/dashboard
```

Authentication:

- Requires `Authorization: Bearer <token>`
- Admin-only endpoints (`verifyToken` + `verifyAdmin`)

---

### 1) Get Dashboard Overview

Endpoint:

```http
GET /api/dashboard/overview
```

Query Parameters:

- `days` (optional, number): trend range in days. Default `30`, max `365`
- `lowStockThreshold` (optional, number): low stock limit for variants. Default `10`

Success Response (`200`):

```json
{
  "success": true,
  "data": {
    "summary": {
      "total_revenue": 1200000,
      "total_order": 125,
      "pending_order": 14,
      "completed_order": 90,
      "total_customer": 88,
      "total_product": 45,
      "low_stock_count": 6
    },
    "sales_trend": [
      {
        "date": "2026-02-01",
        "checkout": 4,
        "revenue": 250000
      }
    ],
    "order_status_breakdown": [
      {
        "status": "pending",
        "count": 14
      },
      {
        "status": "success",
        "count": 90
      }
    ],
    "payment_status_breakdown": [
      {
        "status": "paid",
        "count": 92
      },
      {
        "status": "pending",
        "count": 20
      }
    ],
    "top_products": [
      {
        "id": 1,
        "name": "Classic Bracelet",
        "slug": "classic-bracelet",
        "category": "Bracelet",
        "image_path": "/images/topinya-noel/bracelet.jpg",
        "sold_quantity": 40,
        "revenue": 800000
      }
    ],
    "low_stock_variants": [
      {
        "id": 4,
        "variant": "Gold",
        "stock": 3,
        "price": 150000,
        "product_id": 1,
        "product_name": "Classic Bracelet",
        "product_slug": "classic-bracelet"
      }
    ],
    "recent_orders": [
      {
        "order_id": "SW-20260225-001",
        "created_at": "2026-02-25T10:30:00.000Z",
        "customer_name": "Jane Doe",
        "customer_username": "jane",
        "delivery_type": "delivery",
        "total_price": 200000,
        "total_item": 2,
        "order_status": "processing",
        "payment_status": "paid"
      }
    ]
  }
}
```

---

### 2) Get Checkout Chart

Endpoint:

```http
GET /api/dashboard/chart-checkout
```

Query Parameters:

- `days` (optional, number): chart range in days. Default `30`, max `365`

Success Response (`200`):

```json
{
  "success": true,
  "data": [
    {
      "date": "2026-02-20",
      "checkout": 3
    },
    {
      "date": "2026-02-21",
      "checkout": 6
    }
  ]
}
```

Error Response (`500`):

```json
{
  "success": false,
  "message": "Internal server error"
}
```
