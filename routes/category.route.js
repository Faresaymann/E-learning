/**
 * @route /api/v1/category
 */
const { Router } = require( "express" );

const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} = require('../controller/category.controller');

const {
  getCategoryValidator,
  createCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
} = require('../utils/validations/category.validatiion');


const { protect, allowedRoles } = require("../services/auth.service");

const router = Router();

// protected
router.use(protect);

// user public
router
  .route('/getallCategory')
  .get(getCategories);
router
  .route('/getCategory/:id')
  .get(getCategoryValidator, getCategory);
 
 
// private [admin]
router.route("/createCategory").post(allowedRoles("Admin"),
createCategoryValidator,
createCategory
);
router
    .route('/updateCategory/:id').put(
    allowedRoles('Admin'),
    updateCategoryValidator,
    updateCategory
);
  router
  .route('/deleteCategory/:id').delete(
    allowedRoles('Admin'),
    deleteCategoryValidator,
    deleteCategory
  );
module.exports = router;
