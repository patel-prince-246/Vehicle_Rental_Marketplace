const request = require("supertest");
const app = require("../server");
const User = require("../models/User");
const Owner = require("../models/Owner");
const { initTestDB } = require("./testHelper");

beforeAll(async () => {
  await initTestDB();
  await User.deleteMany({ email: /test.*@example\.com/i });
  await Owner.deleteMany({ email: /test.*@example\.com/i });
});



describe("Authentication and Role-Based Authorization", () => {
  const customerEmail = `test_cust_${Date.now()}@example.com`;
  const ownerEmail = `test_owner_${Date.now()}@example.com`;
  let customerToken = "";
  let ownerToken = "";

  test("1. Should register a new customer", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "Test Customer",
        email: customerEmail,
        phone: "9876543210",
        password: "Password@123",
        city: "Ahmedabad",
        role: "customer",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe("customer");
  });

  test("2. Should register a new owner", async () => {
    const res = await request(app)
      .post("/api/users/register")
      .send({
        name: "Test Owner",
        email: ownerEmail,
        phone: "9876543211",
        password: "Password@123",
        city: "Vadodara",
        role: "owner",
        ownerid: `OWN-${Date.now().toString().slice(-4)}`,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.owner).toBeDefined();
  });

  test("3. Should login customer and return valid JWT", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: customerEmail,
        password: "Password@123",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    customerToken = res.body.token;
  });

  test("4. Should login owner and return valid JWT", async () => {
    const res = await request(app)
      .post("/api/users/login")
      .send({
        email: ownerEmail,
        password: "Password@123",
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    ownerToken = res.body.token;
  });

  test("5. Should authorize profile access with valid token", async () => {
    const res = await request(app)
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(customerEmail);
  });

  test("6. Should reject unauthorized request without token", async () => {
    const res = await request(app).get("/api/users/profile");
    expect(res.status).toBe(401);
  });

  test("7. Should block customer from accessing owner-only vehicle creation", async () => {
    const res = await request(app)
      .post("/api/vehicles")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        vehicleid: "VEH-FORBIDDEN",
        brand: "Test",
        model: "Car",
        type: "Car",
        pricePerDay: 1000,
        city: "Surat",
      });

    expect(res.status).toBe(403);
  });
});
