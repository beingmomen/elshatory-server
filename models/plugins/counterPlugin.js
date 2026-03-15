const mongoose = require('mongoose');

// Create a separate counter model
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', counterSchema);

const counterPlugin = schema => {
  // Add counter field to schema
  schema.add({
    documentNumber: {
      type: Number,
      unique: true,
      index: true
    }
  });

  // Add pre-save middleware to automatically increment counter
  schema.pre('save', async function (next) {
    if (this.isNew && !this.documentNumber) {
      try {
        const { modelName } = this.constructor;
        let retries = 3;

        while (retries > 0) {
          try {
            // Try to get the next counter value
            const counter = await Counter.findOneAndUpdate(
              { _id: modelName },
              { $inc: { sequence_value: 1 } },
              { new: true, upsert: true }
            );

            this.documentNumber = counter.sequence_value;
            break;
          } catch (error) {
            // If there is a documentNumber conflict, retry
            if (error.code === 11000 && retries > 1) {
              retries -= 1;

              // Find the highest existing documentNumber and update
              const lastDoc = await this.constructor.findOne(
                {},
                { documentNumber: 1 },
                { sort: { documentNumber: -1 } }
              );

              const lastDocumentNumber = lastDoc ? lastDoc.documentNumber : 0;

              // Sync the counter with the actual last number in the data
              await Counter.findOneAndUpdate(
                { _id: modelName },
                { $set: { sequence_value: lastDocumentNumber } },
                { upsert: true }
              );

              continue;
            }
            throw error;
          }
        }

        if (retries === 0) {
          throw new Error(
            'Failed to get a unique documentNumber after several attempts'
          );
        }
      } catch (error) {
        return next(error);
      }
    }
    next();
  });

  // Helper function to reset counter (useful after seeding)
  schema.statics.resetCounter = async function () {
    const { modelName } = this;

    // Find the highest documentNumber
    const lastDoc = await this.findOne(
      {},
      { documentNumber: 1 },
      { sort: { documentNumber: -1 } }
    );

    const lastDocumentNumber = lastDoc ? lastDoc.documentNumber : 0;

    // Update the counter
    await Counter.findOneAndUpdate(
      { _id: modelName },
      { sequence_value: lastDocumentNumber },
      { upsert: true }
    );

    return {
      modelName,
      resetTo: lastDocumentNumber,
      message: `Counter for ${modelName} has been reset to ${lastDocumentNumber}`
    };
  };
};

module.exports = counterPlugin;
