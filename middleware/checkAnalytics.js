const { BadRequestError } = require("../errors");
const Company = require("../models/Company");

const checkAnalytics = async (req, res, next) => {
  const { companyId, pin } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const isAccess = userCompany.operators.find((x) => x.pin === pin).analytics;
  if (isAccess) {
    console.log("accept");

    next();
  } else {
    console.log("rejext");
    throw new BadRequestError("Access Denied");
  }
};

module.exports = checkAnalytics;
