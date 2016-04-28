'use strict';
var expect = require('must-dist');
var memoize = require('../../lib/eventstore/flushableMemoize');

describe('the flushable-memoize decorator', function () {
  it('wraps a constant function so it is only invoked once, and the result is cached', function() {
    var timesCalled = 0;

    var testFunction = function() {
      timesCalled++;
      return 'Foo';
    };

    var memoized = memoize(testFunction);

    var results = [memoized(), memoized()];

    expect(timesCalled).to.equal(1);
    expect(results[0]).to.equal('Foo');
    expect(results[1]).to.equal('Foo');
  });

  it('wraps a function with any parameters, so given the parameters, it returns the (cached) result of the invocation', function() {
    var timesCalled = {};

    var testFunction = function(arg1, arg2) {
      var key = arg1 + '/' + arg2;
      timesCalled[key] = (timesCalled[key] || 0) + 1;
      return key;
    };

    var memoized = memoize(testFunction);

    var resultHello1 = [memoized('Hello', 1), memoized('Hello', 1)];
    var resultHello2 = [memoized('Hello', 2), memoized('Hello', 2)];

    expect(resultHello1).to.eql(['Hello/1', 'Hello/1']);
    expect(timesCalled['Hello/1']).to.equal(1);

    expect(resultHello2).to.eql(['Hello/2', 'Hello/2']);
    expect(timesCalled['Hello/2']).to.equal(1);
  });

  it('allows to flush the cache', function() {
    var timesCalled = 0;

    var testFunction = function() {
      timesCalled++;
      return 'Foo';
    };

    var memoized = memoize(testFunction);

    memoized();
    memoized();
    expect(timesCalled).to.eql(1);
    memoized.flushCache();
    memoized();
    expect(timesCalled).to.eql(2);
  });

  it('keeps the this-Scope of its original call', function() {
    var testObject = {
      fun: memoize(function() {
        expect(this).to.equal(testObject);
      })
    };

    testObject.fun();
  });

  it('stores a separate cache for every instance of this', function() {
    var fun = memoize(function(a) {
      this.invocations++;
      return a + this.a;
    });

    var obj1 = { fun: fun, a: 'Hello', invocations: 0};
    var obj2 = { fun: fun, a: 'Goodbye', invocations: 0};

    expect(obj1.fun('Foo')).to.equal('FooHello');
    expect(obj1.fun('Foo')).to.equal('FooHello');
    expect(obj2.fun('Foo')).to.equal('FooGoodbye');

    expect(obj1.invocations).to.equal(1);
    expect(obj2.invocations).to.equal(1);
  });

  it('flushes an individual cache only', function() {
    var fun = memoize(function(a) {
      this.invocations++;
      return a + this.a;
    });

    var obj1 = { fun: fun, a: 'Hello', invocations: 0};
    var obj2 = { fun: fun, a: 'Goodbye', invocations: 0};

    obj1.fun('Foo');
    obj1.fun.flushCache();
    obj1.fun('Foo');
    obj2.fun('Foo');

    expect(obj1.invocations).to.equal(2);
    expect(obj2.invocations).to.equal(1);
  });

  it('memoizes only over the called function when saving the cache on an instance', function() {
    var obj = {
      fun1: memoize(function(a) {
        return 'Hello' + a;
      }),
      fun2: memoize(function(a) {
        return 'Goodbye' + a;
      })
    };

    expect(obj.fun1('a')).to.equal('Helloa');
    expect(obj.fun2('a')).to.equal('Goodbyea');
  });
});

