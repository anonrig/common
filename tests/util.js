'use strict';

var assert = require('assert');
var crypto = require('crypto');

var sinon = require('sinon');
var base64url = require('base64url');

var utils = require('../utils');
var objects = require('../types/objects');

describe('utils', function() {
  
  describe('#id', function() {
    it('throws if provided unknown type', function() {
      assert.throws(function() {
        utils.id('bob');
      }, /unknown object type/);
    });

    it('constructs a user id', function() {
      var id = utils.id('user');
      var buf = base64url.toBuffer(id);

      assert.strictEqual(buf.slice(1,2).toString('hex'), objects.user.value);
      assert.strictEqual(buf.slice(0,1).toString('hex'), '01');
      assert.strictEqual(buf.length, 18);
    });

    it('constructs a credential id', function() {
      var hash = crypto.randomBytes(16);
      var id = utils.id('credential', hash);
      var buf = base64url.toBuffer(id);

      assert.strictEqual(buf.slice(0,1).toString('hex'), '01');
      assert.strictEqual(buf.slice(1,2).toString('hex'), 
                         objects.credential.value);
      assert.ok(hash.equals(buf.slice(2)));
      assert.strictEqual(buf.length, 18);
    });

    it('throws error if payload provied for mutable object', function() {
      assert.throws(function() {
        utils.id('user', new Buffer(16));
      }, /Mutable objects do not accept payloads/);
    });

    it('throws error if payload not provided for immutable object', function() {
      assert.throws(function() {
        utils.id('credential');
      }, /A payload must be provided for an immutable object/); 
    });
  });

  describe('#validate', function() {
    
    it('throws error if id byte length is incorrect', function() {
      assert.throws(function() {
        utils.validate(new Buffer(2));
      }, /An object id must be 18 bytes/);
    });

    it('throws error if invalid version value provided', function() {
      var buf = crypto.randomBytes(18);
      buf.write('aa', 0, 1, 'hex');

      assert.throws(function() {
        utils.validate(buf);
      }, /Invalid ID version provided/);
    });

    it('throws error if object type is unknown', function() {
      var buf = crypto.randomBytes(18);
      buf.write(utils.ID_VERSION_HEX, 0, 1, 'hex');
      buf.write('ff', 1, 2, 'hex');

      assert.throws(function() {
        utils.validate(buf);
      }, /Unknown object id/);
    });

    it('returns the id buffer', function() {
      var id = utils.id('user');
      var buf = utils.validate(id);

      assert.ok(buf.equals(base64url.toBuffer(id)));
    });
  });

  describe('#type', function() {
    it('returns the type', function() {
      var spy = sinon.spy(utils, 'validate');
      var id = utils.id('user');

      var type = utils.type(id);
      
      assert.strictEqual(type, 'user');
      sinon.assert.calledOnce(spy);
    });
  });
});
