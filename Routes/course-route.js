const router = require("express").Router();
const Course = require("../models").course;
const courseValidation = require("../validation").courseValidation;

router.use((req, res, next) => {
  console.log("正在接受course route");
  next();
});

//首頁
router.get("/", async (req, res) => {
  return res.send("成功到course Route");
});

//獲得所有課程
router.get("/sss", async (req, res) => {
  try {
    let foundCourse = await Course.find({})
      .populate("teacher", ["username", "email"])
      .exec();
    return res.send(foundCourse);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用講師id尋找課程OK
router.get("/teacher/:_teacher_id", async (req, res) => {
  let { _teacher_id } = req.params;
  let courseFound = await Course.find({ teacher: _teacher_id })
    .populate("teacher", ["username", "email"])
    .exec();
  return res.send(courseFound);
});

//用學生id尋找課程OK
router.get("/student/:_student_id", async (req, res) => {
  let { _student_id } = req.params;
  let courseFound = await Course.find({ student: _student_id })
    .populate("teacher", ["username", "email"])
    .exec();
  return res.send(courseFound);
});

//用課程名稱找課程OK
router.get("/findByName/:name", async (req, res) => {
  let { name } = req.params;
  try {
    let courseFound = await Course.find({ title: name })
      .populate("teacher", ["email", "username"])
      .exec();
    return res.send(courseFound);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//用id查詢課程
router.get("/:_id", async (req, res) => {
  let { _id } = req.params;
  try {
    let findCourse = await Course.findOne({ _id })
      .populate("teacher", ["email"])
      .exec();
    return res.send(findCourse);
  } catch (e) {
    return res.status(500).send(e);
  }
});

//發布課程OK
router.post("/", async (req, res) => {
  //驗證數據是否符合規範
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  //驗證身分(學生不能新增課程)
  if (req.user.isStudent()) {
    return res
      .status(400)
      .send("只有講師可以發布新課程，若您已是講師，請用講師帳戶登入");
  }

  let { title, description, price } = req.body;
  try {
    console.log(req.user);
    let newCourse = new Course({
      title,
      description,
      price,
      teacher: req.user._id, //創建這個課程的人，是通過passport-jwt驗證的使用者，user來自驗證過，取得他MongoDB中的_id
    });
    let savedCourse = await newCourse.save();
    return res.send({
      msg: "課程創建成功",
      Course: savedCourse,
    });
  } catch (e) {
    return res.status(500).send("無法創建課程");
  }
});

//學生透過課程id註冊新課程OK
router.post("/enroll/:_id", async (req, res) => {
  let { _id } = req.params;
  let enrolledCourse = await Course.findOne({ _id });
  enrolledCourse.student.push(req.user._id);
  await enrolledCourse.save();
  return res.send("註冊完成");
});

router.post("/enrollOut/:_id", async (req, res) => {
  let { _id } = req.params;
  let enrolledCourse = await Course.findOne({ _id });
  enrolledCourse.student.shift(req.user._id);
  await enrolledCourse.save();
  return res.send("退選成功");
});

//編輯課程OK
router.patch("/:_id", async (req, res) => {
  //驗證數據是否符合規範
  let { error } = courseValidation(req.body);
  if (error) {
    return res.status(400).send(error.details[0].message);
  }

  let { _id } = req.params;

  //確認課程id存在
  try {
    let foundCourse = await Course.findOne({ _id }).exec();
    if (!foundCourse) {
      return res.status(400).send("找不到課程，請重新確認課程資訊");
    }

    // console.log(req.user);
    // console.log(req.user._id);
    // console.log(foundCourse);
    // console.log(foundCourse.teacher);

    // 必須是該課程講師才能編輯課程
    if (foundCourse.teacher.equals(req.user._id)) {
      let updatedCourse = await Course.findOneAndUpdate({ _id }, req.body, {
        new: true,
        runValidators: true,
      }).exec();
      return res.send({ msg: "課程更新成功", updatedCourse });
    } else {
      return res.status(403).send("只有該課程講師可以編輯課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

//刪除課程OK
router.delete("/:_id", async (req, res) => {
  let { _id } = req.params;

  //確認課程id存在
  try {
    let foundCourse = await Course.findOne({ _id }).exec();
    if (!foundCourse) {
      return res.status(400).send("找不到課程，請重新確認課程資訊");
    }

    //必須是該課程講師才能刪除課程
    if (foundCourse.teacher.equals(req.user._id)) {
      await Course.deleteOne({ _id });
      return res.send("課程刪除成功");
    } else {
      return res.status(403).send("只有該課程講師可以刪除課程");
    }
  } catch (e) {
    return res.status(500).send(e);
  }
});

module.exports = router;
