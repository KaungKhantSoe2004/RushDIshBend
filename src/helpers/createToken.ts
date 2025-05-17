const jwt = require("jsonwebtoken");
const getToken = (id: number, role: string): string => {
  const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: 3 * 24 * 60 * 60,
  });
  return token;
};
export default getToken;
