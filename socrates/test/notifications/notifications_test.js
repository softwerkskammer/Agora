'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const notifications = beans.get('socratesNotifications');

const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');

const Member = beans.get('member');
const transport = beans.get('mailtransport').transport;
const roomOptions = beans.get('roomOptions');
const supermanEmail = 'superman@email.de';

const hans = new Member({
  id: 'hans',
  firstname: 'Hans',
  lastname: 'Dampf',
  email: 'hans@email.de',
  nickname: 'Gassenhauer'
});

describe('Notifications', () => {
  function stubRegistrationListEmailAddress(emailAdresses) {
    sinon.stub(notifications, 'registrationListEmailAddress', () => emailAdresses);
  }

  beforeEach(() => {
    sinon.stub(transport, 'sendMail');
    sinon.stub(subscriberstore, 'allSubscribers', callback => callback(null, ['p1', 'p2', 'p3']));
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Preconfigured Email Addresses', () => {
    beforeEach(() => {
      conf.addProperties({
        registrationListEmailAddress: undefined,
        infoListEmailAddress: undefined,
        notificationListEmailAddress: undefined
      });
    });

    it('returns configured registration notification address when notifying about changes regarding the registration', () => {
      conf.addProperties({registrationListEmailAddress: 'foo@example.com'});

      expect(notifications.registrationListEmailAddress()).to.be('foo@example.com');
    });

    it('returns configured info notification address when notifying about changes regarding other than the registration', () => {
      conf.addProperties({infoListEmailAddress: 'foo2@example.com'});

      expect(notifications.infoListEmailAddress()).to.be('foo2@example.com');
    });

    it('uses registration list as fallback if info not set', () => {
      conf.addProperties({registrationListEmailAddress: 'foo@example.com'});

      expect(notifications.infoListEmailAddress()).to.be('foo@example.com');
    });

    it('returns configured general notification address when notifying about changes (alternatively)', () => {
      conf.addProperties({notificationListEmailAddress: 'foo3@example.com'});

      expect(notifications.notificationListEmailAddress()).to.be('foo3@example.com');
    });

    it('uses info list as fallback if info not set', () => {
      conf.addProperties({infoListEmailAddress: 'foo2@example.com'});

      expect(notifications.notificationListEmailAddress()).to.be('foo2@example.com');
    });
  });

  describe('for new members', () => {
    it('creates a meaningful text and subject', () => {
      stubRegistrationListEmailAddress(supermanEmail);

      notifications.newSoCraTesMemberRegistered(hans);
      expect(transport.sendMail.calledOnce).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.subject).to.equal('Neuer Interessent');
      expect(options.html).to.contain('Es hat sich ein neuer SoCraTes-Interessent registriert:');
      expect(options.html).to.contain('Hans Dampf');
      expect(options.html).to.contain('/members/Gassenhauer');
      expect(options.html).to.contain('hans@email.de');
      expect(options.html).to.contain('Damit hat die SoCraTes jetzt 3 Interessenten.');
    });

    it('triggers mail sending for superusers', () => {
      stubRegistrationListEmailAddress(supermanEmail);

      notifications.newSoCraTesMemberRegistered(hans);
      expect(transport.sendMail.calledOnce).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(supermanEmail);
      expect(options.from).to.contain('SoCraTes Notifications');
    });

    it('does not trigger mail sending if there are no concerned parties', () => {
      stubRegistrationListEmailAddress();

      notifications.newSoCraTesMemberRegistered(hans);
      expect(transport.sendMail.called).to.be(false);
    });
  });

  describe('for participation', () => {
    beforeEach(() => {
      sinon.stub(memberstore, 'getMemberForId', (id, callback) => { callback(null, hans); });
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('creates a meaningful text and subject for immediate registrants', () => {
      notifications.newParticipant(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.subject).to.equal('SoCraTes Registration Confirmation');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('<b>3</b>  nights');
      expect(options.html).to.not.contain('If you want to stay longer, please tell us by replying to this e-mail');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('creates a meaningful text and subject for registrants coming from the waitinglist', () => {
      const bookingdetails = roomOptions.informationFor('junior', 3);
      bookingdetails.fromWaitinglist = true;
      notifications.newParticipant(hans, bookingdetails);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.subject).to.equal('SoCraTes Registration Confirmation');
      expect(options.html).to.contain('If you want to stay longer, please tell us in your reply');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('sends a meaningful mail to superusers', () => {
      notifications.newParticipant(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('New SoCraTes Registration');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('<b>3</b>  nights');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

  describe('for waitinglist', () => {
    beforeEach(() => {
      sinon.stub(memberstore, 'getMemberForId', (id, callback) => { callback(null, hans); });
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('creates a meaningful text and subject', () => {
      notifications.newWaitinglistEntry(hans, [roomOptions.informationFor('junior', 3)]);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.subject).to.equal('SoCraTes Waitinglist Confirmation');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('sends a meaningful mail to members concerned with registration', () => {
      notifications.newWaitinglistEntry(hans, [roomOptions.informationFor('junior', 3)]);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('New SoCraTes Waitinglist Entry');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

});
