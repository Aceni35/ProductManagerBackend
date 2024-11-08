const Company = require("../models/Company");
const Order = require("../models/Order");
const { BadRequestError } = require("../errors");

const getSingleDay = async (req, res) => {
  const { companyId } = req.user;
  const { date: dateStr } = req.query;
  const parts = dateStr.split(" ");
  const day = Number(parts[1]) + 1;
  const monthAbbr = parts[2];
  const year = parts[3];

  const monthMap = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  const month = monthMap[monthAbbr];
  const date = `${year}-${month}-${day}`;

  const newDate = new Date(date);
  const startDay = new Date(newDate.setHours(0, 0, 0, 0));
  const endDay = new Date(newDate.setHours(23, 59, 59, 9999));

  const userCompany = await Company.findOne({ _id: companyId });
  const orders = await Order.find({
    date: {
      $gte: startDay,
      $lte: endDay,
    },
    $or: [
      { "from.accountID": userCompany.accountID },
      { "to.accountID": userCompany.accountID },
    ],
    status: "accepted",
  });
  res.status(200).json({ orders });
};

const getProductsSoldByMonth = async (req, res) => {
  const { companyId } = req.user;
  const { month } = req.query;
  const userCompany = await Company.findOne({ _id: companyId });
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), Number(month) - 1, 1);
  const endDate = new Date(
    currentDate.getFullYear(),
    month,
    0,
    23,
    59,
    59,
    9999
  );
  const orders = await Order.find({
    "from.accountID": userCompany.accountID,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });
  let countedProducts = [];
  orders.map((order) => {
    order.products.map((product) => {
      const exists = countedProducts.find((x) => x.id === product.id);
      if (exists) {
        countedProducts = countedProducts.map((y) => {
          if (y.id === exists.id) {
            return { ...y, value: y.value + Number(product.amount) };
          } else {
            return y;
          }
        });
      } else {
        countedProducts = [
          ...countedProducts,
          {
            label: product.name,
            id: product.id,
            price: product.price,
            value: Number(product.amount),
          },
        ];
      }
    });
  });

  const sortedProducts = countedProducts.sort((a, b) => b.value - a.value);
  if (sortedProducts.length > 5) {
    const savedProducts = sortedProducts.slice(0, 5);
    let otherTotal = 0;
    sortedProducts.slice(5).map((x) => {
      otherTotal += x.value;
    });

    res.status(200).json({
      sortedSales: [
        ...savedProducts,
        { label: "other", value: otherTotal, id: "00" },
      ],
    });
  } else {
    res.status(200).json({ sortedSales: sortedProducts });
  }
};

const getCompanyPurchasesByMonth = async (req, res) => {
  const { companyId } = req.user;
  const { month } = req.query;
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), Number(month) - 1, 1);
  const endDate = new Date(
    currentDate.getFullYear(),
    month,
    0,
    23,
    59,
    59,
    9999
  );
  const userCompany = await Company.findById({ _id: companyId });
  const orders = await Order.find({
    "to.accountID": userCompany.accountID,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  let countedCompanies = [];
  orders.map((order) => {
    const exists = countedCompanies.find((x) => x.id === order.from.accountID);
    if (exists) {
      countedCompanies = countedCompanies.map((y) => {
        if (y.id === order.from.accountID) {
          return { ...y, value: Number(order.total) + y.value };
        } else {
          return y;
        }
      });
    } else {
      countedCompanies = [
        ...countedCompanies,
        {
          label: order.from.name,
          value: Number(order.total),
          id: order.from.accountID,
        },
      ];
    }
  });
  const sortedCompanies = countedCompanies.sort((a, b) => b.value - a.value);
  if (sortedCompanies.length > 5) {
    const savedCompanies = sortedCompanies.slice(0, 5);
    let otherTotal = 0;
    sortedCompanies.slice(5).map((x) => {
      otherTotal += x.value;
    });

    res.status(200).json({
      sortedPurchases: [
        ...savedCompanies,
        { label: "other", value: otherTotal, id: "00" },
      ],
    });
  } else {
    res.status(200).json({ sortedPurchases: sortedCompanies });
  }
};

const getCompanySalesByMonth = async (req, res) => {
  const { companyId } = req.user;
  const { month } = req.query;
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), Number(month) - 1, 1);
  const endDate = new Date(
    currentDate.getFullYear(),
    month,
    0,
    23,
    59,
    59,
    9999
  );
  const userCompany = await Company.findById({ _id: companyId });
  const orders = await Order.find({
    "from.accountID": userCompany.accountID,
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  let countedCompanies = [];
  orders.map((order) => {
    const exists = countedCompanies.find((x) => x.id === order.to.accountID);
    if (exists) {
      countedCompanies = countedCompanies.map((y) => {
        if (y.id === order.to.accountID) {
          return { ...y, value: Number(order.total) + y.value };
        } else {
          return y;
        }
      });
    } else {
      countedCompanies = [
        ...countedCompanies,
        {
          label: order.to.name,
          value: Number(order.total),
          id: order.to.accountID,
        },
      ];
    }
  });
  const sortedCompanies = countedCompanies.sort((a, b) => b.value - a.value);
  if (sortedCompanies.length > 5) {
    const savedCompanies = sortedCompanies.slice(0, 5);
    let otherTotal = 0;
    sortedCompanies.slice(5).map((x) => {
      otherTotal += x.value;
    });

    res.status(200).json({
      sortedPurchases: [
        ...savedCompanies,
        { label: "other", value: otherTotal, id: "00" },
      ],
    });
  } else {
    res.status(200).json({ sortedPurchases: sortedCompanies });
  }
};

function getMonthsAround(month, year) {
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error("Month must be between 01 and 12");
  }
  const result = [];
  for (let i = monthNumber; i > 0; i--) {
    const startOfMonth = new Date(year, i - 1, 1);
    const endOfMonth = new Date(year, i, 0, 23, 59, 59, 999);

    result.push({
      startOfMonth,
      endOfMonth,
      year: year.toString(),
      month: i.toString().padStart(2, "0"),
    });
  }

  for (let i = 12; i > monthNumber; i--) {
    const startOfMonth = new Date(year - 1, i - 1, 1);
    const endOfMonth = new Date(year - 1, i, 0, 23, 59, 59, 999);

    result.push({
      startOfMonth,
      endOfMonth,
      year: (year - 1).toString(),
      month: i.toString().padStart(2, "0"),
    });
  }

  return result;
}

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const getProductSalesYears = async (req, res) => {
  const { companyId } = req.user;
  const { productId } = req.query;

  const userCompany = await Company.findById({ _id: companyId });
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const months = getMonthsAround(month, Number(year));

  const totalSoldByMonth = await Promise.all(
    months.map(async (x) => {
      const orders = await Order.find({
        "from.accountID": userCompany.accountID,
        date: {
          $gte: x.startOfMonth,
          $lte: x.endOfMonth,
        },
        products: {
          $elemMatch: { id: productId },
        },
      });

      const totalSold = orders.reduce((sum, order) => {
        const product = order.products.find((p) => p.id === productId);
        return sum + (product ? parseFloat(product.amount) : 0);
      }, 0);

      return {
        month: x.month,
        monthName: monthNames[parseInt(x.month) - 1],
        year: x.year,
        totalSold,
      };
    })
  );

  res.status(200).json({ totalSoldByMonth: totalSoldByMonth.reverse() });
};

const getProducts = async (req, res) => {
  const { companyId } = req.user;
  const { products } = await Company.findOne({ _id: companyId });
  res.status(200).json({ products });
};

const getCompanies = async (req, res) => {
  const { companyId } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const companies = await Promise.all(
    userCompany.companies.map(async (x) => {
      const { name } = await Company.findOne({ accountID: x });
      return { id: x, name };
    })
  );
  res.status(200).json({ companies });
};

const getCompanyPurchases = async (req, res) => {
  const { companyId } = req.user;
  const { company } = req.query;

  const userCompany = await Company.findById({ _id: companyId });
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();

  const months = getMonthsAround(month, Number(year));

  const purchases = await Promise.all(
    months.map(async (x) => {
      const monthPurchases = await Order.find({
        "from.accountID": company,
        "to.accountID": userCompany.accountID,
        date: {
          $gte: x.startOfMonth,
          $lte: x.endOfMonth,
        },
      });
      let monthTotal = 0;
      monthPurchases.map((order) => {
        monthTotal += Number(order.total);
      });

      return {
        month: x.month,
        monthName: monthNames[parseInt(x.month) - 1],
        year: x.year,
        totalSold: monthTotal,
      };
    })
  );
  res.status(200).json({ purchases: purchases.reverse() });
};

const getCompanySales = async (req, res) => {
  const { companyId } = req.user;
  const { company } = req.query;

  const userCompany = await Company.findById({ _id: companyId });
  const currentDate = new Date();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();

  const months = getMonthsAround(month, Number(year));

  const purchases = await Promise.all(
    months.map(async (x) => {
      const monthPurchases = await Order.find({
        "from.accountID": userCompany.accountID,
        "to.accountID": company,
        date: {
          $gte: x.startOfMonth,
          $lte: x.endOfMonth,
        },
      });
      let monthTotal = 0;
      monthPurchases.map((order) => {
        monthTotal += Number(order.total);
      });

      return {
        month: x.month,
        monthName: monthNames[parseInt(x.month) - 1],
        year: x.year,
        totalSold: monthTotal,
      };
    })
  );
  res.status(200).json({ purchases: purchases.reverse() });
};

const getReceipt = async (req, res) => {
  const { companyId } = req.user;
  const userCompany = await Company.findById({ _id: companyId });
  const { company, fromDate, toDate } = req.query;
  if (!company || !fromDate || !toDate) {
    throw new BadRequestError("Please provide all the details");
  }
  const from = new Date(fromDate);
  const to = new Date(toDate);
  to.setHours(23, 59, 59, 999);
  let orders = await Order.find({
    $or: [
      { "from.accountID": userCompany.accountID, "to.accountID": company },
      { "from.accountID": company, "to.accountID": userCompany.accountID },
    ],
    date: {
      $gte: from,
      $lte: to,
    },
  });

  orders = orders.map((x) => {
    return {
      name: x.name,
      from: x.from,
      to: x.to,
      total: x.total,
      date: x.date.toString().split(" ").slice(0, 4).join("-"),
      time: x.date.toString().split(" ")[4],
      operator: x.operator,
    };
  });

  let totalSales = 0;
  let totalPurchases = 0;
  orders.map((x) => {
    if (x.to.accountID === userCompany.accountID) {
      totalSales += Number(x.total);
    } else {
      totalPurchases += Number(x.total);
    }
  });
  let balance = totalSales - totalPurchases;
  res.status(200).json({ orders, totalPurchases, totalSales, balance });
};

module.exports = {
  getSingleDay,
  getProductsSoldByMonth,
  getCompanyPurchasesByMonth,
  getCompanySalesByMonth,
  getProductSalesYears,
  getProducts,
  getCompanies,
  getCompanyPurchases,
  getCompanySales,
  getReceipt,
};
