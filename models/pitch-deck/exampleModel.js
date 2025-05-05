// server/models/Example.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExampleSchema = new Schema({
  sector: { type: String, required: true },
  slideType: { type: String, required: true },
  content: { type: String, required: true },
  companyName: { type: String, required: true },
  metrics: {
    funding: { type: Number },
    revenue: { type: Number },
    users: { type: Number },
    growth: { type: Number }
  },
  tags: [{ type: String }]
});

module.exports = mongoose.model('Example', ExampleSchema);