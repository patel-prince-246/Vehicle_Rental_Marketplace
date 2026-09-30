# Vehicle Rental Marketplace Management System

A web-based vehicle rental marketplace built with the MERN stack
(MongoDB, Express.js, React.js, and Node.js). The platform supports
vehicle discovery, rental bookings, customer and vehicle-owner
workflows, and administrative management.

## Project Overview

The system follows a hybrid **C2C and B2C** marketplace model:

-   **C2C:** Individual vehicle owners can list vehicles for rent.
-   **B2C:** Rental agencies can list and manage their vehicles.
-   **Customers:** Browse vehicles, make bookings, and view their rental
    history.
-   **Owners and agencies:** Manage vehicle listings and rental
    activity.
-   **Admin:** Manage platform-level operations, including verification
    workflows.

## Main Features

-   User registration and login with JWT-based authentication
-   Role-based access for customers, owners, agencies, and
    administrators
-   Browse and search available vehicles
-   View vehicle details, pricing, location, and images
-   Create and manage rental bookings
-   Check vehicle availability for requested dates
-   Payment records and simulated payment/refund workflow
-   Vehicle verification status
-   Customer reviews and ratings
-   Notifications and user dashboards

> Feature availability may depend on the current implementation. Licence
> upload/approval, email delivery, and complete end-to-end testing may
> still require implementation or verification.

## Technology Stack

### Frontend

-   React.js
-   Vite
-   React Router
-   Axios
-   Lucide React

### Backend

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JSON Web Tokens (JWT)

## Project Structure

``` text
Vehicle_Rental_Marketplace/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   └── services/
    ├── package.json
    └── ...
```

## Prerequisites

Install the following before running the project:

-   Node.js and npm
-   MongoDB (local installation or MongoDB Atlas)
-   Git

## Installation and Setup

### 1. Clone the repository

``` bash
git clone https://github.com/patel-prince-246/Vehicle_Rental_Marketplace.git
cd Vehicle_Rental_Marketplace
```

### 2. Set up the backend

``` bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder. Configure it with your
own values:

``` env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vehicle_rental_marketplace
JWT_SECRET=replace_with_a_long_random_secret
```

For MongoDB Atlas, use your Atlas connection string as `MONGO_URI`.

Start the backend:

``` bash
npm run dev
```

If the `dev` script is not available in your local
`backend/package.json`, run:

``` bash
node server.js
```

The backend is expected to run at:

``` text
http://localhost:5000
```

### 3. Set up the frontend

Open a second terminal from the project root:

``` bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend URL, usually:

``` text
http://localhost:5173
```

Open that URL in your browser.

## API

The backend exposes REST API route groups under `/api`:

  Route                  Purpose
  ---------------------- --------------------------------
  `/api/users`           User registration and login
  `/api/owners`          Owner-related operations
  `/api/agencies`        Agency-related operations
  `/api/admin`           Administrative operations
  `/api/vehicles`        Vehicle listing and management
  `/api/bookings`        Rental booking operations
  `/api/payments`        Payment and refund operations
  `/api/reviews`         Reviews and ratings
  `/api/notifications`   User notifications

The vehicle listing endpoint can be checked in a browser or API client:

``` text
GET http://localhost:5000/api/vehicles
```

A successful response includes `success`, `count`, and `vehicles`.

## Environment and Security Notes

-   Do not commit `.env` files, database credentials, JWT secrets, or
    other private values.
-   Keep `node_modules` out of Git; install dependencies with
    `npm install`.
-   Use a strong, unique `JWT_SECRET` for local or deployed
    environments.
-   Configure CORS and other security settings appropriately before
    deployment.

## Current Development Status

The backend and frontend are fully implemented and verified:

-   ✅ **Driving Licence Upload & Workflow:** Customers can upload driving licences via `POST /api/users/license`; admins can approve or reject licences via `GET /api/admin/licenses` and `PUT /api/admin/users/:id/verify-license` / `reject-license`.
-   ✅ **Email Notification Service:** Integrated `emailService.js` using `nodemailer` for booking confirmations, schedule changes, licence verifications, and payment receipts.
-   ✅ **Booking, Payment & Refund Workflow:** End-to-end verified booking lifecycle, schedule overlap collision detection, payment simulation, and cancellation/refund processing.
-   ✅ **Role-based Authorization & RBAC:** Enforced JWT authentication and role middleware across `customer`, `owner`, `agency`, and `admin`.
-   ✅ **Automated Test Suite & E2E Testing:** 21 automated unit and end-to-end tests passing across 3 test suites (`npm test`).

## Running the Application


Run the backend and frontend in separate terminals:

**Terminal 1 --- Backend**

``` bash
cd backend
npm run dev
```

**Terminal 2 --- Frontend**

``` bash
cd frontend
npm run dev
```

## Contributing

1.  Create a branch for your changes.
2.  Make and test your updates locally.
3.  Commit your changes with a clear message.
4.  Push the branch to GitHub and open a pull request if working
    collaboratively.

## Repository

[Vehicle Rental Marketplace Management
System](https://github.com/patel-prince-246/Vehicle_Rental_Marketplace)
