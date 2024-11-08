const { v4: uuidv4 } = require("uuid");
const Company = require("../models/Company");
const { BadRequestError } = require("../errors/index");
const { StatusCodes } = require("http-status-codes");

const RegisterCompany = async (req, res) => {
  let id = "";
  const generateId = () => {
    id = uuidv4().slice(0, 5);
  };
  generateId();
  const { name, owner, password } = req.body;
  const exists = await Company.findOne({ accountID: id });
  if (exists != null) {
    generateId();
  }
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;

  const newCompany = await Company.create({
    name,
    owner,
    password,
    accountID: id,
    created: formattedDate,
    operators: [
      { name: owner, management: true, analytics: true, pin: "1234" },
    ],
  });
  res
    .status(StatusCodes.CREATED)
    .json({ message: "company created", company: newCompany });
};

const Login = async (req, res) => {
  const { id, password, pin } = req.body;
  if (!id || !password || !pin) {
    throw new BadRequestError("please provide all the credentials");
  }
  const company = await Company.findOne({ accountID: id });
  if (company === null) {
    throw new BadRequestError("Company does not exist");
  }

  const isMatch = await company.matchPassword(password);
  if (!isMatch) {
    throw new BadRequestError("Incorrect Password");
  }
  const pinExists = company.operators.find((x) => x.pin === pin);
  if (pinExists === undefined) {
    throw new BadRequestError("Pin does not exist");
  }
  const token = company.createJWT(pin);
  res.status(200).json({ token, id: company.accountID });
};

module.exports = { RegisterCompany, Login };
