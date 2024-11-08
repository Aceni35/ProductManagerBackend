const { StatusCodes } = require("http-status-codes");
const Company = require("../models/Company");
const { BadRequestError } = require("../errors");
const { v4: uuidv4 } = require("uuid");
const { genSalt, hash } = require("bcryptjs");
const Order = require("../models/Order");

const getProducts = async (req, res) => {
  const { companyId } = req.user;
  const { products } = await Company.findById({ _id: companyId });
  res.status(200).json({ products });
};

const addProduct = async (req, res) => {
  const { companyId } = req.user;
  const { name, price, weight } = req.body;

  if (!name || !price || !weight) {
    throw new BadRequestError("Please provide all the details");
  }
  const id = uuidv4().slice(0, 6);

  const userCompany = await Company.findById({ _id: companyId });
  userCompany.products.push({ name, price, weight, id });
  await userCompany.save();

  res
    .status(StatusCodes.OK)
    .json({ msg: "product added", product: { name, price, weight, id } });
};

const editProduct = async (req, res) => {
  const { companyId } = req.user;
  const { name, price, weight, id } = req.body;

  if (!name || !price || !weight || !id) {
    throw new BadRequestError("Please provide all the credentials");
  }
  const userCompany = await Company.findById({ _id: companyId });
  const newProducts = userCompany.products.map((x) => {
    if (x.id === id) {
      return { name, price, weight, id };
    } else {
      return x;
    }
  });
  userCompany.products = newProducts;
  await userCompany.save();
  res
    .status(200)
    .json({ msg: "updated", newProduct: { name, price, weight, id } });
};

const deleteProduct = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.body;

  if (!id) {
    throw new BadRequestError("Please provide Product");
  }
  const userCompany = await Company.findOne({ _id: companyId });
  const newProducts = userCompany.products.filter((x) => x.id != id);
  userCompany.products = newProducts;
  await userCompany.save();
  res.status(StatusCodes.OK).json({ msg: "product deleted" });
};

const getOperators = async (req, res) => {
  const { companyId, pin } = req.user;
  const { operators } = await Company.findById({ _id: companyId });
  const username = operators.find((x) => x.pin === pin);
  res.status(200).json({ access: "true", operators, user: username.name });
};

const addOperator = async (req, res) => {
  const { companyId } = req.user;
  const { name, management, analytics, pin } = req.body;
  if (!name || !pin) {
    throw new BadRequestError("Please provide all the info");
  }
  const userCompany = await Company.findById({ _id: companyId });

  const pinExists = userCompany.operators.find((x) => x.pin === pin);
  const nameExists = userCompany.operators.find((x) => x.name === name);
  if (pinExists || nameExists) {
    throw new BadRequestError("Please use unique name and pin");
  }
  const currentDate = new Date();
  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const formattedDate = `${day}-${month}-${year}`;
  const newOperator = {
    name,
    management,
    analytics,
    pin,
    joined: formattedDate,
  };
  userCompany.operators.push(newOperator);
  await userCompany.save();
  res.status(200).json({ msg: "operator created", newOperator });
};

const editOperator = async (req, res) => {
  const { companyId } = req.user;
  const { name, management, analytics, pin, originalPin, originalName } =
    req.body;
  if (!name || !pin || !originalPin) {
    throw new BadRequestError("Please provide all the info");
  }
  const userCompany = await Company.findById({ _id: companyId });

  const pinExists = userCompany.operators.find(
    (x) => x.pin === pin && x.pin != originalPin
  );
  const nameExists = userCompany.operators.find(
    (x) => x.name === name && x.name != originalName
  );
  if (pinExists || nameExists) {
    throw new BadRequestError("Please use unique name and pin");
  }
  const newOperator = {
    name,
    management,
    analytics,
    pin,
  };
  const newOperators = userCompany.operators.map((x) => {
    if (x.pin === originalPin) {
      return { ...x, ...newOperator };
    } else {
      return x;
    }
  });
  userCompany.operators = newOperators;
  await userCompany.save();
  res.status(200).json({ msg: "operator updated", newOperators });
};

const removeOperator = async (req, res) => {
  const { companyId } = req.user;
  const { pin } = req.body;

  if (!pin) {
    throw new BadRequestError("Please provide an operator");
  }
  const userCompany = await Company.findById({ _id: companyId });
  userCompany.operators = userCompany.operators.filter((x) => x.pin != pin);
  await userCompany.save();
  res.status(200).json({ msg: "removed" });
};

const updatePassword = async (req, res) => {
  const { companyId } = req.user;
  const { oldPass, newPass, confirmPass } = req.body;
  if (!newPass || !oldPass || !confirmPass) {
    throw new BadRequestError("Please provide all the required info");
  }
  if (newPass != confirmPass) {
    throw new BadRequestError("Please confirm the password correctly");
  }
  if (newPass.length < 8) {
    throw new BadRequestError("Password must be longer than 8 characters");
  }
  const userCompany = await Company.findById({ _id: companyId });
  const isMatch = await userCompany.matchPassword(oldPass);
  if (!isMatch) {
    throw new BadRequestError("Old password does not match");
  }
  const isSame = await userCompany.matchPassword(newPass);
  if (isSame) {
    throw new BadRequestError("Please change the password into something new");
  }

  const salt = await genSalt(10);
  const cryptedPassword = await hash(newPass, salt);
  await Company.findByIdAndUpdate(
    { _id: companyId },
    { password: cryptedPassword }
  );
  res.status(200).json({ msg: "Password updated" });
};

const getAccount = async (req, res) => {
  const { companyId } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const { companies, name, accountID, owner, created } = userCompany;
  const userCompanies = await Promise.all(
    companies.map(async (x) => {
      const comp = await Company.findOne({ accountID: x });
      return { name: comp.name, accountID: comp.accountID };
    })
  );
  res
    .status(200)
    .json({ name, accountID, owner, created, companies: userCompanies });
};

const addCompany = async (req, res) => {
  const { companyId } = req.user;
  const { id } = req.body;
  if (!id) {
    throw new BadRequestError("Please provide company ID");
  }
  console.log(companyId);

  const userCompany = await Company.findById({ _id: companyId });
  if (userCompany.accountID === id) {
    throw new BadRequestError("You cannot add yourself");
  }
  const newCompany = await Company.findOne({ accountID: id });
  if (newCompany === null) {
    throw new BadRequestError("Company does not exist");
  }

  if (userCompany.companies.includes(id)) {
    throw new BadRequestError("Company already has been added");
  }
  userCompany.companies.push(id);
  await userCompany.save();
  res.status(200).json({
    msg: "company added",
    company: { name: newCompany.name, accountID: newCompany.accountID },
  });
};

const removeCompany = async (req, res) => {
  const { companyId } = req.user;
  const { accountID } = req.body;
  if (!accountID) {
    throw new BadRequestError("please provide company ID");
  }

  const userCompany = await Company.findById({ _id: companyId });
  const newCompanies = userCompany.companies.filter((x) => x != accountID);
  userCompany.companies = newCompanies;
  await userCompany.save();
  res.status(200).json({ msg: "Company Removed" });
};

module.exports = {
  getProducts,
  addProduct,
  editProduct,
  deleteProduct,
  getOperators,
  addOperator,
  removeOperator,
  editOperator,
  updatePassword,
  getAccount,
  addCompany,
  removeCompany,
};
