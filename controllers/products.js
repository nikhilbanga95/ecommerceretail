const Product = require('../models/product');

exports.fetchCurrentProducts = (req, res, next) => {
  Product.fetchAll(products => {
    res.render('shop/product-list', {
      products,
      docTitle: 'Shop',
      path: '/',
       
    })
  })
}
