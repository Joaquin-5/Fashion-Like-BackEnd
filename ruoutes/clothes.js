const express = require("express");
const router = express.Router();

const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;

cloudinary.config(process.env.CLOUDINARY_URL || "");

const mongoose = require("mongoose");
const { decodeToken } = require("../middleware/check-auth");
const schema = mongoose.Schema;

const clothes = new schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String,
    // like, dislike, neutral - per user id
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    dislikes: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    neutrals: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
  },
  { timestamps: true }
);

const ClothesModel = mongoose.model("clothes", clothes);
module.exports = router;

router.get("/example", (rq, res) => {
  res.end("hi");
});

router.post("/add", async (req, res) => {
  const form = new formidable.IncomingForm();
  let title = "";
  let description = "";

  form.parse(req, (err, fields, files) => {
    if (!fields.title) {
      return res.status(400).send({ msg: "El titulo es obligatorio" });
    }
    title = fields.title;
    description = fields.description;
  });

  try {
    const imageURL = await parseFiles(req);

    const newC = new ClothesModel({
      title,
      description,
      image: imageURL,
    });
    await newC.save();
    return res.status(201).json({ ok: true, clothes: newC });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ msg: "Error cargando la imagen", error });
  }
});

//gett

router.get("/get", async (req, res) => {
  const clothes = await ClothesModel.find();
  res.status(200).json({ clothes });
});

const parseFiles = async (req) => {
  return new Promise((resolve, reject) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
      } else {
        const filePath = await saveInCloudinary(files.file);
        resolve(filePath);
      }
    });
  });
};

const saveInCloudinary = async (file) => {
  const { secure_url } = await cloudinary.uploader.upload(file.filepath);
  return secure_url;
};

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const form = new formidable.IncomingForm();
  let title = "";
  let description = "";
  let imageURL = "";
  let hasImage;

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, msg: "No es un id valido" });

  const clothes = await ClothesModel.findById(id);
  if (!clothes) {
    return res.status(404).json({ msg: `No existe esa ropa con el id: ${id}` });
  }

  form.parse(req, async (err, fields, files) => {
    if (!fields.title) {
      return res.status(400).send({ msg: "El titulo es obligatorio" });
    }
    if (!files.file) hasImage = false;
    else hasImage = true;
    if (fields.file === clothes.image) imageURL = clothes.image;
    title = fields.title;
    description = fields.description;
    imageURL = hasImage
      ? await saveInCloudinary(files.file)
      : fields.file === clothes.image
      ? clothes.image
      : fields.file;
    try {
      const toUpdate = {
        title: title || clothes.title,
        description: description || clothes.description,
        image: imageURL,
      };
      const updateClothes = await ClothesModel.findByIdAndUpdate(id, toUpdate, {
        new: true,
      });
      return res.status(200).json({
        ok: true,
        updatePost: updateClothes,
      });
    } catch (error) {
      return res.status(500).json({ msg: "Error check server logs", error });
    }
  });
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, msg: "No es un id valido" });
  const clothes = await ClothesModel.findById(id);
  if (!clothes) {
    return res.status(404).json({ msg: `No existe esa ropa con el id: ${id}` });
  }
  try {
    await ClothesModel.findByIdAndDelete(id);

    return res.status(200).json({ msg: "La ropa fue eliminada correctamente" });
  } catch (error) {
    return res.status(500).json({ msg: "Error check server logs", error });
  }
});

router.put("/like/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, msg: "No es un id valido" });
  const clothes = await ClothesModel.findById(id);
  if (!clothes) {
    return res.status(404).json({ msg: `No existe esa ropa con el id: ${id}` });
  }
  const userFromToken = await decodeToken(req.headers.authorization);
  if (!userFromToken)
    return res.status(401).json({ msg: "No estas autorizado" });
  try {
    if (clothes.likes.includes(userFromToken.id)) {
      clothes.likes.pull(userFromToken.id);
      await clothes.save();
      return res.status(200).json({
        msg: "Ya no le diste dislike a esta ropa",
        clothes,
      });
    }
    clothes.likes.push(userFromToken.id);
    clothes.dislikes.pull(userFromToken.id);
    clothes.neutrals.pull(userFromToken.id);
    await clothes.save();
    return res.status(200).json({
      msg: "Le diste like a esta ropa",
      clothes,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error check server logs", error });
  }
});

router.put("/dislike/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, msg: "No es un id valido" });
  const clothes = await ClothesModel.findById(id);
  if (!clothes) {
    return res.status(404).json({ msg: `No existe esa ropa con el id: ${id}` });
  }
  const userFromToken = await decodeToken(req.headers.authorization);
  if (!userFromToken)
    return res.status(401).json({ msg: "No estas autorizado" });
  try {
    if (clothes.dislikes.includes(userFromToken.id)) {
      clothes.dislikes.pull(userFromToken.id);
      await clothes.save();
      return res.status(200).json({
        msg: "Ya no le diste dislike a esta ropa",
        clothes,
      });
    }
    clothes.dislikes.push(userFromToken.id);
    clothes.likes.pull(userFromToken.id);
    clothes.neutrals.pull(userFromToken.id);
    await clothes.save();
    return res.status(200).json({
      msg: "Le diste dislike a esta ropa",
      clothes,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error check server logs", error });
  }
});

router.put("/neutral/:id", async (req, res) => {
  // get user id from token

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(400).json({ ok: false, msg: "No es un id valido" });
  const userFromToken = await decodeToken(req.headers.authorization);
  if (!userFromToken)
    return res.status(401).json({ msg: "No estas autorizado" });
  const clothes = await ClothesModel.findById(id);
  if (!clothes) {
    return res.status(404).json({ msg: `No existe esa ropa con el id: ${id}` });
  }
  try {
    if (clothes.neutrals.includes(userFromToken.id)) {
      clothes.neutrals.pull(userFromToken.id);
      await clothes.save();
      return res.status(200).json({
        msg: "Ya no le diste dislike a esta ropa",
        clothes,
      });
    }
    clothes.neutrals.push(userFromToken.id);
    clothes.likes.pull(userFromToken.id);
    clothes.dislikes.pull(userFromToken.id);
    await clothes.save();
    return res.status(200).json({
      msg: "Le diste neutral a esta ropa",
      clothes,
    });
  } catch (error) {
    return res.status(500).json({ msg: "Error check server logs", error });
  }
});
