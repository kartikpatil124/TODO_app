import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script: Converts Task.userId from String to ObjectId for existing tasks
 */
async function migrate() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart-productivity';
  console.log('Connecting to database:', uri);
  await mongoose.connect(uri);

  const db = mongoose.connection.db;
  const tasksCollection = db.collection('tasks');

  const cursor = tasksCollection.find({ userId: { $type: 'string' } });
  let updatedCount = 0;
  let skippedCount = 0;

  while (await cursor.hasNext()) {
    const doc = await cursor.next();
    if (mongoose.Types.ObjectId.isValid(doc.userId)) {
      await tasksCollection.updateOne(
        { _id: doc._id },
        { $set: { userId: new mongoose.Types.ObjectId(doc.userId) } }
      );
      updatedCount++;
    } else {
      console.warn(`Skipping task ${doc._id} with non-convertible userId:`, doc.userId);
      skippedCount++;
    }
  }

  console.log(`Migration complete: ${updatedCount} tasks updated to ObjectId, ${skippedCount} skipped.`);
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
