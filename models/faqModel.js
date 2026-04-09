const mongoose = require('mongoose');
const counterPlugin = require('./plugins/counterPlugin');

const schema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

schema.index({ category: 1, order: 1 });
schema.plugin(counterPlugin);

const Faq = mongoose.model('Faq', schema);

module.exports = Faq;
