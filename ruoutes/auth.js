const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const schema = mongoose.Schema;

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Email
// const nodemailer = require("nodemailer");

const user = new schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    role: {
      type: String,
      enum: {
        values: ["ROLE_ADMIN", "ROLE_USER"],
        message: "{VALUE} no es un role válido",
        default: "ROLE_USER",
        required: true,
      },
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("user", user);

// router.post("/send-email", (req, res) => {
//   const { email } = req.body;
//   const token = jwt.sign({ email }, process.env.SECRET_KEY, {
//     expiresIn: "24h",
//   });
//   const url = `http://localhost:5000/api/user/verify-email/${token}`;
//   const transporter = nodemailer.createTransport({
//     host: "smtp.ethereal.email",
//     port: 587,
//     secure: false,
//     auth: {
//       user: process.env.EMAIL,
//       pass: process.env.PASSWORD,
//     },
//   });
//   const mailOptions = {
//     from: process.env.EMAIL,
//     to: email,
//     subject: "Verifica tu email",
//     html: `
//                 <h1>Verifica tu email</h1>
//                 <p>Para verificar tu email, haz click en el siguiente enlace</p>
//                 <a href="${url}">${url}</a>
//                 `,
//   };
//   transporter.sendMail(mailOptions, (err, info) => {
//     if (err) {
//       console.log(err);
//       res.status(500).send(err.message);
//     } else {
//       console.log("Email sent");
//       res
//         .status(200)
//         .json({ message: "Revisa tu email para verificar tu cuenta" });
//     }
//   });
// });

// // Verify email
// router.get("/verify-email/:token", (req, res) => {
//   const { token } = req.params;
//   if (token) {
//     jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
//       if (err) {
//         res.status(400).json({ message: "Token no válido" });
//       } else {
//         const { email } = decodedToken;
//         UserModel.findOneAndUpdate(
//           { email },
//           { emailVerified: true },
//           { new: true },
//           (err, user) => {
//             if (err) {
//               res.status(500).json({ message: "Error interno" });
//             } else if (!user) {
//               res.status(404).json({ message: "Usuario no encontrado" });
//             } else {
//               res.status(200).json({ message: "Email verificado" });
//             }
//           }
//         );
//       }
//     });
//   } else {
//     res.json({ message: "Hubo un error" });
//   }
// });

router.post("/register", async (req, res) => {
  let body = req.body;
  let { username, email, password } = body;
  let user = new UserModel({
    username,
    email,
    password: bcrypt.hashSync(password, 10),
    emailVerified: false,
    role: "ROLE_USER",
  });
  user.save((err, usuarioDB) => {
    if (err) {
      return res.status(400).json({
        ok: false,
        err,
      });
    }
    res.json({
      ok: true,
      user: usuarioDB,
    });
  });
});

module.exports = router;

router.post("/login", async (req, res) => {
  let body = req.body;

  UserModel.findOne({ email: body.email }, (erro, usuarioDB) => {
    if (erro) {
      return res.status(500).json({
        ok: false,
        err: erro,
      });
    }
    // Verifica que exista un usuario con el mail escrita por el usuario.
    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "Usuario o contraseña incorrectos",
        },
      });
    }
    // Valida que la contraseña escrita por el usuario, sea la almacenada en la db
    if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "Usuario o contraseña incorrectos",
        },
      });
    }
    if (!usuarioDB.emailVerified) {
      return res.status(400).json({
        ok: false,
        err: {
          message: "Por favor verifique su email",
        },
      });
    }
    // Genera el token de autenticación
    let token = jwt.sign(
      {
        username: usuarioDB.username,
        email: usuarioDB.eamil,
        emailVerified: usuarioDB.emailVerified,
        role: usuarioDB.role,
      },
      process.env.SEED_AUTENTICACION,
      {
        expiresIn: process.env.CADUCIDAD_TOKEN,
      }
    );
    res.json({
      ok: true,
      user: {
        username: usuarioDB.username,
        email: usuarioDB.eamil,
        emailVerified: usuarioDB.emailVerified,
        role: usuarioDB.role,
      },
      token,
    });
  });
});
