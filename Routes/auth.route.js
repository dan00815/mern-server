const router = require("express").Router();
const registerValidation = require("../validation.js").registerValidation;
const loginValidation = require("../validation.js").loginValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

//debug 的 middleware
router.use((req, res, next) => {
  next();
});

//測試連線成功
router.get("/", (req, res) => {
  return res.send("成功連結auth/test的Route");
});

//debug
router.get("/sss", async (req, res) => {
  let founded = await User.find({});
  res.send(founded);
});

//註冊使用者OK
router.post("/register", async (req, res) => {
  //確認註冊數據是否符合規定，用joi套件製作出來的validators驗證
  let { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //確認信箱是否被註冊過           //第一個是User裡面已儲存的email，第二個是我們打得email，有無一樣
  const emailExist = await User.findOne({ email: req.body.email }).exec();
  if (emailExist) return res.status(400).send("此信箱已被註冊過");

  //製作新用戶
  let { username, email, password, role } = req.body;
  let newUser = new User({ username, email, password, role });
  try {
    let savedUser = await newUser.save();
    return res.send({
      msg: "註冊使用者成功",
      savedUser,
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send("無法儲存使用者");
  }
});

//登入系統OK
router.post("/login", async (req, res) => {
  //確認登入資訊是否符合規定
  let { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }
  //確認信箱是否有註冊過           //第一個是User裡面已儲存的email，印出req.body會是一個物件，輸入資料的物件
  const foundUser = await User.findOne({ email: req.body.email }).exec();
  if (!foundUser) {
    return res.status(401).send("該email找不到使用者");
  }

  //確認密碼是否正確，用auth Route的instance method
  foundUser.comparePassword(req.body.password, (err, isMatched) => {
    //isMatch 是comparePassword的結果

    if (err) return res.status(500).send(err); //第一種狀況有err就會回傳err的參數

    //第二種狀況要判斷isMatched，也就是 是否有密碼打錯
    if (isMatched) {
      //密碼打對，製作jwt
      const tokenObj = { _id: foundUser._id, email: foundUser.email };
      const token = jwt.sign(tokenObj, process.env.PASSPORT_SECRET);
      return res.send({
        msg: "成功登入",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      //密碼打錯時
      return res.status(401).send("密碼錯誤");
    }
  });
});

//更改使用者資料~~~
router.patch("/:_id", async (req, res) => {
  //確認要改的資訊有沒有符合規則
  let { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //確認信箱是否被註冊過           //第一個是User裡面已儲存的email，第二個是我們打得email，有無一樣
  const emailExist = await User.findOne({ email: req.body.email }).exec();
  if (emailExist) return res.status(400).send("不能改成這個mail啦，有人用過了");

  let { _id } = req.params;
  try {
    let updatedUser = await User.findOneAndUpdate({ _id }, req.body, {
      new: true,
      runValidators: true,
    }).exec();
    return res.send({
      msg: "使用者資料更新成功",
      updatedUser,
    });
  } catch (e) {
    return res.send(e);
  }
});

router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;
  let deletedMSG = await User.deleteOne({ _id });
  console.log(deletedMSG);
  return res.send("刪除使用者成功");
});

module.exports = router;
