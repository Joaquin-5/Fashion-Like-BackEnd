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
