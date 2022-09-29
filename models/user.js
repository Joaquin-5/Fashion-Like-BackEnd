const mongoose = require("mongoose");
const schema = mongoose.Schema;

const user = new schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: {
        values: ["ROLE_ADMIN", "ROLE_USER", "ROLE_OWNER"],
        message: "{VALUE} no es un role válido",
        default: "ROLE_USER",
        required: true,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("user", user);