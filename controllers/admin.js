const fileHelper = require('../util/file');

const { validationResult } = require('express-validator/check');

const Product = require('../models/product');

const { Types } = require('mongoose');

exports.getAddProduct = (req, res, next) => {
  res.render('admin/edit-product', {
    docTitle: 'Add Products',
    path: 'admin/add-product',
    editing: false,
    hasError: false,
    errorMessage: null
  })
}

exports.postAddProducts = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      docTitle: 'Add Products',
      path: 'admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        price,
        description
      },
      errorMessage: 'Attached file is not an image'
    })
  }
  const errors = validationResult(req);
  console.log('Image Url : ', typeof (image))

  const imageUrl = image.path;

  if (!errors.isEmpty()) {
    console.log('77777777777777777777777')
    return res.status(422).render('admin/edit-product', {
      docTitle: 'Add Products',
      path: 'admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title,
        imageUrl,
        price,
        description
      },
      errorMessage: errors.array()[0].msg
    })
  }
  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log('result : ', result)
      res.redirect('/admin/products')
    })
    .catch(err => {
      console.log('000000 this is the error: ', err)
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/')
  };
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        docTitle: 'Edit Products',
        path: 'admin/edit-product',
        editing: editMode,
        product,
        hasError: false,
        errorMessage: null
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      console.log('*************this is the error: ', error)
      return next(error);
    })
}

exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      docTitle: 'Edit Products',
      path: 'admin/edit-product',
      editing: true,
      hasError: true,
      product: {
        title,
        price,
        description,
        _id: prodId
      },
      errorMessage: errors.array()[0].msg
    })
  }
  Product
    .findById(prodId)
    .then(product => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect('/');
      }
      product.title = title;
      product.price = price;
      product.description = description;
      if (!!image) {
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product
        .save()
        .then(() => {
          res.redirect('/admin/products');
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    // .select('title price -_id')
    //   .populate('userId','name')
    .then(products => {
      res.render('admin/products', {
        products,
        docTitle: 'Admin Products',
        path: 'admin/products',

      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.deleteProducts = (req, res, next) => {
  const prodId = req.params.productId;
  Product
    .findById(prodId)
    .then((product) => {
      if (!product) {
        return next(new Error('Product not found.'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({ _id: prodId, userId: req.user._id })
    })
    .then(() => {
      res.status(200).json({
        message: 'Success!'
      });
    })
    .catch(err => {
      res.status(500).json({
        message: 'Failed'
      });
    })
}