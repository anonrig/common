'use strict';

var errors = exports;

var _ = require('lodash');
var util = require('util');

/**
 * Catch and reject with database error
 *
 * @param {function} reject
 */
errors.reject = function(reject) {
  var error;
  return function(err) {
    if (err && err.code === '23505') {
      error = new errors.BadRequest('resource exists');
      error.original = err;
      return reject(error);
    }
    if (err && err.code === '22P02') {
      error = new errors.BadRequest('improperly formatted params');
      error.original = err;
      return reject(error);
    }
    if (!err || !err.type) {
      error = new errors.InternalServer('server error');
      error.original = err;
      return reject(error);
    }

    reject(err);
  };
};

/**
 * Respond to an error object via Express
 *
 * @param {object} res - Express response object
 */
errors.respond = function(res) {
  res.statusCode = this.statusCode || 500;
  if (!this.type || res.statusCode === 500) {
    return res.end();
  }

  var data = {
    type: this.type,
    message: _.isArray(this.message)? this.message : [ this.message ]
  };

  res.json(`error/${this.type}`, { error: data });
};

/**
 * Custom error types
 */

errors.NotFound = function NotFound(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = 404;
  this.type = 'not_found';
  this.respond = errors.respond.bind(this);
};
util.inherits(errors.NotFound, Error);

errors.InternalServer = function InternalServer(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message || 'server error';
  this.statusCode = 500;
  this.respond = errors.respond.bind(this);
};
util.inherits(errors.InternalServer, Error);

errors.BadRequest = function BadRequest(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.type = 'invalid_request';
  this.statusCode = 400;
  this.respond = errors.respond.bind(this);
};
util.inherits(errors.BadRequest, Error);

errors.Unauthorized = function Unauthorized(message) {
  Error.captureStackTrace(this, this.constructor);
  this.name = this.constructor.name;
  this.message = message;
  this.statusCode = 401;
  this.type = 'unauthorized';
  this.respond = errors.respond.bind(this);
};
util.inherits(errors.Unauthorized, Error);
