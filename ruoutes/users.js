const express = require("express");
const User = require("../models/user");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      ok: true,
      users: users.map((user) => {
        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          emailVerified: user.emailVerified,
          role: user.role,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error,
    });
  }
});

// Change role
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  // if (role === "ROLE_ADMIN" || role === "ROLE_USER") {
  if (role !== "ROLE_ADMIN" && role !== "ROLE_USER") {
    return res.status(400).json({
      ok: false,
      message: "Role no válido",
    });
  }
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      ok: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error,
    });
  }
});

// Change verified email
router.patch("/email/:id", async (req, res) => {
  const { id } = req.params;
  const { emailVerified } = req.body;
  if (emailVerified !== true && emailVerified !== false) {
    return res.status(400).json({
      ok: false,
      message: "emailVerified no válido",
    });
  }
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { emailVerified },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      ok: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error,
    });
  }
});

// Delete user
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found",
      });
    }
    res.status(200).json({
      ok: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        emailVerified: user.emailVerified,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error,
    });
  }
});


module.exports = router;
