const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { genSalt, hash, compare } = require("bcryptjs");

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    minlength: [4, "name requires a minimum of 4 letters"],
    maxlength: [12, "name can take a maximum of 12 letters"],
  },
  password: {
    type: String,
    required: true,
  },
  accountID: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  created: {
    type: String,
    required: true,
  },
  products: {
    type: Array,
    default: [],
  },
  operators: {
    type: Array,
    default: [],
  },
  companies: {
    type: Array,
    default: [],
  },
});

CompanySchema.methods.matchPassword = async function (candidate) {
  const isMatch = await compare(candidate, this.password);
  return isMatch;
};

CompanySchema.pre("save", async function () {
  const salt = await genSalt(10);
  const crypted = await hash(this.password, salt);
  this.password = crypted;
});

CompanySchema.methods.createJWT = function (pin) {
  return jwt.sign({ userId: this._id, pin }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

module.exports = mongoose.model("Company", CompanySchema);
