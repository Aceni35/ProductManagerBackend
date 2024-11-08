const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  name: {
    type: String,
    minlength: 4,
    maxlength: 12,
  },
  from: {
    type: Object,
    required: true,
  },
  to: {
    type: Object,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  products: {
    type: Array,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    default: "pending",
  },
  operator: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Order", OrderSchema);
