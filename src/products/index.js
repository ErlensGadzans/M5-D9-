const express = require("express");
const fs = require("fs");
const path = require("path");
const uniqid = require("uniqid");
const reviewsRoutes = require("../reviews");
const { begin } = require("xmlbuilder");
const axios = require("axios");
const { parseString } = require("xml2js");
const { promisify } = require("util");
const { createReadStream } = require("fs-extra");

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

router.get("/sum/TwoPrices", async (req, res, next) => {
  try {
    //Need to add two prices using an extenal website, that only exepts xmls
    // 1) get prices from the id's given in req.query
    const { id1, id2 } = req.query; //
    const productDB = await readDatabase(); //getting info from db

    const product1 = productDB.find((product) => product._id === id1);
    const product2 = productDB.find((product) => product._id === id2);

    console.log(product1, product2);

    // 2) create xml variable according to websites request structure

    const xmlBody = begin()
      .ele("soap:Envelope", {
        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
        "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
        "xmlns:soap": "http://schemas.xmlsoap.org/soap/envelope/",
      })

      .ele("soap:Body")
      .ele("Add", { xmlns: "http://tempuri.org/" })
      .ele("intA")
      .text(parseInt(product1.price))
      .up()
      .ele("intB")
      .text(parseInt(product2.price))
      .end();

    {
      /* <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <Add xmlns="http://tempuri.org/">
      <intA>int</intA>
      <intB>int</intB>
    </Add>
  </soap:Body>
</soap:Envelope> */
    }

    // 3) send request to webisre via axios

    const { data } = await axios({
      method: "post",
      url: "http://www.dneonline.com/calculator.asmx?op=Add",
      data: xmlBody,
      headers: { "Content-Type": "text/xml" },
    });

    // 4) turn result to json, send as response to client

    const asyncParser = promisify(parseString);

    const xml = data;

    const parsedJS = await asyncParser(xml);

    const addedResult =
      parsedJS["soap:Envelope"]["soap:Body"][0]["AddResponse"][0][
        "AddResult"
      ][0];

    // res.setHeader("Content-Type", "text/xml");
    res.send(addedResult);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

module.exports = router;
