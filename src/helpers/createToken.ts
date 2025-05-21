const jwt = require("jsonwebtoken");
const getToken = (id: number, role: string, auth: string): string => {
  const token = jwt.sign({ id, role, auth }, process.env.JWT_SECRET, {
    expiresIn: 3 * 24 * 60 * 60,
  });
  return token;
};
export default getToken;
