const Listing = require("./models/listing");
const Review = require("./models/review");
const { listingSchema, reviewSchema } = require("./schemaValidation");
const ExpressError = require("./utils/ExpressError");

// check login
module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in!");
    return res.redirect("/login");
  }
  next();
};

// save redirect url for after login
module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// check listing ownership
module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing not found!");
    return res.redirect("/listings");
  }
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You are not the owner of this listing!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// validate with Joi
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      let errMsg = error.details.map(el => el.message).join(",");
      throw new ExpressError(400, errMsg);
    }
    next();
  };
};

module.exports.validateListing = validate(listingSchema);
module.exports.validateReview = validate(reviewSchema);

// check review ownership
module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review) {
    req.flash("error", "Review not found!");
    return res.redirect(`/listings/${id}`);
  }
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You are not the author of this review!");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
