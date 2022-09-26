const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Email
const nodemailer = require("nodemailer");
const googleapis = require("googleapis");
const User = require("../models/user");
const OAuth2 = googleapis.google.auth.OAuth2;

router.post("/send-email", (req, res) => {
  const { email } = req.body;
  User.findOne({ email }, (err, user) => {
    if (err) {
      res.status(500).send(err);
    } else if (!user) {
      res.status(404).send("No existe el usuario");
    } else {
      sendEmailWithGmail(email);
    }
  });
});

// // Verify email
router.get("/verify-email/:token", (req, res) => {
  const { token } = req.params;
  if (token) {
    jwt.verify(token, process.env.SECRET_KEY, (err, decodedToken) => {
      if (err) {
        res.status(400).json({ message: "Token no válido" });
      } else {
        const { email } = decodedToken;
        User.findOneAndUpdate(
          { email },
          { emailVerified: true },
          { new: true },
          (err, user) => {
            if (err) {
              res.status(500).json({ message: "Error interno" });
            } else if (!user) {
              res.status(404).json({ message: "Usuario no encontrado" });
            } else {
              res.status(200).json({ message: "Email verificado" });
            }
          }
        );
      }
    });
  } else {
    res.json({ message: "Hubo un error" });
  }
});

router.post("/register", async (req, res) => {
  let body = req.body;
  let { username, email, password } = body;
  let user = new User({
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
    sendEmailWithGmail(usuarioDB.email);
    res.json({
      ok: true,
      user: usuarioDB,
    });
  });
});

module.exports = router;

router.post("/login", async (req, res) => {
  let body = req.body;

  User.findOne({ email: body.email }, (erro, usuarioDB) => {
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
      sendEmailWithGmail(usuarioDB.email);
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
        id: usuarioDB._id,
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
        id: usuarioDB._id,
      },
      token,
    });
  });
});

const sendEmailWithGmail = (email) => {
  const token = jwt.sign({ email }, process.env.SECRET_KEY, {
    expiresIn: "24h",
  });
  const url = `https://fashion-like-api.herokuapp.com/api/user/verify-email/${token}`;
  const mailOptions = {
    from: "fashionliketest@gmail.com",
    to: email,
    subject: "Verifica tu email",
    html: `
      <h1>Verifica tu email</h1>
      <p>Para verificar tu email, haz click en el siguiente enlace</p>
      <a href="${url}">${url}</a>
    `,
  };
  const oauth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    tls: {
      rejectUnauthorized: false,
    },
  });

  oauth2Client.getAccessToken((err, token) => {
    if (err) {
      return console.log(err);
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_SECRET,
        refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
        accessToken: token,
      },
    });
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.log(err);
        res.status(500).send({
          err,
          info,
        });
      } else {
        res
          .status(200)
          .json({ message: "Revisa tu email para verificar tu cuenta" });
      }
    });
  });
};

router.get("/check-auth/:token", async (req, res) => {
  const token = req.params.token;
  if (token) {
    jwt.verify(token, process.env.SEED_AUTENTICACION, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          ok: false,
          err: {
            message: "Token no válido",
          },
        });
      }
      const { username } = decoded;
      User.findOne({ username }, (err, userDB) => {
        if (err) {
          return res.status(500).json({
            ok: false,
            err,
          });
        }
        if (!userDB) {
          return res.status(400).json({
            ok: false,
            err: {
              message: "Usuario no encontrado",
            },
          });
        }
        const token = jwt.sign(
          {
            email: userDB.email,
            username: userDB.username,
            emailVerified: userDB.emailVerified,
            role: userDB.role,
            id: userDB._id,
          },
          process.env.SEED_AUTENTICACION,
          {
            expiresIn: process.env.CADUCIDAD_TOKEN,
          }
        );
        res.json({
          ok: true,
          user: {
            username: userDB.username,
            email: userDB.eamil,
            emailVerified: userDB.emailVerified,
            role: userDB.role,
            id: userDB._id,
          },
          token,
        });
      });
    });
  } else {
    return res.status(401).json({
      ok: false,
      err: {
        message: "Token no enviado",
      },
    });
  }
});
