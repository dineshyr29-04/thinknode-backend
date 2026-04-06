# ThinkNode Backend
Lightweight backend API for the ThinkNode platform. Provides:
- Customer authentication and registration
- Admin authentication and profile
- Order creation (with file upload) and notifications
- Real-time updates via Socket.IO
- Optional admin webhook delivery for new orders

**Tech Stack**
- Node.js + Express
- PostgreSQL (pg)
- Socket.IO
- JWT authentication
- Multer (file uploads)
- Axios (outbound webhook posts)

**Quick Start**
1. Install dependencies

	 npm install

2. Create and configure environment variables (see **Environment**) and start the server

	 npm start

3. Open logs to verify the server started and `GET /health` returns `ok`:

	 curl -v http://localhost:5000/health

**Environment**
- `PORT` - server port (default: `5000`)
- `NODE_ENV` - `development` or `production`
- `DB_HOST` - Postgres host (default: `localhost`)
- `DB_PORT` - Postgres port (default: `5432`)
- `DB_USER` - Postgres user
- `DB_PASSWORD` - Postgres password
- `DB_NAME` - Postgres database name
- `JWT_SECRET` - Secret for signing JWTs
- `ADMIN_WEBHOOK_URL` - Optional HTTPS endpoint to POST new order payloads to admin systems
- `ADMIN_WEBHOOK_HEADERS` - Optional JSON string of headers for the admin webhook (e.g. '{"x-admin-key":"secret"}')
- `CORS_ORIGIN` - (optional) comma-separated list of allowed origins for CORS

Create a `.env` file in the repository root and set the above variables before starting the app.

**Database**
- The project includes `database/schema.sql` to create required tables (admins, customers, services, orders, files, notifications).
- Apply schema to your Postgres instance before running the app:

	 psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f database/schema.sql

Optional seed data is in `database/seed.sql`.

**API Endpoints (summary)**
- Admin
	- `POST /api/admin/register` or `POST /api/admin/signup` — create admin (body: `username`, `email`, `password`)
	- `POST /api/admin/login` — login admin (body: `email`, `password`)
	- `GET /api/admin/profile` — admin profile (protected)
- Customer
	- `POST /api/customer/register` — register customer
	- `POST /api/customer/login` — login customer
	- `GET /api/customer/profile` — get profile (protected)
	- `POST /api/customer/orders` — create order (protected)
- Orders
	- `GET /api/orders` (admin protected)
	- `POST /api/orders` — create order (public route under `/api/orders` used by admin route; customer route is at `/api/customer/orders`)
	- `GET /api/orders/:id` (admin protected)
	- `PATCH /api/orders/:id/status` (admin protected)

Required order fields (JSON or multipart/form-data):
- `customer_name` (string) — or send `Authorization: Bearer <token>` and server will infer
- `email` (string)
- `service_type` (string)
- `project_title` (string)
Optional fields: `description`, `customization` (JSON), `budget`, `deadline`. File uploads use field name `files` (up to 5 files).

**Sockets**
- Client connect: `const socket = io('https://your-backend')`
- Events emitted by server:
	- `new-order` — full order payload when an order is created
	- `notification` — notification payload

**Admin Webhook**
- If `ADMIN_WEBHOOK_URL` is set, the server will POST the created order JSON to this URL. Headers can be set via `ADMIN_WEBHOOK_HEADERS` JSON env var.

**CORS / Private Network Notes**
- If you host frontend on a public origin (e.g. Vercel) you cannot call `http://localhost:5000` from it. Use HTTPS backend or a tunnel (ngrok) for testing.
- Ensure `CORS_ORIGIN` includes your frontend origin. If you use credentials (cookies), `Access-Control-Allow-Origin` must be the exact origin and `Access-Control-Allow-Credentials: true` must be present.

**Testing Examples**
- Create order (JSON):

	curl -X POST https://YOUR_BACKEND/api/customer/orders \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer <token>" \
		-d '{"customer_name":"Jane","email":"jane@example.com","service_type":"web_design","project_title":"Portfolio"}'

- Create order (multipart/form-data with file):

	curl -X POST https://YOUR_BACKEND/api/customer/orders \
		-H "Authorization: Bearer <token>" \
		-F "customer_name=Jane" \
		-F "email=jane@example.com" \
		-F "service_type=web_design" \
		-F "project_title=Portfolio" \
		-F "files=@/path/to/artwork.png"

**Troubleshooting**
- No logs on request: Ensure process is running and port is correct. Check `server.js` and `logger` output.
- CORS errors from deployed frontend: confirm backend is HTTPS and CORS whitelists the frontend origin.
- Socket not receiving events: ensure frontend connects to the same backend socket URL and the server has sockets initialized in `server.js`.
- Webhook not received: ensure `ADMIN_WEBHOOK_URL` is public and reachable; check server logs for webhook POST errors.

**Deployment**
- Use any Node-friendly host (Heroku, Render, DigitalOcean App Platform, AWS, etc.).
- Set environment variables in your host's dashboard and ensure the Postgres DB is accessible from the app.

**Contributing**
- Follow normal Git flow: branch, commit, open PR. Tests and linting are not included by default.

**Files of Interest**
- [app.js](app.js) — Express app and middleware
- [server.js](server.js) — app bootstrap and socket init
- [services/orderService.js](services/orderService.js) — order processing, socket emits, webhook posting
- [routes/customerRoutes.js](routes/customerRoutes.js) and [routes/orderRoutes.js](routes/orderRoutes.js)

If you'd like, I can add a `Makefile`, Dockerfile, or CI workflow to this repo to simplify deploys.