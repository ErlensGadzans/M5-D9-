const express = require("express");
const multer = require("multer");
const {
  writeFile,
  createReadStream,
  readJSON,
  writeJSON,
} = require("fs-extra");
const { join, extname } = require("path");
const { pipeline } = require("stream");

const router = express.Router();

const upload = multer({});

const productsImagePath = join(__dirname, "../../public/img/products");
const productsDBFolderPath = join(__dirname, "../products/products.json");

router.post(
  "/:id/upload",
  upload.single("productImg"),
  async (req, res, next) => {
    const productsDB = await readJSON(productsDBFolderPath);
    const index = productsDB.findIndex(
      (product) => product._id === req.params.id
    );

    if (index !== -1) {
      const productName = req.params.id + extname(req.file.originalname);

      try {
        await writeFile(join(productsImagePath, productName), req.file.buffer);
        productsDB[index].image = `http://localhost:3077/images/${productName}`;
        await writeJSON(productsDBFolderPath, productsDB);
        res.send(productsDB[index]);
      } catch (err) {
        console.log(err);
        next(err);
      }
    } else {
      res.status(404).send("Not found");
    }
  }
);

router.get("/:name", (res, req, next) => {
  const source = createReadStream(
    join(productsImagePath, `${req.params.name}`)
  );
  pipeline(source, res, (error) => console.log(error));
});
module.exports = router;
