const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

/**
 * Migration Script: Local MongoDB -> MongoDB Atlas (Cloud)
 * Copies all collections and documents from local MongoDB to MongoDB Atlas.
 */
async function migrateLocalToCloud() {
  const localUri = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/vehicle_rental_marketplace";
  const cloudUri = process.env.MONGO_URI;

  if (!cloudUri || cloudUri.includes("127.0.0.1") || cloudUri.includes("localhost")) {
    console.error("❌ Please provide a valid MongoDB Atlas Cloud URI in backend/.env under MONGO_URI");
    console.log("Example: MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/vehicle_rental_marketplace?retryWrites=true&w=majority");
    process.exit(1);
  }

  console.log("=================================================");
  console.log("🚀 Starting Database Migration to Cloud (MongoDB Atlas)");
  console.log("=================================================");
  console.log(`Source (Local):  ${localUri}`);
  console.log(`Target (Cloud):  ${cloudUri.replace(/:([^@]+)@/, ":****@")}`); // Mask password

  let localConn, cloudConn;

  try {
    console.log("\nConnecting to local MongoDB...");
    localConn = await mongoose.createConnection(localUri).asPromise();
    console.log(" Connected to local MongoDB!");

    console.log("Connecting to Cloud MongoDB Atlas...");
    cloudConn = await mongoose.createConnection(cloudUri).asPromise();
    console.log(" Connected to Cloud MongoDB Atlas!");

    const collections = await localConn.db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections to migrate.`);

    for (const col of collections) {
      const colName = col.name;
      if (colName.startsWith("system.")) continue;

      const count = await localConn.db.collection(colName).countDocuments();
      console.log(`\n📦 Migrating collection: '${colName}' (${count} documents)...`);

      if (count === 0) {
        console.log(`   Skipped (empty).`);
        continue;
      }

      const docs = await localConn.db.collection(colName).find({}).toArray();
      const targetCol = cloudConn.db.collection(colName);

      // Clean target collection before copying to prevent duplicate key errors
      await targetCol.deleteMany({});
      const result = await targetCol.insertMany(docs);
      console.log(`   Successfully migrated ${result.insertedCount} documents to cloud!`);
    }

    console.log("\n=================================================");
    console.log(" Migration to MongoDB Atlas Completed Successfully!");
    console.log("=================================================");
  } catch (err) {
    console.error("\n❌ Migration failed:", err.message);
  } finally {
    if (localConn) await localConn.close();
    if (cloudConn) await cloudConn.close();
    process.exit(0);
  }
}

migrateLocalToCloud();
