const crypto = require('crypto');

const bcrypt = require('bcryptjs');
const { createTransport } = require('nodemailer');
const { validationResult } = require('express-validator/check');

const User = require('../models/user');
const ADMIN_EMAIL = 'nikhilbanga.ecommerce@gmail.com';

const transporter = createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: "nikhilbanga157@gmail.com",
    pass: "xsmtpsib-9d006ddb28fea78f64bd59c0e2b6f20860a1d7282175271af9f7b7abe284c7bf-IbtQrsz8qZY13yBH",
  },
});

exports.getSignUp = (req, res, next) => {
  const errorMessage = req.flash('error');
  res.render('auth/signup', {
    docTitle: 'Signup',
    path: '/login',
    errorMessage: !!errorMessage.length ? errorMessage[0] : null,
    oldInput: {
      email: '',
      password: '',
      confirmPassword: ''
    }
  })
}

exports.getLogin = (req, res, next) => {
  const errorMessage = req.flash('error');
  if(!!req.session?.isLoggedIn){
    return res.redirect('/')
  }
  res.render('auth/login', {
    docTitle: 'Login',
    path: '/login',
    errorMessage: !!errorMessage.length ? errorMessage[0] : null,
    oldInput: {
      email: '',
      password: ''
    },
    validationErrors: []

  })
}

exports.getReset = (req, res, next) => {
  const errorMessage = req.flash('error');
  res.render('auth/reset', {
    docTitle: 'Reset Password',
    path: '/reset',
    errorMessage: !!errorMessage.length ? errorMessage[0] : null
  })
}

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User
    .findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
    })
    .then(user => {
      const errorMessage = req.flash('error');
      res.render('auth/new-password', {
        docTitle: 'New Password',
        path: '/new-password',
        errorMessage: !!errorMessage.length ? errorMessage[0] : null,
        userId: user._id.toString(),
        passwordToken: token
      })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postSignUp = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      docTitle: 'Signup',
      path: '/login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword
      }
    })
  }

  // if (password !== confirmPassword) {
  //   req.flash('error', "Password mismatch");
  //   return res.redirect('/signup')
  // }

  bcrypt
    .hash(password, 12)
    .then((hashPassword) => {
      const user = new User({
        email: email,
        password: hashPassword,
        cart: {
          items: []
        }
      })
      return user.save()
    })
    .then(result => {
      return res.redirect('/login');
    })
    .then(res => {

      const mailOptions = {
        from: ADMIN_EMAIL,
        to: email,
        subject: `Sign Up Complete`,
        text: `You have succesfully signed up to your practice ejs account`
      };

      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      docTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password
      },
      validationErrors: []
    })
  }

  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        console.log('this is the errors: ', email, password)
        req.flash('error', "User does not exists");
        return res.status(422).render('auth/login', {
          path: '/login',
          docTitle: 'Login',
          errorMessage: 'User does not exists',
          oldInput: {
            email: email,
            password: password
          },
          validationErrors: []
        })
      }
      bcrypt
        .compare(password, user.password)
        .then(isMatch => {
          if (!!isMatch) {
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save((err) => {
              console.error(err)
              res.redirect('/');
            })
          } else {
            req.flash('error', "Incorrect password");
            return res.status(422).render('auth/login', {
              path: '/login',
              docTitle: 'Login',
              errorMessage: 'Incorrect password',
              oldInput: {
                email: email,
                password: password
              },
              validationErrors: []
            })
          }
        })
        .catch(err => {
          console.error(err)
          res.redirect('/login')
        })
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}

exports.postReset = (req, res, next) => {
  crypto
    .randomBytes(32, (err, buffer) => {
      if (!!err) {
        console.error(err)
        return res.redirect('/reset')
      } else {
        const token = buffer.toString('hex');
        User
          .findOne({ email: req.body.email })
          .then(user => {
            if (!user) {
              req.flash('error', 'User not found')
              return res.redirect('/reset');
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
          })
          .then(result => {
            res.redirect('/');
            const mailOptions = {
              from: ADMIN_EMAIL,
              to: req.body.email,
              subject: `Password Reset`,
              text: `Your request for password change have been approved.<div>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password</div>`
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.error(error);
              } else {
                console.log('Email sent: ' + info.response);
              }
            });
          })
          .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          })
      }
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.error(err)
    res.redirect('/login')
  });
}

exports.postNewPassword = (req, res, next) => {
  const newPassword = req.body.password;
  const userId = req.body.userId;
  const passwordToken = req.body.passwordToken;
  let resetUser;
  User
    .findOne({
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
      _id: userId
    })
    .then(user => {
      resetUser = user;
      return bcrypt.hash(newPassword, 12)
    })
    .then(hashedPassword => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = null;
      resetUser.resetTokenExpiration = null;
      return resetUser.save();
    })
    .then(result => {
      res.redirect('/login');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    })
}
