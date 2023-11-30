const express = require('express');
const { check, body } = require('express-validator/check');

const router = express.Router();

const authController = require('../controllers/auth');
const User = require('../models/user');

router.get('/signup', authController.getSignUp);
router.get('/login', authController.getLogin);
router.get('/reset', authController.getReset);
router.get('/reset/:token', authController.getNewPassword);
router.post('/reset', authController.postReset);
router.post('/signup',
  [
    check('email')
      .isEmail()
      .withMessage('Please enter a valid email.')
      .custom((value, { req }) => {
        // if (value === 'test@test.com') {
        //   throw new Error('This email is forbidden.');
        // }
        // return true;
        return User
          .findOne({ email: value })
          .then((userDoc) => {
            if (!!userDoc) {
              return Promise.reject("User already exists");
            }
          })
      }),
    body('confirmPassword')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords mismatch');
        }
        return true;
      })
      .trim(),
    body(
      'password',
      'Please enter a password with only numbers and text and at least 5 characters'
    )
      .isAlphanumeric()
      .isLength({ min: 5 })
      .trim()
  ],
  authController.postSignUp);
router.post('/login',
  [
    body('email')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
    body('password', 'Enter a valid password')
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim()
  ],
  authController.postLogin);
router.post('/logout', authController.postLogout);
router.post('/new-password', authController.postNewPassword);

module.exports = router;