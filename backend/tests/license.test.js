const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../server");
const User = require("../models/User");
const { initTestDB } = require("./testHelper");

beforeAll(async () => {
  await initTestDB();
  await User.deleteMany({ email: /test_lic.*@example\.com/i });
});



describe("Driving Licence Upload and Admin Approval Workflow", () => {
  let customerUser;
  let customerToken;
  let adminUser;
  let adminToken;

  beforeAll(async () => {
    // Create customer
    const custRes = await request(app)
      .post("/api/users/register")
      .send({
        name: "Lic Customer",
        email: `test_lic_cust_${Date.now()}@example.com`,
        phone: "9123456780",
        password: "Password@123",
        city: "Vadodara",
        role: "customer",
      });
    customerUser = custRes.body.user;

    const custLogin = await request(app)
      .post("/api/users/login")
      .send({
        email: custRes.body.user.email,
        password: "Password@123",
      });
    customerToken = custLogin.body.token;

    // Create admin directly in DB
    adminUser = await User.create({
      name: "Lic Admin",
      email: `test_lic_admin_${Date.now()}@example.com`,
      phone: "9123456789",
      password: "hashed_dummy_password",
      city: "Gandhinagar",
      role: "admin",
    });

    adminToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || "test_jwt_secret_123",
      { expiresIn: "1d" }
    );
  });

  test("1. Customer should upload driving licence details", async () => {
    const res = await request(app)
      .post("/api/users/license")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        licenseNumber: "GJ062024009876",
        imageUrl: "https://example.com/mock-license.jpg",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.license.status).toBe("uploaded");
    expect(res.body.license.licenseNumber).toBe("GJ062024009876");
  });

  test("2. Admin should see uploaded license in pending verification queue", async () => {
    const res = await request(app)
      .get("/api/admin/licenses")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const found = res.body.licenses.find((u) => u._id.toString() === customerUser.id);
    expect(found).toBeDefined();
    expect(found.license.status).toBe("uploaded");
  });

  test("3. Admin should approve customer licence", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${customerUser.id}/verify-license`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.license.status).toBe("verified");
  });

  test("4. Admin should be able to reject licence with reason", async () => {
    const res = await request(app)
      .put(`/api/admin/users/${customerUser.id}/reject-license`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ reason: "Document blur and expired date." });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.license.status).toBe("rejected");
  });
});
