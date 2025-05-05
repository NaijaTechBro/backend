
// server/models/Deck.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SlideSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: '' },
  notes: { type: String, default: '' },
  order: { type: Number, required: true },
  template: { type: String, default: '' }
});

const DeckSchema = new Schema({
  title: { type: String, required: true },
  sector: { type: String, default: '' },
  slides: [SlideSchema],
  created: { type: Date, default: Date.now },
  lastModified: { type: Date, default: Date.now },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

module.exports = mongoose.model('Deck', DeckSchema);