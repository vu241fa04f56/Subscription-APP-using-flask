# Subspace Platform

A smart professional connection and collaboration platform with subscription management, real-time chat, geo-location matching, and Razorpay payments.

## Features

- **Auth**: Email/password, Phone OTP, Google OAuth, JWT refresh tokens
- **Smart Matching**: Cosine similarity matching based on interests & skills
- **Nearby Discovery**: Geospatial search using MongoDB 2dsphere index
- **Real-time Chat**: WebSocket-powered messaging via Flask-SocketIO
- **Subscriptions**: 3-tier plans (Basic/Pro/Elite) with Razorpay integration
- **Admin Panel**: Dashboard, user management, payment tracking
- **Email Notifications**: SendGrid-powered transactional emails
- **Invoice Generation**: PDF invoices via ReportLab
- **Background Scheduler**: Auto-expiry and renewal reminders via APScheduler
- **Docker**: Full containerized deployment with Nginx reverse proxy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Flask, Flask-SocketIO |
| Database | MongoDB 7, PyMongo |
| Cache | Redis |
| Auth | JWT (Flask-JWT-Extended), bcrypt |
| Payments | Razorpay |
| Email | SendGrid |
| SMS | Twilio |
| Matching | Cosine similarity (custom) |
| Frontend | Vanilla HTML/CSS/JS |
| Infra | Docker, Nginx, GitHub Actions |

## Quick Start

```bash
# 1. Clone and configure
cp backend/.env.example .env.production
# Edit .env.production with your credentials

# 2. Start all services
make build
make up

# 3. Seed admin user
make seed

# 4. Open
# Frontend: http://localhost:5500
# Backend API: http://localhost:5000/api
# Admin: http://localhost:5500/admin.html
```

## API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth (Email) | `POST /api/auth/email/register`, `/login`, `/send-otp`, `/verify-otp` |
| Auth (Phone) | `POST /api/auth/phone/send-otp`, `/verify-otp` |
| Auth (Google) | `POST /api/auth/google/login` |
| Users | `GET/PUT /api/users/profile`, `POST /api/users/avatar` |
| Subscriptions | `GET /api/subscriptions/plans`, `POST /api/subscriptions/subscribe/:id` |
| Payments | `POST /api/payments/create-order`, `/verify` |
| Chat | `GET/POST /api/chat/conversations`, `/messages` |
| Discover | `GET /api/discover/matches`, `/nearby` |
| Admin | `POST /api/admin/login`, `GET /api/admin/dashboard` |
| Notifications | `GET /api/notifications/` |
| Location | `POST /api/location/update` |

## Environment Variables

See `backend/.env.example` for full list of required environment variables.

## Deployment

```bash
# Production deployment
bash scripts/deploy.sh

# Backup data
bash scripts/backup.sh
```

## License

MIT — see LICENSE for details.
