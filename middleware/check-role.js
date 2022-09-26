// middleware check role admin
const { decodeToken } = require("../middleware/check-auth");

module.exports = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization.split(" ")[1];
    // Verify token
    const decoded = await decodeToken(token);
    // Add user from payload
    req.user = decoded;
    if (req.user.role === "ROLE_ADMIN") {
      next();
    } else {
      return res.status(401).send({
        ok: false,
        error: "You are not an admin.",
      });
    }
  } catch (error) {
    return res.status(401).send({
      ok: false,
      error: "Please authenticate.",
    });
  }
};
