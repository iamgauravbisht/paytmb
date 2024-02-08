const express = require("express");
const jwt = require("jsonwebtoken");
const zod = require("zod");
const { User } = require("../db");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../authmiddleware");
const { Account } = require("../db");

const userRouter = express.Router();

const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6),
  firstName: zod.string().max(50),
  lastName: zod.string().max(50),
});

userRouter.post("/signup", async (req, res) => {
  const result = signupSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const user = User.findOne({ username: req.body.username });
  if (user._id) {
    res.status(400).json({
      message: "Email already taken",
    });
  }

  //make db call and creata a user
  const newUser = await User.create(req.body);
  //setup account for the user
  const newAccount = await Account.create({
    userId: newUser._id,
    balance: 1 + Math.random() * 1000,
  });

  //take data and make its jwt token
  const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, {
    expiresIn: "24h",
  });

  res.status(201).json({
    message: "User created successfully",
    token: token,
  });
});

const signinSchema = zod.object({
  username: zod.string().email(),
  password: zod.string().min(6),
});

userRouter.post("signin", (req, res) => {
  const result = signinSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      message: "Incorrect inputs",
    });
  }
  //decrypt the password
  //make db call and find the user
  const user = User.findOne({ username: req.body.username });
  if (!user._id) {
    res.status(400).json({
      message: "User not found",
    });
  }
  //compare the password
  const isPasswordCorrect = user.password === req.body.password;
  if (!isPasswordCorrect) {
    res.status(400).json({
      message: "Incorrect password",
    });
  }
  //take data and make its jwt token
  const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
    expiresIn: "24h",
  });

  //return details and token
  res.status(200).json({
    message: "User logged in successfully",
    token: token,
  });
});

const updateBody = zod.object({
  password: zod.string().min(6).optional(),
  firstName: zod.string().max(50).optional(),
  lastName: zod.string().max(50).optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while updating information",
    });
  }
  try {
    await User.updateOne(req.body, {
      _id: req.userId,
    });
    res.json({
      message: "Updated successfully",
    });
  } catch (err) {
    res.status(500).json({
      message: "Error while updating information",
    });
  }
});

userRouter.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = userRouter;
