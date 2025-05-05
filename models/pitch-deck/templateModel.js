// server/models/Template.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TemplateSlideSchema = new Schema({
  slideType: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true }
});

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  sector: { type: String, required: true },
  description: { type: String, required: true },
  slides: [TemplateSlideSchema],
  isDefault: { type: Boolean, default: false }
});

module.exports = mongoose.model('Template', TemplateSchema);