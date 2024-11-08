const express = require("express");
const mongoose = require("mongoose");
require("express-async-errors");
require("dotenv").config();
const cors = require("cors");

const app = express();

const socket = require("socket.io");
const io = socket(3000, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

app.use(cors());
app.use(express.json());
const errorHandler = require("./middleware/errorHandler");

// middleware
const authentication = require("./middleware/authentication");
const checkManagement = require("./middleware/checkManagement");
const checkAnalytics = require("./middleware/checkAnalytics");

//Routers
const authRouter = require("./routers/auth");
const managementRouter = require("./routers/management");
const orderRouter = require("./routers/Orders");
const analyticsRouter = require("./routers/analytics");

app.use("/api", authRouter);
app.use("/api", authentication, orderRouter);
app.use("/api/analytics", authentication, checkAnalytics, analyticsRouter);
app.use("/api/manage", authentication, checkManagement, managementRouter);

app.use(errorHandler);

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(5000, () => {
      console.log("listening...");
    });
  } catch (error) {
    console.log(error);
  }
};

io.on("connection", (socket) => {
  const id = socket.handshake.query.id;
  socket.join(id);
  console.log(`${id} has connected`);
  socket.on("send-order", (info) => {
    socket.to(info.to.accountID).emit("new-order", info);
  });
  socket.on("cancel-order", (to, orderID) => {
    socket.to(to).emit("order-canceled", orderID);
  });
  socket.on("accept-order", (orderID, to) => {
    socket.to(to).emit("order-accepted", orderID);
  });
  socket.on("reject-order", (orderID, to) => {
    socket.to(to).emit("order-rejected", orderID);
  });
});

connect();
