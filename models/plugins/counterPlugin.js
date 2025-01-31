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
  schema.pre('save', async function(next) {
    if (this.isNew) {
      const Model = this.constructor;
      const lastDoc = await Model.findOne({}, { documentNumber: 1 })
        .sort({ documentNumber: -1 })
        .limit(1);

      this.documentNumber = lastDoc ? lastDoc.documentNumber + 1 : 1;
    }
    next();
  });
};

module.exports = counterPlugin;
