# AI Inventory Insights

An **AI-powered inventory and sales analytics platform** built with Next.js 16. Chat with an AI agent to query your sales data, monitor inventory levels, manage products, record sales, and automate restock orders — all in real time.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, shadcn/ui, Tailwind CSS v4 |

| **Data Fetching** | TanStack React Query v5 |
| **Database** | SQLite via better-sqlite3 |
| **ORM** | Drizzle ORM |
| **AI SDK** | Vercel AI SDK v6 (ToolLoopAgent) |
| **AI Provider** | Groq (default), Ollama (optional) |
| **AI Model** | Llama 3.3 70B (configurable) |
| **Forms** | react-hook-form + Zod |
| **Markdown** | react-markdown + remark-gfm |
| **Icons** | Lucide React |

## Features

### AI Sales Analyst Agent
Natural-language chat interface with a resizable side panel. The agent queries your live data using **16 tools**:
- Sales summaries grouped by product, category, day, week, month
- Top-performing products by revenue
- Low-stock inventory alerts with configurable threshold
- Period-over-period sales comparison
- Category breakdown and product search
- Full inventory summaries
- **Single & bulk restock orders** — propose, confirm, and track
- **Order fulfillment** — propose and confirm, auto-updates product stock

### Dashboard
KPI cards showing total revenue, total sales, top product, and low stock count. Quick-action chat panel always available.

### Products
Full CRUD for products with stock levels, prices, and categories. Low-stock items highlighted in red with a badge. Edit and delete with confirmation dialogs.

### Sales
Transaction history with date range and category filters. Click any sale to expand and view individual items. Record new sales (multi-item form with product select) or delete existing ones — stock is adjusted automatically.

### Restock Orders
Track all orders with statuses: pending, ordered, received, fulfilled, cancelled. Fulfill orders to add quantity back to product stock. Delete orders with protection against fulfilled deletions.

### Chat History
All conversations persisted in SQLite. Start a new chat, pick up where you left off, or browse past analyses. Chat titles are editable inline.

### Dark Mode
Full light/dark theme support via CSS custom properties. Respects system preference.

## Architecture

```
src/
├── app/
│   ├── api/
│   │   ├── chat/              # AI agent endpoint (ToolLoopAgent, 16 tools)
│   │   ├── sales/             # Sales list + create + detail + delete
│   │   ├── products/          # Product CRUD
│   │   ├── orders/            # Order CRUD + status updates
│   │   ├── chats/             # Chat history CRUD
│   │   └── dashboard/         # KPI data
│   ├── dashboard/             # Dashboard + Orders page
│   ├── products/              # Product CRUD page
│   ├── sales/                 # Sales history page
│   ├── layout.tsx             # Root layout (Geist fonts, Providers, AppLayout)
│   └── page.tsx               # Redirects to /dashboard
├── components/
│   ├── app-layout.tsx         # Resizable 3-column layout (nav + content + chat)
│   ├── providers.tsx          # TanStack Query provider
│   ├── chat/
│   │   ├── chat-panel.tsx     # Chat sidebar: history, input, messages, quick questions
│   │   └── chat-message.tsx   # Message bubbles with markdown
│   ├── dashboard/
│   │   ├── nav.tsx            # Top navigation bar
│   │   └── kpi-cards.tsx      # KPI card grid with loading skeletons
│   ├── products/
│   │   └── product-table.tsx  # Read-only product table
│   ├── sales/
│   │   └── sales-table.tsx    # Filterable sales table with expandable rows
│   └── ui/                    # shadcn/ui primitives (10 components)
├── db/
│   ├── schema.ts              # Drizzle schema (6 tables)
│   ├── queries.ts             # 31 query/command functions
│   ├── index.ts               # SQLite connection (WAL mode, foreign keys)
│   └── seed.ts                # Demo data (22 products, Jan–Jun 2026 sales)
├── hooks/
│   ├── use-dashboard.ts       # Dashboard KPIs query
│   ├── use-products.ts        # Products CRUD queries + mutations
│   ├── use-sales.ts           # Sales list + create + delete
│   ├── use-sale-detail.ts     # Single sale detail
│   ├── use-orders.ts          # Orders CRUD + fulfill
│   └── use-chats.ts           # Chat CRUD
├── lib/
│   ├── ai-tools.ts            # 16 AI tool definitions
│   ├── cache-invalidation.ts  # Mutation-to-cache-key mapping
│   └── utils.ts               # cn(), formatCurrency(), formatDate()
└── types/
    ├── chat.ts                # Chat interface
    ├── db.ts                  # Product, Order, SaleItem, SaleDetail, InventorySummary
    └── inventory.ts           # Duplicate Product + InventorySummary types
```

### Database Schema

- **products** — `id`, `name`, `category`, `price`, `stock`, `created_at`
- **sales** — `id`, `created_at`, `total`
- **sale_items** — `id`, `sale_id`, `product_id`, `quantity`, `unit_price`
- **orders** — `id`, `product_id`, `quantity`, `status` (pending/ordered/received/fulfilled/cancelled), `created_at`
- **chats** — `id`, `title`, `created_at`, `updated_at`
- **chat_messages** — `id`, `chat_id`, `message_id` (unique per chat), `role`, `content`, `created_at`

### AI Tools (16 total)

| Tool | Purpose |
|---|---|
| `get_sales_summary` | Grouped sales by product/category/day/week/month |
| `get_top_products` | Top N products by revenue in a date range |
| `get_low_stock_products` | Products below a stock threshold (default 20) |
| `get_sales_comparison` | Compare two time periods |
| `get_category_breakdown` | Sales breakdown by category |
| `get_sale_detail` | Items inside a specific sale |
| `search_products` | Search by name or category |
| `get_categories` | All product categories |
| `get_inventory_summary` | Total stock value, avg price, item count |
| `get_all_products` | Full product list |
| `propose_restock_order` | Preview a single restock order (no save) |
| `confirm_restock_order` | Create the order after user approval |
| `get_recent_orders` | Recent restock orders with statuses |
| `propose_fulfill_order` | Preview order fulfillment (no save) |
| `confirm_fulfill_order` | Fulfill order & add quantity to product stock |
| `propose_bulk_restock` | Preview multiple restock orders at once |
| `confirm_bulk_restock` | Create all orders after user approval |

### Agent Workflows

**Restock Flow:**
1. Agent calls `get_low_stock_products` to find low items
2. Calls `propose_restock_order` (single) or `propose_bulk_restock` (multi)
3. **Stops** and presents proposal, asks for confirmation
4. On user "confirm" — calls `confirm_restock_order` or `confirm_bulk_restock`
5. On "cancel" — discards

**Fulfill Flow:**
1. Agent calls `get_recent_orders` to find pending/ordered orders
2. Calls `propose_fulfill_order` showing the order + stock impact
3. **Stops** and asks for confirmation
4. On user "confirm" — calls `confirm_fulfill_order` (transitions status to "fulfilled" and adds quantity to product stock)

### Cache Invalidation
Mutation tools (confirm_restock, confirm_bulk_restock, confirm_fulfill) automatically invalidate relevant React Query caches (`orders`, `products`, `dashboard`) so the UI stays in sync after AI-driven changes.

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

Open [http://localhost:3000](http://localhost:3000) — you'll land on the Dashboard with the AI chat panel ready.

### Using Ollama (Optional)

If you prefer a local model, uncomment these in `.env.local`:

```env
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=qwen3.5:4b
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Apply migrations to database |
| `npx drizzle-kit generate` | Generate migration from schema changes |
| `npx tsx src/db/seed.ts` | Seed demo data (22 products, 6 months of sales) |

## Example Chat Queries

- *"What were my top products this quarter?"*
- *"Show me sales by category"*
- *"Which products are low in stock?"*
- *"Compare sales this month vs last month"*
- *"Show me the full inventory summary"*
- *"I want to restock all low stock items"*
- *"Search for electronics products"*
- *"Recent restock orders"*
- *"Fulfill order #3"*
- *"Restock 10 units of every product in Electronics"*
