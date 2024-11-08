const { StatusCodes } = require("http-status-codes");
const Company = require("../models/Company");
const Order = require("../models/Order");
const { BadRequestError } = require("../errors");

const getOrderPage = async (req, res) => {
  const { companyId, pin } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const operator = userCompany.operators.find((x) => x.pin === pin);
  const companies = await Promise.all(
    userCompany.companies.map(async (x) => {
      const comp = await Company.findOne({ accountID: x });
      return { name: comp.name, accountID: comp.accountID };
    })
  );
  const currentDate = new Date();
  const startDay = new Date(currentDate.setHours(0, 0, 0, 0));
  const endDay = new Date(currentDate.setHours(23, 59, 59, 9999));
  const products = userCompany.products;
  const companyOrders = await Order.find({
    $or: [
      { "from.accountID": userCompany.accountID },
      { "to.accountID": userCompany.accountID },
    ],
    date: {
      $gte: startDay,
      $lte: endDay,
    },
  });

  const completedOrders = companyOrders.filter((x) => {
    return x.status === "accepted" || x.status === "rejected";
  });
  const uncompletedOrders = companyOrders.filter((x) => {
    return x.status === "pending";
  });

  res.status(200).json({
    operator,
    companies,
    products,
    completedOrders,
    uncompletedOrders,
    info: { name: userCompany.name, accountID: userCompany.accountID },
  });
};

const sendOrder = async (req, res) => {
  const { companyId, pin } = req.user;
  const { to, products, total, orderName } = req.body;

  if (!to || !products || Number(total) === 0 || !orderName) {
    throw new BadRequestError("Please provide all the details");
  }
  const toCompany = await Company.findOne({ accountID: to });
  const userCompany = await Company.findById({ _id: companyId });
  const { name } = userCompany.operators.find((x) => x.pin === pin);
  const currentDate = new Date();
  const newOrder = await Order.create({
    name: orderName,
    from: { name: userCompany.name, accountID: userCompany.accountID },
    to: { name: toCompany.name, accountID: toCompany.accountID },
    products,
    total,
    status: "pending",
    operator: name,
    date: currentDate,
  });

  res.status(StatusCodes.CREATED).json({
    msg: "Order placed",
    newOrder: {
      ...newOrder.toObject(),
      date: newOrder.date.toString().split(" ").slice(0, 4).join("-"),
    },
  });
};
const answerOrder = async (req, res) => {
  const { orderID, answer } = req.body;
  if (!orderID || !answer) {
    throw new BadRequestError("please provide all the info");
  }
  const order = await Order.findOne({ _id: orderID });
  if (!order) {
    throw new BadRequestError("Order is no longer available");
  }
  if (order.status === "accepted" || order.status === "rejected") {
    throw new BadRequestError("Order has already been answered");
  }
  if (answer === "accept") {
    order.status = "accepted";
    await order.save();
  } else if (answer === "reject") {
    order.status = "rejected";
    await order.save();
  } else if (answer === "cancel") {
    await Order.findByIdAndDelete({ _id: orderID });
  }
  res.status(200).json({
    msg: "order updated",
    newOrder: answer === "cancel" ? "deleted" : order,
  });
};

const changeOperator = async (req, res) => {
  const { companyId, pin: pin2 } = req.user;
  const { pin } = req.body;
  if (!pin) {
    throw new BadRequestError("Please provide pin");
  }
  if (pin === pin2) {
    throw new BadRequestError("Please enter different pin");
  }
  const userCompany = await Company.findOne({ _id: companyId });
  const newOperator = userCompany.operators.find((x) => x.pin === pin);
  if (!newOperator) {
    throw new BadRequestError("Invalid Pin");
  }
  const token = userCompany.createJWT(pin);
  res.status(200).json({ msg: "success", token });
};

const getInfo = async (req, res) => {
  const { companyId } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  res
    .status(200)
    .json({ name: userCompany.name, accountID: userCompany.accountID });
};

module.exports = {
  getOrderPage,
  sendOrder,
  answerOrder,
  changeOperator,
  getInfo,
};
