// Check JWT TOKEN in header
const jwt = require("jsonwebtoken");

// module.exports = async (req, res, next) => {
//   try {
//     // Get token from header
//     const token = req.headers.authorization.split(" ")[1];
//     // Verify token
//     const decoded = await jwt.verify(token, process.env.SEED_AUTENTICACION);
//     // Add user from payload
//     req.user = decoded;
//     next();
//   } catch (error) {
//     return res.status(401).send({
//       error: "Please authenticate."
//     });
//   }
// };

const decodeToken = (token) => {
  return new Promise((resolve, reject) => {
    if (token) {
      jwt.verify(token, process.env.SEED_AUTENTICACION, (err, decoded) => {
        if (err) {
          reject(null);
        } else {
          resolve(decoded);
        }
      });
    } else {
      reject(null);
    }
  });
};

module.exports = {
  decodeToken,
};
