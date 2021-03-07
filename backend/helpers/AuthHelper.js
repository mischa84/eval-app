const JWT = require("jsonwebtoken");
const { JWT_SECRET } = process.env;

const createToken = (user) => {
  return JWT.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });
};

const verifyToken = (token) => {
  return JWT.verify(token, JWT_SECRET);
};

const decodeToken = (token) => {
  return JWT.decode(token, { complete: true });
};

const validEmail = (email) => {
  const emailRegex = /[^@]+@[^\.]+\..+/;
  return emailRegex.test(email);
};

const validPassword = (password) => {
  const passwordRegex = /^.{6,}$/;
  return passwordRegex.test(password);
};

module.exports = {
  createToken,
  verifyToken,
  decodeToken,
  validEmail,
  validPassword,
};
