const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const { check, validationResult } = require("express-validator");
const { readDB, writeDB } = require("../lib/utilities");
const axios = require("axios");

const router = express.Router();

const cartsFilePath = path.join(__dirname, "carts.json");
const productsFilePath = path.join(__dirname, "../products/products.json");

router.get("/", async (req, res, next) => {
  try {
    const cartDB = await readDB(cartsFilePath);
    if (cartDB.length > 0) {
      res.status(201).send(cartDB);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "The cart database is empty dood";
      next(err);
    }
  } catch (err) {
    err.httpStatueCode = 404;
    next(err);
  }
});

router.get("/:cartID", async (req, res, next) => {
  try {
    const cartDB = await readDB(cartsFilePath);
    const selectedCart = cartDB.findIndex(
      //trying out findIndex.
      //It returns the index of the first element that matches the requirement.
      //In this case, the cart ID
      (cart) => cart._id === req.params.cartID
    );
    if (selectedCart !== -1) {
      //If findIndex cant find a match, it will return -1
      res.status(201).send(cartDB[selectedCart]);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "There is no cart with that ID dood";
      next(err);
    }
  } catch (err) {
    err.httpStatueCode = 404;
    next(err);
  }
});

router.post(
  "/",
  [
    check("ownerId").exists().withMessage("We need your unique id"),
    check("name").exists().withMessage("You need to give your first name"),
    check("surname").exists().withMessage("You need to give your surname"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = {};
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const cartDB = await readDB(cartsFilePath);
      const newCart = { ...req.body, _id: uniqid(), products: [], total: 0 };
      //This is shorthand creation of an object.
      // ...req.body copies all the prop/key pairs from thr body of the request
      // the others are making new prop/key pairs as you know
      cartDB.push(newCart);
      await writeDB(cartsFilePath, cartDB);
      res.status(201).send(cartDB);
    }
  }
);

router.put("/:cartID/add-to-cart/:productID", async (req, res, next) => {
  try {
    const cartDB = await readDB(cartsFilePath);
    if (cartDB.length > 0) {
      const selectedCart = cartDB.findIndex(
        //Using find index to get the index of the element(cart) we want to change
        (cart) => cart._id === req.params.cartID
      );
      if (selectedCart !== -1) {
        const productDB = await readDB(productsFilePath);
        const selectedProduct = productDB.filter(
          //Getting the product object of the product we want to add to the cart
          (product) => product._id === req.params.productID
        );
        if (selectedProduct.length > 0) {
          cartDB[selectedCart].products.push(selectedProduct[0]);
          //Adds the product object to the cart. We have to use the [0] because .filter returns an array even if there is only one objject inside it
          cartDB[selectedCart].total += selectedProduct[0].price;
          //Changing the total price of cart to reflect the value added by the product
          await writeDB(cartsFilePath, cartDB);
          res.status(201).send(cartDB);
        } else {
          err.httpStatusCode = 404;
          err.message = "There is no product with that ID dood";
          next(err);
        }
      } else {
        const err = {};
        err.httpStatusCode = 404;
        err.message = "There is no cart with that ID dood";
        next(err);
      }
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "The cart database is empty dood";
      next(err);
    }
  } catch (err) {
    next(err);
  }
});

router.delete(
  "/:cartID/remove-from-cart/:productID",
  async (req, res, next) => {
    try {
      const cartDB = await readDB(cartsFilePath);
      if (cartDB.length > 0) {
        const selectedCart = cartDB.findIndex(
          (cart) => cart._id === req.params.cartID
        );
        if (selectedCart !== -1) {
          const alteredProducts = cartDB[selectedCart].products.filter(
            (product) => product._id !== req.params.productID
          ); //Getting a copy of the cart products WITHOUT the selected product
          const selectedProduct = cartDB[selectedCart].products.filter(
            (product) => product._id === req.params.productID
          ); //Getting a copy of the cart products WITH ONLY the selected product
          cartDB[selectedCart].products = alteredProducts;
          cartDB[selectedCart].total =
            cartDB[selectedCart].total - selectedProduct[0].price;
          await writeDB(cartsFilePath, cartDB);
          res.status(201).send(cartDB);
        } else {
          const err = {};
          err.httpStatusCode = 404;
          err.message = "There is no cart with that ID dood";
          next(err);
        }
      } else {
        const err = {};
        err.httpStatusCode = 404;
        err.message = "The cart database is empty dood";
        next(err);
      }
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
