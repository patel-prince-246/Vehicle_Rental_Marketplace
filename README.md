Vehicle Rental Marketplace Management System
A full-stack MERN (MongoDB, Express.js, React.js, Node.js) vehicle
rental marketplace designed to support both C2C
(Consumer-to-Consumer) and B2C (Business-to-Consumer) rentals.
The platform connects customers with individual vehicle owners and
rental agencies. Customers can browse vehicles and make bookings, while
owners and agencies manage listings and bookings. Admins oversee
platform activities.
> **Project status:** Core backend structure and APIs have been
> developed. Frontend development and additional features are in
> progress. Postman testing should be completed during integration.
Table of Contents
Features
Technology Stack
Project Structure
Installation and Setup
Environment Variables
Run the Backend
API Endpoints
API Testing with Postman
Git Collaboration
Security Notes
Future Enhancements
Features
Customer: registration, login, vehicle browsing, booking,
payments, reviews, and notifications.
Owner: profile and vehicle listing management.
Rental Agency: agency profile and vehicle listing management.
Admin: management of users, owners, agencies, vehicles,
bookings, payments, and reviews.
Platform: JWT authentication, role-based authorization,
centralized error handling, Helmet security headers, and rate
limiting.
Technology Stack
Layer             Technology
---
Frontend          React.js (in progress)
Backend           Node.js, Express.js
Database          MongoDB, Mongoose
Authentication    JWT, bcrypt
API testing       Postman
Version control   Git, GitHub
Project Structure
``` text
Vehicle_Rental_Marketplace/
├── .gitignore
├── README.md
└── backend/
    ├── config/
    │   └── db.js
    ├── models/
    │   ├── User.js
    │   ├── Owner.js
    │   ├── Agency.js
    │   ├── Admin.js
    │   ├── Vehicle.js
    │   ├── Booking.js
    │   ├── Payment.js
    │   ├── Review.js
    │   └── Notification.js
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── .env
    ├── package.json
    ├── package-lock.json
    └── server.js
```
Installation and Setup
Prerequisites
Install Node.js and npm, MongoDB Community Server (or use MongoDB
Atlas), Git, and Postman.
Clone the repository
``` bash
git clone https://github.com/patel-prince-246/Vehicle_Rental_Marketplace.git
cd Vehicle_Rental_Marketplace/backend
```
Install dependencies
``` bash
npm install
```
Environment Variables
Create a `.env` file inside `backend/`:
``` env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vehicle_rental_db
JWT_SECRET=replace_with_a_long_random_secret
```
Keep `.env` private. It must not be committed to GitHub. Each developer
should create their own local `.env` file.
Run the Backend
From the `backend/` directory:
``` bash
node server.js
```
The API base URL is:
``` text
http://localhost:5000
```
Health check:
``` http
GET http://localhost:5000/
```
Expected response:
``` json
{
  "success": true,
  "message": "Vehicle Rental Marketplace API is running"
}
```
API Endpoints
The backend is organized into these API groups. Check the corresponding
files in `backend/routes/` for the exact paths and HTTP methods
implemented in the current code.
---
Module                  Base path               Operations
---
Users                   `/api/users`            Register, login,
profile
Owners                  `/api/owners`           Owner profile and
management
Agencies                `/api/agencies`         Agency profile,
verification, and
management
Admin                   `/api/admin`            Admin dashboard and
platform management
Vehicles                `/api/vehicles`         Create, list,
search/filter, view,
update, delete,
verify/reject
Bookings                `/api/bookings`         Create, list, view,
update status, cancel
Payments                `/api/payments`         Create payment,
list/view payments,
refund
Reviews                 `/api/reviews`          Create, list, update,
delete
Notifications           `/api/notifications`    Create, list, mark
read, delete
Example requests
These examples show common request shapes. Check the relevant controller
for required fields and whether the authenticated user ID is taken from
the JWT rather than the request body.
Register
``` http
POST http://localhost:5000/api/users/register
Content-Type: application/json
```
``` json
{
  "name": "Test Customer",
  "email": "customer@example.com",
  "phone": "9876543210",
  "password": "ExamplePassword123",
  "city": "Nadiad",
  "role": "customer"
}
```
Login
``` http
POST http://localhost:5000/api/users/login
Content-Type: application/json
```
``` json
{
  "email": "customer@example.com",
  "password": "ExamplePassword123"
}
```
Create a vehicle (use a valid owner/agency MongoDB ObjectId and an
authorized token)
``` http
POST http://localhost:5000/api/vehicles
Content-Type: application/json
Authorization: Bearer <OWNER_OR_AGENCY_TOKEN>
```
``` json
{
  "vehicleid": "GJ01AB1234",
  "ownerType": "Owner",
  "ownerId": "<OWNER_MONGODB_OBJECT_ID>",
  "brand": "Honda",
  "model": "Activa 6G",
  "type": "Scooter",
  "pricePerDay": 500,
  "city": "Nadiad",
  "year": 2024,
  "registrationNumber": "GJ01AB1234",
  "description": "Well-maintained scooter"
}
```
Create a booking (use valid MongoDB ObjectIds; check the controller
for required fields)
``` http
POST http://localhost:5000/api/bookings
Content-Type: application/json
Authorization: Bearer <CUSTOMER_TOKEN>
```
``` json
{
  "bookingid": "BOOK001",
  "customerId": "<CUSTOMER_MONGODB_OBJECT_ID>",
  "vehicleId": "<VEHICLE_MONGODB_OBJECT_ID>",
  "startDate": "2026-10-10",
  "endDate": "2026-10-12",
  "totalAmount": 1000,
  "securityDeposit": 0
}
```
API Testing with Postman
1. Start the server
Start MongoDB, then run `node server.js` from `backend/`. Confirm that
the server starts and MongoDB connects.
2. Test the health check
Method: `GET`
URL: `http://localhost:5000/`
Click Send.
Confirm the response says the API is running.
3. Register a customer
Method: `POST`
URL: `http://localhost:5000/api/users/register`
Select Body → raw → JSON.
Enter the registration JSON above and click Send.
4. Log in
Method: `POST`
URL: `http://localhost:5000/api/users/login`
Send the registered email and password.
Copy the JWT token from the response.
5. Set the token for protected APIs
In Postman, open the request's Authorization tab, select Bearer
Token, and paste the JWT token. Alternatively, add:
``` http
Authorization: Bearer <YOUR_JWT_TOKEN>
```
6. Test the modules
Suggested order:
`GET /` --- health check
`POST /api/users/register` --- register a customer
`POST /api/users/login` --- log in and obtain a token
User profile route --- test authenticated profile access
Owner/agency routes --- prepare a valid owner or agency record
Vehicle routes --- create and retrieve a vehicle
Booking routes --- create and retrieve a booking
Payment routes --- create and retrieve a payment
Review routes --- create and retrieve a review
Notification routes --- create and retrieve a notification
Admin routes --- test using an admin account/token
Use MongoDB ObjectIds for document references such as `ownerId`,
`customerId`, `vehicleId`, and `bookingId`. A custom ID such as a
vehicle registration number is not a replacement for a MongoDB ObjectId.
7. Verify database changes
In MongoDB Compass, connect to `mongodb://localhost:27017`, open
`vehicle_rental_db`, and inspect the relevant collections. Mongoose may
pluralize model names when creating collection names.
8. Record test results
For each request, record the HTTP method, endpoint, request
body/headers, status code, response, and whether the expected database
change occurred.
> **Testing status:** This section is a testing guide. Do not mark an
> endpoint as tested until you have run it in Postman and checked its
> result. Confirm exact route paths and request fields in
> `backend/routes/` and `backend/controllers/`.
Git Collaboration
Invite your partner
Open the GitHub repository.
Go to Settings → Collaborators.
Click Add people and invite your partner by GitHub username or
email.
Your partner must accept the invitation.
Clone the repository
``` bash
git clone https://github.com/patel-prince-246/Vehicle_Rental_Marketplace.git
cd Vehicle_Rental_Marketplace
```
Recommended branch workflow
Create a separate branch for each task:
``` bash
git checkout main
git pull origin main
git checkout -b feature/your-task
```
After making changes:
``` bash
git add .
git commit -m "Describe your changes"
git push -u origin feature/your-task
```
Open a Pull Request on GitHub, review the changes, and merge it into
`main`. Each developer should pull the latest `main` before starting new
work. Do not share `.env` through Git.
Security Notes
Keep `.env` and `node_modules/` out of version control.
Use a strong, private `JWT_SECRET`.
Do not commit passwords, API keys, tokens, or database credentials.
Use role-based authorization for protected operations.
Configure HTTPS and restrict CORS origins for deployment.
Future Enhancements
Complete the React frontend and role-specific dashboards.
Implement KYC document upload and verification if retained in the
final project scope.
Integrate a real payment gateway.
Add an availability calendar and booking extensions.
Add email notifications, real-time chat, dispute resolution, vehicle
condition reporting, maintenance tracking, and analytics.
License
This project is developed for academic purposes. Add a license if you
intend to distribute it under specific terms.