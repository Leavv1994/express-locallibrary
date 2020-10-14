var Author = require('../models/author');
var Book = require('../models/book');

var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');


// Display list of all Authors.
exports.author_list = function(req, res, next) {

  Author.find()
    .populate('author')
    .sort([['family_name', 'ascending']])
    .exec(function (err, list_authors) {
      if (err) { return next(err); }
      //Successful, so render
      res.render('author_list', { title: 'Author List', author_list: list_authors });
    });

};

// Display detail page for a specific Author.
exports.author_detail = function(req, res, next) {

  async.parallel({
      author: function(callback) {
          Author.findById(req.params.id)
            .exec(callback)
      },
      authors_books: function(callback) {
        Book.find({ 'author': req.params.id },'title summary')
        .exec(callback)
      },
  }, function(err, results) {
      if (err) { return next(err); } // Error in API usage.
      if (results.author==null) { // No results.
          var err = new Error('Author not found');
          err.status = 404;
          return next(err);
      }
      // Successful, so render.
      res.render('author_detail', { title: 'Author Detail', author: results.author, author_books: results.authors_books } );
  });

};

// Display Author create form on GET.
exports.author_create_get = function(req, res, next) {       
  res.render('author_form', { title: 'Create Author'});
};

// Handle Author create on POST.
exports.author_create_post = [

  // Validate fields.
  body('first_name').isLength({ min: 1 }).trim().withMessage('First name must be specified.')
      .isAlphanumeric().withMessage('First name has non-alphanumeric characters.'),
  body('family_name').isLength({ min: 1 }).trim().withMessage('Family name must be specified.')
      .isAlphanumeric().withMessage('Family name has non-alphanumeric characters.'),
  body('date_of_birth', 'Invalid date of birth').optional({ checkFalsy: true }).isISO8601(),
  body('date_of_death', 'Invalid date of death').optional({ checkFalsy: true }).isISO8601(),

  // Sanitize fields.
  sanitizeBody('first_name').escape(),
  sanitizeBody('family_name').escape(),
  sanitizeBody('date_of_birth').toDate(),
  sanitizeBody('date_of_death').toDate(),

  // Process request after validation and sanitization.
  (req, res, next) => {

      // Extract the validation errors from a request.
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
          // There are errors. Render form again with sanitized values/errors messages.
          res.render('author_form', { title: 'Create Author', author: req.body, errors: errors.array() });
          return;
      }
      else {
          // Data from form is valid.

          // Create an Author object with escaped and trimmed data.
          var author = new Author(
              {
                  first_name: req.body.first_name,
                  family_name: req.body.family_name,
                  date_of_birth: req.body.date_of_birth,
                  date_of_death: req.body.date_of_death
              });
          author.save(function (err) {
              if (err) { return next(err); }
              // Successful - redirect to new author record.
              res.redirect(author.url);
          });
      }
  }
];

// Display Author delete form on GET.
exports.author_delete_get = function(req, res, next) {

  async.parallel({
      author: function(callback) {
          Author.findById(req.params.id).exec(callback)
      },
      authors_books: function(callback) {
        Book.find({ 'author': req.params.id }).exec(callback)
      },
  }, function(err, results) {
      if (err) { return next(err); }
      if (results.author==null) { // No results.
          res.redirect('/catalog/authors');
      }
      // Successful, so render.
      res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
  });

};

// req.params: This property is an object containing properties mapped to the named route “parameters”. For example, if you have the route /user/:name, then the “name” property is available as req.params.name. This object defaults to {}. -> USED IN URL HEADERS (Request parts)

//req.body: Contains key-value pairs of data submitted in the request body. By default, it is undefined, and is populated when you use body-parsing middleware such as body-parser and multer.-> USED IN TO ACCESS REQUEST BODY
// mostly used in POST methods

// Handle Author delete on POST.
exports.author_delete_post = function(req, res, next) {

  async.parallel({
      author: function(callback) {
        Author.findById(req.body.authorid).exec(callback)
      },
      authors_books: function(callback) {
        Book.find({ 'author': req.body.authorid }).exec(callback)
      },
  }, function(err, results) {
      if (err) { return next(err); }
      // Success
      if (results.authors_books.length > 0) {
          // Author has books. Render in same way as for GET route.
          res.render('author_delete', { title: 'Delete Author', author: results.author, author_books: results.authors_books } );
          return;
      }
      else {
          // Author has no books. Delete object and redirect to the list of authors.
          Author.findByIdAndRemove(req.body.authorid, function deleteAuthor(err) {
              if (err) { return next(err); }
              // Success - go to author list
              res.redirect('/catalog/authors')
          })
      }
  });
};

// Display Author update form on GET.
exports.author_update_get = function(req, res, next) {
    Author.findById(req.params.id)
    .exec(function (err, author) {
      if (err) {return next(err);}
      if (author==null) {
        var err = new Error ('Author not found');
        err.status = 404;
        return next(err);
      }
      //Success
      res.render('author_form', {title: 'Update Author', author: author});
    });
};

// Handle Author update on POST.
exports.author_update_post = [

  // Validate fields
  body('first_name', 'First name must not be empty').trim().isLength({min: 1}),
  body('family_name', 'Last name must not be empty').trim().isLength({min: 1}),
  body('date_of_birth', 'Choose a date of birth'),
  body('date_of_death', 'Choose a date of death'),
  
  // Sanitize fields
  sanitizeBody('first_name').escape(),
  sanitizeBody('last_name').escape(),
  
  // Process request after validation

  (req, res, next) => {
  const errors = validationResult(req);

    //Create an Author object with escaped/trimmed data and old id

    var author = new Author(
      {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        _id: req.params.id,
        date_of_birth: req.body.date_of_birth,
        date_of_death: req.body.date_of_death,

      });
    if(!errors.isEmpty()) {
      Author.findById(req.params.id).exec(function(err, author) {
        if (err) {return next(err);}
        //Render form erneut mit sanitized values/error messages
        res.render('author_form', { title: 'Update Author', author: author, errors: errors.array()});
      });
      return;
    } 
    else {
      // Es gibt keine Fehler bei den eingegeben Werte
      // Data from form is valid, Update the record
      Author.findByIdAndUpdate(req.params.id, author, {}, function(err, theauthor) {
        if (err) {return next(err);}
        res.redirect(theauthor.url);
      });
    }
  }
  ];
