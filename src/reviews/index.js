const express = require("express");
const path = require("path");
const uniqid = require("uniqid");
const { check, validationResult } = require("express-validator");
const { readDB, writeDB } = require("../lib/utilities");
const router = express.Router();

const reviewsFilePath = path.join(__dirname, "reviews.json");

router.get("/", async (req, res, next) => {
  try {
    const reviewsDataBase = await readDB(reviewsFilePath);
    if (reviewsDataBase.length > 0) {
      res.status(201).send(reviewsDataBase);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "The database is empty :(";
    }
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const reviewsDataBase = await readDB(reviewsFilePath);
    const selectedReview = reviewsDataBase.filter(
      (review) => review._id === req.params.id
    );
    if (selectedReview.length > 0) {
      res.status(201).send(selectedReview);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message = "The identifed review does not exist.";
      next(err);
    }
    res.status(201).send(reviewsDataBase);
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

router.post(
  "/",
  [
    check("comment").exists().withMessage("You need to give a comment!"),
    check("rate")
      .isInt({ min: 1, max: 5 })
      .withMessage("You need to give a rating between 1 and 5!"),
    check("productID")
      .exists()
      .withMessage(
        "You need to provide the ID of the product you're reviewing"
      ),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = {};
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      const reviewsDataBase = await readDB(reviewsFilePath);
      const newReview = req.body;
      newReview._id = uniqid();
      newReview.createdAt = new Date();
      reviewsDataBase.push(newReview);
      await writeDB(reviewsFilePath, reviewsDataBase);
      res.status(201).send(reviewsDataBase);
    }
  }
);

router.put(
  "/:id",
  [
    check("comment").exists().withMessage("You need to give a comment!"),
    check("rate")
      .isInt({ min: 1, max: 5 })
      .withMessage("You need to give a rating between 1 and 5!"),
    check("productID")
      .exists()
      .withMessage(
        "You need to provide the ID of the product you're reviewing"
      ),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const err = {};
      err.message = errors;
      err.httpStatusCode = 400;
      next(err);
    } else {
      try {
        const reviewsDataBase = await readDB(reviewsFilePath);
        const selectedReview = reviewsDataBase.filter(
          (review) => review._id === req.params.id
        );
        if (selectedReview.length > 0) {
          console.log(selectedReview);
          const filteredReviews = reviewsDataBase.filter(
            (review) => review._id !== req.params.id
          );
          const alteredReview = req.body;
          alteredReview._id = selectedReview[0]._id;
          alteredReview.modifiedAt = new Date();
          alteredReview.createdAt = selectedReview[0].createdAt;
          filteredReviews.push(alteredReview);
          await writeDB(reviewsFilePath, filteredReviews);
          res.status(201).send(filteredReviews);
        } else {
          const err = {};
          err.httpStatusCode = 404;
          err.message = "The review you are trting to edit does not exist";
          next(err);
        }
      } catch (err) {
        err.httpStatusCode = 404;
        next(err);
      }
    }
  }
);

router.delete("/:id", async (req, res, next) => {
  try {
    const reviewsDataBase = await readDB(reviewsFilePath);
    const selectedReview = reviewsDataBase.filter(
      (review) => review._id === req.params.id
    );
    if (selectedReview.length > 0) {
      const filteredReviews = reviewsDataBase.filter(
        (review) => review._id !== req.params.id
      );
      await writeDB(reviewsFilePath, filteredReviews);
      res.status(201).send(filteredReviews);
    } else {
      const err = {};
      err.httpStatusCode = 404;
      err.message =
        "The review you are trying to delete does not exist. So... yay?";
      next(err);
    }
  } catch (err) {
    err.httpStatusCode = 404;
    next(err);
  }
});

module.exports = router;
