import express from "express";
import { authMiddleware } from "../authmiddleware";
import { Account } from "../db";
import mongoose from "mongoose";
const accountRouter = express.Router();

accountRouter.get("/balance", authMiddleware, async (req, res) => {
  //make db call to get the balance
  try {
    const balance = await Account.findOne({ userId: req.userId }).balance;
    res.status(200).json({ balance });
  } catch (err) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

accountRouter.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount, to } = req.body;

  // Fetch the accounts within the transaction
  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );

  if (!account || account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Insufficient balance",
    });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);

  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({
      message: "Invalid account",
    });
  }

  // Perform the transfer
  await Account.updateOne(
    { userId: req.userId },
    { $inc: { balance: -amount } }
  ).session(session);
  await Account.updateOne(
    { userId: to },
    { $inc: { balance: amount } }
  ).session(session);

  // Commit the transaction
  await session.commitTransaction();

  res.json({
    message: "Transfer successful",
  });
});

module.exports = { accountRouter };
