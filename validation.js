const joi = require("joi");

const registerValidation = (data) => {
  const schema = joi.object({
    username: joi.string().min(3).max(50).required(),
    email: joi.string().min(6).max(50).required().email(),
    password: joi.string().min(6).max(255).required(),
    role: joi.string().required().valid("student", "teacher"),
  });
  return schema.validate(data); //告知validator的結果
};

const loginValidation = (data) => {
  const schema = joi.object({
    email: joi.string().min(6).max(50).required().email(),
    password: joi.string().min(6).max(255).required(),
  });
  return schema.validate(data);
};

const courseValidation = (data) => {
  const schema = joi.object({
    title: joi.string().min(6).max(50).required(),
    description: joi.string().min(6).max(50).required(),
    price: joi.number().min(10).max(9999).required(),
  });
  return schema.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
module.exports.courseValidation = courseValidation;
