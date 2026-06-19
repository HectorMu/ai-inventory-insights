# AI Inventory Insights

An **AI-powered inventory and sales analytics platform** built with Next.js. Chat with an AI agent to query your sales data, monitor inventory levels, and automate restock orders — all in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, shadcn/ui, Tailwind CSS v4 |
| **Charts** | Recharts |
| **Data Fetching** | TanStack React Query |
| **Database** | SQLite via better-sqlite3 |
| **ORM** | Drizzle ORM |
| **AI** | Vercel AI SDK, Groq (Llama 3.3 70B) |
| **Agent** | ToolLoopAgent with 13 tools |

## Features

### AI Sales Analyst Agent
Natural-language chat interface that queries your data using live tools:
- Sales summaries grouped by product, category, day, week, month
- Top-performing products by revenue
- Low-stock inventory alerts
- Period-over-period sales comparison
- Category breakdown with visual charts
- Product search and inventory summaries
- **Restock order creation** — propose, confirm, and track orders

### Dashboard
KPI cards showing total revenue, total sales, top product, and low stock count.

### Products
Browse all products with stock levels, prices, and categories. Low-stock items are highlighted.

### Sales
Transaction history with date range and category filters. **Click any sale** to expand and view the individual items purchased, quantities, and line totals.

### Restock Orders
Track all restock orders with status: pending, ordered, received, cancelled.

### Chat History
All conversations are persisted — start a new chat, pick up where you left off, or browse past analyses.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/          # AI agent endpoint (ToolLoopAgent)
│   │   ├── sales/         # Sales list + detail (expandable)
│   │   ├── products/      # Product catalog
│   │   ├── orders/        # Restock orders
│   │   ├── chats/         # Chat history CRUD
│   │   └── dashboard/     # KPI data
│   ├── dashboard/         # Dashboard + Chat layout
│   ├── products/          # Product page
│   ├── sales/             # Sales page
│   └── orders/            # Orders page
├── components/
│   ├── chat/              # ChatPanel, ChatSidebar, ChatMessage
│   ├── sales/             # SalesTable with expandable rows
│   ├── products/          # ProductTable
│   ├── dashboard/         # Nav, KPICards
│   └── ui/                # shadcn/ui primitives
├── db/
│   ├── schema.ts          # Drizzle schema (6 tables)
│   ├── queries.ts         # All query functions
│   ├── index.ts           # DB connection
│   └── seed.ts            # Seed script (Jan–Jun 2026 data)
├── hooks/                 # React Query hooks
└── lib/
    ├── ai-tools.ts        # 13 AI tool definitions
    └── utils.ts           # cn(), formatCurrency(), formatDate()
```

### Database Schema

- **products** — id, name, category, price, stock, created_at
- **sales** — id, created_at, total
- **sale_items** — id, sale_id, product_id, quantity, unit_price
- **orders** — id, product_id, quantity, status, created_at
- **chats** — id, title, created_at, updated_at
- **chat_messages** — id, chat_id, role, content, created_at

### AI Tools (13 total)

| Tool | Purpose |
|---|---|
| `get_sales_summary` | Grouped sales by product/category/day/week/month |
| `get_top_products` | Top products by revenue in a date range |
| `get_low_stock_products` | Products below a stock threshold |
| `get_sales_comparison` | Compare two time periods |
| `get_category_breakdown` | Sales breakdown by category |
| `get_sale_detail` | Items inside a specific sale |
| `search_products` | Search by name or category |
| `get_categories` | All product categories |
| `get_inventory_summary` | Total stock value, avg price, item count |
| `get_all_products` | Full product list |
| `propose_restock_order` | Preview a restock order (no save) |
| `confirm_restock_order` | Create the order after user approval |
| `get_recent_orders` | Recent restock orders |

### Agent Restock Flow

1. User asks about low stock items
2. Agent calls `get_low_stock_products` and presents results
3. Agent calls `propose_restock_order` to show what will be created
4. User says "confirm" or "cancel"
5. If confirmed, `confirm_restock_order` inserts the record
6. Orders appear in the Orders page and agent can confirm status

## Getting Started

### Prerequisites

- Node.js 20+
- A Groq API key (free tier at groq.com)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Add your GROQ_API_KEY to .env.local

# 3. Run database migrations
npx drizzle-kit push

# 4. Seed the database with demo data (Jan–Jun 2026)
npx tsx src/db/seed.ts

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and navigate to the Dashboard to start chatting with the AI analyst.

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npx drizzle-kit push` | Apply migrations |
| `npx drizzle-kit generate` | Generate migration from schema changes |
| `npx tsx src/db/seed.ts` | Seed demo data |

## Example Chat Queries

- *"What were my top products this quarter?"*
- *"Show me sales by category"*
- *"Which products are low in stock?"*
- *"Compare sales this month vs last month"*
- *"Show me the full inventory summary"*
- *"I want to restock the low stock items"*
- *"Search for electronics products"*
- *"Recent restock orders"*
