const express = require("express");
const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const reviewsRoutes = require("../reviews");

const { readDB } = require("../lib/utilities");

const router = express.Router();

router.use("/reviews", reviewsRoutes);

const productsFilePath = path.join(__dirname, "products.json");

const readDatabase = () => {
  const fileAsBuffer = fs.readFileSync(productsFilePath);
  const fileAsAString = fileAsBuffer.toString();
  const productsArray = JSON.parse(fileAsAString);
  return productsArray;
};

router.get("/", (req, res, next) => {
  try {
    const productsArray = readDatabase();

    res.send(productsArray);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.get("/:id", (req, res, next) => {
  try {
    const productsArray = readDatabase();
    const singleProduct = productsArray.filter(
      (product) => product._id === req.params.id
    );

    res.status(201).send(singleProduct);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.post("/", (req, res, next) => {
  try {
    const newProduct = req.body;
    const productsArray = readDatabase();

    newProduct._id = uniqid();
    newProduct.createdAt = new Date();
    newProduct.updatedAt = new Date();
    productsArray.push(newProduct);
    fs.writeFileSync(productsFilePath, JSON.stringify(productsArray));
    res.status(201).send(newProduct);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.put("/:id", (req, res, next) => {
  try {
    const productsArray = readDatabase();
    const singleProduct = productsArray.filter(
      (product) => product._id === req.params.id
    );
    const filteredArray = productsArray.filter(
      (product) => product._id !== req.params.id
    );

    const editedProduct = req.body;
    editedProduct._id = singleProduct[0]._id;
    editedProduct.createdAt = singleProduct[0].createdAt;
    editedProduct.updatedAt = new Date();
    filteredArray.push(editedProduct);

    fs.writeFileSync(productsFilePath, JSON.stringify(filteredArray));
    res.status(201).send(editedProduct);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.delete("/:id", (req, res, next) => {
  try {
    const productsArray = readDatabase();
    const singleProduct = productsArray.filter(
      (product) => product._id === req.params.id
    );
    const filteredArray = productsArray.filter(
      (product) => product._id !== req.params.id
    );

    const deletedProduct = req.body;
    fs.writeFileSync(productsFilePath, JSON.stringify(filteredArray));
    res.status(201).send(filteredArray);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.get("/:id/reviews", async (req, res, next) => {
  try {
    const reviewDataBase = await readDB(
      path.join(__dirname, "../reviews/reviews.json")
    );
    if (reviewDataBase.length > 0) {
      const productReviews = reviewDataBase.filter(
        (review) => review.productID === req.params.id
      );
      res.status(201).send(productReviews);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "The review databse is empty!";
    }
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

module.exports = router;
