const { BadRequestError } = require("../errors/index");
const jwt = require("jsonwebtoken");
const Company = require("../models/Company");

const checkAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new BadRequestError("Authorization Invalid");
  }
  const token = header.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { companyId: payload.userId, pin: payload.pin };
    next();
  } catch (error) {
    throw new BadRequestError("JWT authorization Invalid");
  }
};

module.exports = checkAuth;
