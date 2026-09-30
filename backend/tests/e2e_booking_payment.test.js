const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const Owner = require("../models/Owner");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const { initTestDB } = require("./testHelper");

beforeAll(async () => {
  await initTestDB();
  await User.deleteMany({ email: /test_e2e_.*@example\.com/i });
  await Owner.deleteMany({ email: /test_e2e_.*@example\.com/i });
  await Vehicle.deleteMany({ vehicleid: /E2E-VEH-.*/i });
  await Booking.deleteMany({ bookingid: /E2E-BKG-.*/i });
  await Payment.deleteMany({ paymentid: /E2E-PAY-.*/i });
});



describe("End-to-End API Workflow: Vehicle, Booking, Payment, & Cancellation Lifecycle", () => {
  let customerToken, ownerToken, adminToken;
  let customerUser, ownerUser, adminUser;
  let vehicleId;
  let bookingId;
  let paymentId;

  beforeAll(async () => {
    // 1. Setup Admin
    adminUser = await User.create({
      name: "E2E Admin",
      email: `test_e2e_admin_${Date.now()}@example.com`,
      phone: "9876500000",
      password: "hashed_dummy_pw",
      city: "Gandhinagar",
      role: "admin",
    });
    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || "test_jwt_secret_123",
      { expiresIn: "1d" }
    );

    // 2. Setup Owner
    const ownRes = await request(app)
      .post("/api/users/register")
      .send({
        name: "E2E Owner",
        email: `test_e2e_owner_${Date.now()}@example.com`,
        phone: "9876500001",
        password: "Password@123",
        city: "Ahmedabad",
        role: "owner",
        ownerid: `OWN-${Date.now().toString().slice(-4)}`,
      });
    ownerUser = ownRes.body.user;

    const ownLogin = await request(app)
      .post("/api/users/login")
      .send({ email: ownRes.body.user.email, password: "Password@123" });
    ownerToken = ownLogin.body.token;

    // 3. Setup Customer
    const custRes = await request(app)
      .post("/api/users/register")
      .send({
        name: "E2E Customer",
        email: `test_e2e_cust_${Date.now()}@example.com`,
        phone: "9876500002",
        password: "Password@123",
        city: "Ahmedabad",
        role: "customer",
      });
    customerUser = custRes.body.user;

    const custLogin = await request(app)
      .post("/api/users/login")
      .send({ email: custRes.body.user.email, password: "Password@123" });
    customerToken = custLogin.body.token;
  });

  test("Step 1: Owner creates a new vehicle listing", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        vehicleid: `E2E-VEH-${Date.now().toString().slice(-5)}`,
        brand: "Honda",
        model: "City ZX",
        type: "Car",
        pricePerDay: 2000,
        city: "Ahmedabad",
        year: 2024,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.vehicle).toBeDefined();
    vehicleId = res.body.vehicle._id;
  });

  test("Step 2: Admin verifies the listed vehicle", async () => {
    const res = await request(app)
      .put(`/api/admin/vehicles/${vehicleId}/verify`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vehicle.verificationStatus).toBe("verified");
  });

  test("Step 3: Customer discovers verified vehicle in public catalog", async () => {
    const res = await request(app).get(`/api/vehicles/${vehicleId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vehicle.brand).toBe("Honda");
  });

  test("Step 4: Customer creates a rental booking", async () => {
    const start = new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0];
    const end = new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0];

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingid: `E2E-BKG-${Date.now().toString().slice(-5)}`,
        vehicleId: vehicleId,
        startDate: start,
        endDate: end,
        pickupLocation: "Ahmedabad Airport",
        returnLocation: "Ahmedabad Airport",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe("pending");
    bookingId = res.body.booking._id;
  });

  test("Step 5: Should reject conflicting/overlapping rental dates for same vehicle", async () => {
    const start = new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0];
    const end = new Date(Date.now() + 86400000 * 4).toISOString().split("T")[0];

    const res = await request(app)
      .post("/api/bookings")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        bookingid: `E2E-BKG-CONFLICT-${Date.now().toString().slice(-4)}`,
        vehicleId: vehicleId,
        startDate: start,
        endDate: end,
      });

    // Expect conflict (409) or bad request due to overlap
    expect([400, 409]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test("Step 6: Customer submits payment for booking", async () => {
    const bookingRes = await request(app)
      .get(`/api/bookings/${bookingId}`)
      .set("Authorization", `Bearer ${customerToken}`);
    const amount = bookingRes.body.booking.totalAmount;

    const res = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        paymentid: `E2E-PAY-${Date.now().toString().slice(-5)}`,
        bookingId: bookingId,
        amount: amount,
        paymentMethod: "upi",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.status).toBe("pending");
    paymentId = res.body.payment._id;
  });

  test("Step 7: Admin confirms and completes payment", async () => {
    const res = await request(app)
      .put(`/api/payments/${paymentId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "completed",
        transactionId: "TXN_UPI_987654321",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.status).toBe("completed");
  });

  test("Step 8: Customer cancels booking", async () => {
    const res = await request(app)
      .patch(`/api/bookings/${bookingId}/cancel`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe("cancelled");
  });

  test("Step 9: Customer requests refund for cancelled booking", async () => {
    const res = await request(app)
      .post(`/api/payments/${paymentId}/refund`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ refundAmount: 6000 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.refundStatus).toBe("pending");
  });

  test("Step 10: Admin processes and approves refund", async () => {
    const res = await request(app)
      .put(`/api/payments/${paymentId}/refund`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        status: "completed",
        refundTransactionId: "REF_TXN_554433",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.payment.refundStatus).toBe("completed");
  });
});
