const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { dbUrl } = require("../dbConfig");
const { UserModel } = require("../schema/UserSchema");
const { createToken, validate, adminGaurd,hashPassword, comparePassword } = require("../auth");

const connectDb=async()=>{
  await mongoose.connect(dbUrl);
  console.log("mongodb connected")
  }
  connectDb()
router.get("/", async (req, res) => {
  res.send(`
    <h2>Available Routes</h2>
    <div>GET /user/all</div>
    <div>GET /user/:id</div>
    <div>POST /user/signup</div>
    <div>POST /user/signin</div>
    <div>POST /user/change-password/:id</div>

    `);
});

router.get("/all", validate, adminGaurd, async (req, res) => {
  try {
    let users = await UserModel.find();
    res.status(200).send({
      message: "Data Fetch Successfull",
      users,
    });
  } catch (error) {
    res.status(500).send({ message: "Internal Server Error" });
  }
});

// router.post('/signup', async (req, res) => {
//   try {
//     let user = await UserModel.findOne({ email: req.body.email });
//     if (!user) {
//       let newUser = await UserModel.create(req.body);
//       res.status(200).send({ message: "User Created Succesfully" });
//     } else {
//       res
//         .sendStatus(400)
//         .send({ message: `User with ${req.body.email}already exists` });
//     }
//   } catch (error) {
//     res.status(500).send({
//       message: "Internal Server Error",
//       error: error?.message,
//     });
//   }
// });

router.post("/signup", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      req.body.password=await hashPassword(req.body.password)
      let newUser = await UserModel.create(req.body);
      return res.status(200).send({ message: "User Created Successfully" });
    }
    return res
      .status(400)
      .send({ message: `User with ${req.body.email} already exists` });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error?.message,
    });
  }
});

router.post("/signin", async (req, res) => {
  try {
    let user = await UserModel.findOne({ email: req.body.email });
    if (user) {
      if (await comparePassword(req.body.password,user.password)) {
      
        let token = await createToken(user);
        return res.status(200).send({
          
          message: "Login Successfully",
          token,
        });
      } else {
        return res.status(400).send({ message: "Invalid Credentials" });
      }
    }
    return res
      .status(400)
      .send({ message: `User with ${req.body.email} does not exists` });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error?.message,
    });
  }
});

// router.post("/signin", async (req, res) => {

//   try {
//     let user = await UserModel.findOne({ email: req.body.email });
//     if (user) {
//       if (user.password === req.body.password) {
//         return res.status(200).send({
//           message: "Login Successfully",
//         });
//       } else {
//         return res.status(400).send({ message: "Invalid Credentials" });
//       }
//     }
//     return res
//       .status(400)
//       .send({ message: `User with ${req.body.email} does not exist` });
//   } catch (error) {
//     return res.status(500).send({
//       message: "Internal Server Error",
//       error: error?.message,
//     });
//   }
// });

router.post("/change-password/:id",validate, async (req, res) => {
  try {
    let user = await UserModel.findById(req.params.id );
    if (user) {

      if (await comparePassword(req.body.current_password,user.password)) {
        user.password=await hashPassword(req.body.new_password)
        user.save()
        return res.status(200).send({
          message: "Password Changed Successfully"
          
        });
      } else {
        return res.status(400).send({ message: " Invalid Current Password" });
      }
    }
    return res
      .status(400)
      .send({ message: `User does not exists` });
  } catch (error) {
    return res.status(500).send({
      message: "Internal Server Error",
      error: error?.message,
    });
  }
});

router.get("/:id", validate, async (req, res) => {
  try {
    let data = await UserModel.findById(req.params.id);
    if (data) {
      res.status(200).send({
        message: "Data Fetch Successfull",
        data,
      });
    } else {
      res.status(400).send({ message: "Invalid Id" });
    }
  } catch (error) {
    res.status(500).send({
      message: "Internal Server Error",
    });
  }
});

module.exports = router;
