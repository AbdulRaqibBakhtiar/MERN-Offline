# StockMaster Hub

**A full-stack marketplace and inventory management platform built with the MERN stack.**

StockMaster Hub is a portfolio project that combines a community marketplace, inventory listings, order management, articles, user authentication, and real-time communication in one web application.

The project demonstrates practical full-stack development, including REST APIs, database integration, role-based permissions, media uploads, and real-time features.

**Project status:** Locally runnable portfolio project. No public live demo is currently available.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [Roles and Permissions](#roles-and-permissions)
- [Order Workflow](#order-workflow)
- [Security and Limitations](#security-and-limitations)
- [Troubleshooting](#troubleshooting)
- [Future Improvements](#future-improvements)
- [Author](#author)

## Overview

StockMaster Hub brings together marketplace functionality and community content in a single application.

Users can explore product listings, review item details, communicate with sellers, and submit order requests. Registered users can also manage their listings and participate in the platform's publishing and communication features, subject to their permissions.

The application is designed to demonstrate how a React frontend, an Express backend, MongoDB persistence, and real-time communication can work together as a full-stack system.

## Features

### Marketplace

- Browse and search product listings.
- View listing details, photos, videos, stock information, seller information, specifications, and reviews.
- Create and manage personal listings.
- Submit order requests to sellers.
- View buyer order history and seller incoming orders.
- Support administrative listing management.

### Inventory and Order Management

- Track available stock through marketplace order workflows.
- Reserve available stock when an order request is submitted.
- Accept or cancel pending requests.
- Mark accepted orders as fulfilled.
- Return reserved stock when a pending request is cancelled.

### Authentication and Access Control

- User registration and login.
- JWT-based authentication.
- Password hashing with bcrypt.
- Role-based permissions for administrative and editorial functionality.
- Password recovery through email when the required Resend configuration is available.

### Real-Time Communication

- Real-time chat powered by Socket.IO.
- Marketplace refresh events.
- Peer-to-peer audio/video communication features with a conservative four-participant limit.

### Articles and Community Content

- Publish and manage articles according to user permissions.
- Support author, editor, and administrator workflows.
- Upload supported media for relevant product, news, and article features.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, React Router |
| Styling and UI | CSS, Lucide React |
| HTTP communication | Axios |
| Backend | Node.js, Express 5 |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Tokens, bcrypt |
| Real-time features | Socket.IO |
| Media uploads | Multer |
| Audio visualization | WaveSurfer.js |
| Development server | Create React App, Nodemon |

## Architecture

The project is organized into separate client and server applications.

```text
StockMaster Hub
│
├── client/
│   ├── React application
│   ├── User interface and navigation
│   ├── API communication
│   └── Socket.IO client
│
├── server/
│   ├── Express application
│   ├── REST API
│   ├── Authentication and permissions
│   ├── Mongoose database models
│   ├── Media upload handling
│   └── Socket.IO server
│
├── package.json
├── package-lock.json
└── README.md
```

**Request flow:**

1. The user interacts with the React frontend.
2. The frontend communicates with the Express API.
3. The backend validates requests and applies authentication and permission rules.
4. Mongoose reads or writes data in MongoDB.
5. Socket.IO handles supported real-time communication and update events.

## Getting Started

### Prerequisites

Install the following on your computer:

- [Node.js](https://nodejs.org/) and npm.
- [MongoDB Community Server](https://www.mongodb.com/try/download/community), running locally.
- [Git](https://git-scm.com/).

You should also be comfortable using a terminal or command prompt.

### 1. Clone the repository

```bash
git clone https://github.com/AbdulRaqibBakhtiar/MERN-Offline.git
cd MERN-Offline
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure the backend environment

Copy the example environment file.

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On macOS or Linux:

```bash
cp .env.example .env
```

Open `server/.env` and configure the values for local development. See [Environment Configuration](#environment-configuration).

### 4. Install frontend dependencies

Open a second terminal in the project root and run:

```bash
cd client
npm install
```

## Environment Configuration

The backend reads its configuration from `server/.env`. Never commit this file or publish real credentials.

The following example illustrates a local development configuration using the environment variables defined by the backend.

```dotenv
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/stockmaster_hub
JWT_SECRET=replace-with-a-unique-random-secret-of-at-least-32-characters

CORS_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000
TRUST_PROXY=false

RESEND_API_KEY=
AUTH_EMAIL_FROM=

ADMIN_USERNAMES=
EDITOR_USERNAMES=
AUTHOR_USERNAMES=

TURN_URLS=
TURN_SHARED_SECRET=
```

**Important configuration notes:**

- `MONGO_URI`: Connects Mongoose to your local MongoDB database. The database name shown above is an example for a fresh development database.
- `JWT_SECRET`: Replace the placeholder with a strong, randomly generated secret. Never reuse a published example secret.
- `PORT`: The backend port; the project's development setup uses port `5000`.
- `CORS_ORIGINS`: Set this to the exact frontend origin used in your browser.
- `CLIENT_APP_URL`: Set this to your local frontend URL for supported account-recovery links.
- `TRUST_PROXY`: Keep this disabled for direct local development. Enable it only when the application is behind a trusted, correctly configured reverse proxy.
- `RESEND_API_KEY` and `AUTH_EMAIL_FROM`: Configure these with valid Resend credentials and a verified sending domain to enable password-recovery email.
- `ADMIN_USERNAMES`, `EDITOR_USERNAMES`, and `AUTHOR_USERNAMES`: Optional comma-separated username lists for role assignment.
- `TURN_URLS` and `TURN_SHARED_SECRET`: Optional configuration for a compatible TURN server used by peer-to-peer calling features. The shared secret belongs on the server, never in the frontend.

If your local frontend or backend uses a different address or port, adjust the relevant configuration accordingly.

### Frontend API configuration

The frontend supports the `REACT_APP_API_BASE_URL` environment variable when the backend is not reachable at the browser's current hostname on port `5000`.

If needed, create `client/.env` and configure the API base URL:

```dotenv
REACT_APP_API_BASE_URL=http://localhost:5000
```

Restart the frontend after changing environment variables.

## Running the Application

### Start the backend

In a terminal:

```bash
cd server
npm run dev
```

The development script uses Nodemon to run `server.js`.

### Start the frontend

In a separate terminal:

```bash
cd client
npm start
```

The React development server will start. Open the local URL displayed in the terminal, normally `http://localhost:3000`.

Keep MongoDB running while using the application.

To create a production build of the frontend:

```bash
cd client
npm run build
```

The frontend also defines the standard Create React App test command:

```bash
cd client
npm test
```

The backend's current `npm test` script is a placeholder and does not run an implemented test suite.

## Roles and Permissions

StockMaster Hub supports permission-based workflows for marketplace and editorial functionality.

| Role | Purpose |
|---|---|
| Administrator | Administrative listing management and higher-level permissions |
| Editor | Editorial workflow and content management |
| Author | Authoring and management of permitted content |
| Regular user | Standard authenticated marketplace and application functionality |

The administrator, editor, and author username lists are configured through the backend environment variables.

Accounts must register first. Configured role assignments take effect on the user's next login. The administrator role takes precedence when multiple roles are configured.

Actual permissions are enforced by the application; the table above is a high-level overview rather than an exhaustive permission matrix.

## Order Workflow

The marketplace implements an order-request workflow:

1. A buyer selects a listing and submits an order request.
2. Available stock is reserved for the request.
3. The seller can accept or cancel the pending request.
4. An accepted order can subsequently be marked as fulfilled.
5. Cancelling a pending request returns its reserved stock.

**Payment processing is not implemented.** An order request represents a marketplace workflow, not a completed financial transaction.

## Security and Limitations

This project is intended for learning, demonstration, and portfolio purposes. It should not be treated as a production-ready commercial service without further testing and operational preparation.

### Security considerations

- Keep `.env` files, secrets, and credentials out of source control.
- Use strong, unique JWT secrets.
- Restrict CORS to the frontend origins you actually trust.
- Keep MongoDB protected and use appropriate database permissions.
- Do not upload private documents to publicly served marketplace media storage.
- Review authentication, authorization, rate limiting, file validation, and error handling before any public deployment.
- If using a reverse proxy, configure proxy trust only for infrastructure you control.
- Production deployment requires appropriate HTTPS, persistent media storage, backups, monitoring, and operational safeguards.

### Current limitations

- No public live demo is currently available.
- Marketplace checkout does not process card or bank payments.
- The application does not arrange shipping or delivery.
- Password recovery requires external email-service configuration.
- Reliable peer-to-peer calling across restrictive networks may require a properly configured TURN server.
- The peer-to-peer calling limit is a conservative portfolio setting, not a verified production capacity guarantee.
- The backend test script is not yet an implemented automated test suite.
- Local uploads and database records depend on the local development environment and are not automatically backed up to the cloud.

Never enter real payment details into demonstration-only checkout fields.

## Troubleshooting

### MongoDB connection errors

- Confirm that the MongoDB service is running.
- Verify `MONGO_URI` in `server/.env`.
- Check that the connection string and database address are correct.
- Review the backend terminal for connection errors.

### Frontend cannot reach the backend

- Confirm that the backend is running on the expected port.
- Verify the frontend API base URL if you configured one.
- Check `CORS_ORIGINS` against the exact origin shown in the browser.
- Inspect the browser's developer console and network requests.

### Password recovery does not send email

- Verify the Resend API key.
- Confirm that the sender address belongs to a verified sending domain.
- Check `CLIENT_APP_URL` and the backend logs.
- Remember that recovery remains unavailable until the necessary email configuration is supplied.

### Uploaded media does not display

- Confirm that the backend accepts the file type and size.
- Verify that the upload completed successfully.
- Check the media URL and browser network response.
- Ensure that uploaded files still exist in the configured storage location.

## Future Improvements

Potential next steps for the project include:

- Add comprehensive automated tests for authentication, listings, and order workflows.
- Improve application logging and error reporting.
- Add more detailed inventory and sales reporting.
- Strengthen deployment documentation and production configuration.
- Add a publicly accessible demo when suitable hosting becomes available.
- Add screenshots and a recorded product walkthrough to the portfolio documentation.

## Author

**Abdul Raqib Bakhtiar**

Computer Science graduate and full-stack development enthusiast.

- **GitHub:** [@AbdulRaqibBakhtiar](https://github.com/AbdulRaqibBakhtiar)
- **Project repository:** [MERN-Offline — StockMaster Hub](https://github.com/AbdulRaqibBakhtiar/MERN-Offline)

---

*StockMaster Hub is a portfolio project demonstrating full-stack web development with the MERN stack.*
