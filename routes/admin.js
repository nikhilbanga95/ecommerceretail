const express = require('express')

const adminControllers = require('../controllers/admin')
const isAuth = require('../middleware/is-auth')
const { body } = require('express-validator/check')

const router = express.Router()

router.get('/add-product', isAuth, adminControllers.getAddProduct)
router.get('/products', isAuth, adminControllers.getProducts)

router.post('/add-product', [
  body('title')
    .isString()
    .isLength({ min: 3 })
    .trim(),
  body('price').isFloat(),
  body('description')
    .isLength({ min: 5, max: 400 })
    .trim(),
], isAuth, adminControllers.postAddProducts)

router.get('/edit-product/:productId', isAuth, adminControllers.getEditProduct)
router.post('/edit-product', [
  body('title')
    .isString()
    .isLength({ min: 3 })
    .trim(),
  body('price').isFloat(),
  body('description')
    .isLength({ min: 5, max: 400 })
    .trim(),
], isAuth, adminControllers.postEditProduct)

router.delete('/product/:productId', isAuth, adminControllers.deleteProducts)

module.exports = router;