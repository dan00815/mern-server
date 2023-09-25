const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

const userSchema = new Schema({
  username: { type: String, require: true, minlength: 3, maxlength: 50 },
  email: {
    type: String,
    require: true,
    minlength: 6,
    maxlength: 50,
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: ["student", "teacher"],
    require: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

//instance methods
userSchema.methods.isStudent = function () {
  return this.role == "student";
};
userSchema.methods.isTeacher = function () {
  return this.role == "teacher";
};
userSchema.methods.comparePassword = async function (password, cb) {
  //cb這個參數是一個callbackFn
  let result;
  try {
    result = await bcrypt.compare(password, this.password);
    return cb(null, result);
    //result的value會是true or false
  } catch (e) {
    return cb(e, result);
  }
};

//mongoose middleware
userSchema.pre("save", async function (next) {
  //this代表mongoDB裡面的document
  if (this.isNew || this.isModified("password")) {
    //雜湊處理
    const hashValue = await bcrypt.hash(this.password, 10);
    this.password = hashValue;
  }
  next();
});

module.exports = mongoose.model("User", userSchema);
