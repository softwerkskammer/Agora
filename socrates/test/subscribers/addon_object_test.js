'use strict';

require('../../testutil/configureForTest');
const expect = require('must-dist');

const beans = require('simple-configure').get('beans');
const Subscriber = beans.get('subscriber');

describe('Subscriber\'s Addon', () => {

  it('is never undefined', () => {
    const subscriber = new Subscriber();
    expect(subscriber.addon()).to.exist();
  });

  it('returns the values stored in the subscriber\'s addon', () => {
    const subscriber = new Subscriber({
      _addon: {
        homeAddress: 'homeOne', billingAddress: 'billingTwo', tShirtSize: 'XXXL', remarks: '',
        pronoun: 'she/her/her', diet: 'lactose intolerant', needsAssistance: false, canProvideAssistance: true
      }
    });
    expect(subscriber.addon().homeAddress()).to.equal('homeOne');
    expect(subscriber.addon().billingAddress()).to.equal('billingTwo');
    expect(subscriber.addon().tShirtSize()).to.equal('XXXL');
    expect(subscriber.addon().remarks()).to.equal('');
    expect(subscriber.addon().pronoun()).to.equal('she/her/her');
    expect(subscriber.addon().diet()).to.equal('lactose intolerant');
    expect(subscriber.addon().needsAssistance()).to.be(false);
    expect(subscriber.addon().canProvideAssistance()).to.be(true);
  });

  it('can be filled from the UI (unpacks t-shirt size)', () => {
    const addonDataUI = {homeAddress: 'homeOne', billingAddress: 'billingTwo', tShirtSize: ['XXXL', ''], pronoun: 'she/her/her'};
    const addonData = {
      homeAddress: 'homeOne', billingAddress: 'billingTwo', diet: undefined, tShirtSize: 'XXXL',
      needsAssistance: undefined, canProvideAssistance: undefined, remarks: undefined, pronoun: 'she/her/her'
    };
    const subscriberFromUI = new Subscriber();
    subscriberFromUI.addon().fillFromUI(addonDataUI);
    expect(subscriberFromUI).to.eql(new Subscriber({_addon: addonData}));
  });

  it('splits up the home and billing address into lines', () => {
    const subscriber = new Subscriber({_addon: {homeAddress: 'name1\nstreet1\ncity1', billingAddress: 'name2\n\nstreet2\ncity2\ncountry2\n'}});
    expect(subscriber.addon().homeAddressLines().length).to.equal(3);
    expect(subscriber.addon().homeAddressLines()).to.eql(['name1', 'street1', 'city1']);
    expect(subscriber.addon().billingAddressLines().length).to.equal(6);
    expect(subscriber.addon().billingAddressLines()).to.eql(['name2', '', 'street2', 'city2', 'country2', '']);
  });

  it('returns an empty array if no home or billing address can be found', () => {
    const subscriber = new Subscriber();
    expect(subscriber.addon().homeAddressLines().length).to.equal(0);
    expect(subscriber.addon().homeAddressLines()).to.eql([]);
    expect(subscriber.addon().billingAddressLines().length).to.equal(0);
    expect(subscriber.addon().billingAddressLines()).to.eql([]);
  });

  describe('evaluates whether someone entered a non-male preferred pronoun', () => {
    it('recognizes male values', () => {
      const subscriber = new Subscriber();
      const addon = subscriber.addon();
      addon.state.pronoun = 'he';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'er';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'm';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'guy';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'dude';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'He';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'He/His/Him';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'he/His/him';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'hE';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'he,his,him';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'He,His,Him';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      addon.state.pronoun = 'He/ His, Him';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
    });

    it('recognizes non-male values', () => {
      const subscriber = new Subscriber();
      subscriber.addon().state.pronoun = 'Anything else';
      expect(subscriber.hasNonMalePronoun()).to.be.true();
    });

    it('assumes non-values are not an indicator of non-male-ness', () => {
      const subscriber = new Subscriber();
      subscriber.addon().state.pronoun = null;
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      subscriber.addon().state.pronoun = undefined;
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      subscriber.addon().state.pronoun = false;
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      subscriber.addon().state.pronoun = '';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
      subscriber.addon().state.pronoun = ' ';
      expect(subscriber.hasNonMalePronoun()).to.be.false();
    });
  });

});
