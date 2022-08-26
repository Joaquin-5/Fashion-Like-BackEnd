const express = require("express");
const router = express.Router();

const formidable = require("formidable");
const cloudinary = require("cloudinary").v2;

cloudinary.config(process.env.CLOUDINARY_URL || "");

const mongoose = require("mongoose");
const schema = mongoose.Schema;

const clothes = new schema(
  {
    title: { type: String, required: true },
    description: String,
    image: String,
  },
  { timestamps: true }
);

const ClothesModel = mongoose.model("clothes", clothes);
module.exports = router;
/*
router.get('/example',(rq, res)=>{
    res.end('hi')
})*/

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

//get

router.get("/get", (req, res) => {
  ClothesModel.find({}, function (docs, err) {
    if (!err) {
      res.send(docs);
    } else {
      res.send(err);
    }
  });
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
