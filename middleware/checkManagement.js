const { BadRequestError } = require("../errors");
const Company = require("../models/Company");

const checkManagement = async (req, res, next) => {
  const { companyId, pin } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const isAccess = userCompany.operators.find((x) => x.pin === pin).management;
  if (isAccess) {
    next();
  } else {
    throw new BadRequestError("Access Denied");
  }
};

module.exports = checkManagement;
