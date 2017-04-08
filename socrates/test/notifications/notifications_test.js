'use strict';

const sinon = require('sinon').sandbox.create();
const expect = require('must-dist');

const conf = require('../../testutil/configureForTest');
const beans = conf.get('beans');
const notifications = beans.get('socratesNotifications');

const memberstore = beans.get('memberstore');
const subscriberstore = beans.get('subscriberstore');
const subscriberService = beans.get('subscriberService');

const Member = beans.get('member');
const transport = beans.get('mailtransport').transport;
const roomOptions = beans.get('roomOptions');
const supermanEmail = 'superman@email.de';

const hansmail = 'hans@email.de';
const hans = new Member({
  id: 'hans',
  firstname: 'Hans',
  lastname: 'Dampf',
  email: hansmail,
  nickname: 'Gassenhauer'
});

const fritzmail = 'fritz@email.de';
const fritz = new Member({
  id: 'fritz',
  firstname: 'Fritz',
  lastname: 'Fischer',
  email: fritzmail,
  nickname: 'Zungenbrecher'
});

describe('Notifications', () => {
  function stubRegistrationListEmailAddress(emailAdresses) {
    sinon.stub(notifications, 'registrationListEmailAddress').callsFake(() => emailAdresses);
  }

  beforeEach(() => {
    sinon.stub(transport, 'sendMail').callsFake((options, callback) => callback(null));
    sinon.stub(subscriberstore, 'allSubscribers').callsFake(callback => callback(null, ['p1', 'p2', 'p3']));
    sinon.stub(subscriberService, 'emailAddressesForWikiNotifications').callsFake(callback => callback(null, [fritzmail]));
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
    it('creates a meaningful text and subject and triggers mail sending for admins', () => {
      stubRegistrationListEmailAddress(supermanEmail);

      notifications.newSoCraTesMemberRegistered(hans);
      expect(transport.sendMail.calledOnce).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(supermanEmail);
      expect(options.subject).to.equal('Neuer Interessent');
      expect(options.html).to.contain('Es hat sich ein neuer SoCraTes-Interessent registriert:');
      expect(options.html).to.contain('Hans Dampf');
      expect(options.html).to.contain('/members/Gassenhauer');
      expect(options.html).to.contain('hans@email.de');
      expect(options.html).to.contain('Damit hat die SoCraTes jetzt 3 Interessenten.');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });

    it('does not trigger mail sending if there are no admins', () => {
      stubRegistrationListEmailAddress();

      notifications.newSoCraTesMemberRegistered(hans);
      expect(transport.sendMail.called).to.be(false);
    });
  });

  describe('for participation', () => {
    beforeEach(() => {
      sinon.stub(memberstore, 'getMemberForId').callsFake((id, callback) => { callback(null, hans); });
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('creates a meaningful text and subject for immediate registrants', () => {
      notifications.newParticipant(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
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
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes Registration Confirmation');
      expect(options.html).to.contain('If you want to stay longer, please tell us in your reply');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('sends a meaningful mail to admins', () => {
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

  describe('for change of', () => {
    beforeEach(() => {
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('duration - creates a meaningful text and subject', () => {
      notifications.changedDuration(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes Change of Length of Stay');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('sunday morning');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('duration - sends a meaningful mail to admins', () => {
      notifications.changedDuration(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Change in SoCraTes Registration - Duration');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });

    it('resource - creates a meaningful text and subject', () => {
      notifications.changedResource(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes Change of Room Option');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('sunday morning');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('resource - sends a meaningful mail to admins', () => {
      notifications.changedResource(hans, roomOptions.informationFor('junior', 3));
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Change in SoCraTes Registration - Resource');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('sunday morning');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });

    it('waitinglist - creates a meaningful text and subject', () => {
      notifications.changedWaitinglist(hans, {desiredRooms: [roomOptions.informationFor('junior', 'waitinglist')]});
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes Waitinglist Change of Room Option');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('waitinglist - sends a meaningful mail to admins', () => {
      notifications.changedWaitinglist(hans, {desiredRooms: [roomOptions.informationFor('junior', 'waitinglist')]});
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Change in SoCraTes Waitinglist - Resource');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

  describe('for waitinglist', () => {
    beforeEach(() => {
      sinon.stub(memberstore, 'getMemberForId').callsFake((id, callback) => { callback(null, hans); });
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('creates a meaningful text and subject', () => {
      notifications.newWaitinglistEntry(hans, {desiredRooms: [roomOptions.informationFor('junior', 3)]});
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes Waitinglist Confirmation');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('sends a meaningful mail to admins', () => {
      notifications.newWaitinglistEntry(hans, {desiredRooms: [roomOptions.informationFor('junior', 3)]});
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('New SoCraTes Waitinglist Entry');
      expect(options.html).to.contain('junior room (exclusively)');
      expect(options.html).to.contain('Gassenhauer');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

  describe('for removal from', () => {
    beforeEach(() => {
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('participants - creates a meaningful text and subject', () => {
      notifications.removedFromParticipants(hans);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes - Removal from Participant List');
      expect(options.html).to.contain('We have removed you from the participant list');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('participants - sends a meaningful mail to admins', () => {
      notifications.removedFromParticipants(hans);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Change in SoCraTes Registration - Removal from Participants');
      expect(options.html).to.contain('(Gassenhauer) has been removed from the participant list');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });

    it('waitinglist - creates a meaningful text and subject', () => {
      notifications.removedFromWaitinglist(hans);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail);
      expect(options.subject).to.equal('SoCraTes - Removal from Waitinglist');
      expect(options.html).to.contain('We have removed you from the waitinglist');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('waitinglist - sends a meaningful mail to admins', () => {
      notifications.removedFromWaitinglist(hans);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Change in SoCraTes Registration - Removal from Waitinglist');
      expect(options.html).to.contain('(Gassenhauer) has been removed from the waitinglist');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

  describe('for participant pair', () => {
    beforeEach(() => {
      stubRegistrationListEmailAddress(supermanEmail);
    });

    it('addition - creates a meaningful text and subject', () => {
      notifications.addedParticipantPair(hans, fritz);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail + ',' + fritzmail);
      expect(options.subject).to.equal('SoCraTes Room Sharing Confirmation');
      expect(options.html).to.contain('Hans Dampf and Fritz Fischer');
      expect(options.html).to.contain('/members/Gassenhauer');
      expect(options.html).to.contain('/members/Zungenbrecher');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('addition - sends a meaningful mail to admins', () => {
      notifications.addedParticipantPair(hans, fritz);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.eql(supermanEmail);
      expect(options.subject).to.equal('New SoCraTes Room Pair');
      expect(options.html).to.contain('Hans Dampf (Gassenhauer)');
      expect(options.html).to.contain('Fritz Fischer (Zungenbrecher)');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });

    it('removal - creates a meaningful text and subject', () => {
      notifications.removedParticipantPair(hans, fritz);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.firstCall.args[0];
      expect(options.bcc).to.eql(hansmail + ',' + fritzmail);
      expect(options.subject).to.equal('SoCraTes Room Pair Removal');
      expect(options.html).to.contain('Hans Dampf and Fritz Fischer');
      expect(options.html).to.contain('/members/Gassenhauer');
      expect(options.html).to.contain('/members/Zungenbrecher');
      expect(options.from).to.be('"SoCraTes Notifications" <' + supermanEmail + '>');
    });

    it('removal - sends a meaningful mail to admins', () => {
      notifications.removedParticipantPair(hans, fritz);
      expect(transport.sendMail.calledTwice).to.be(true);
      const options = transport.sendMail.secondCall.args[0];
      expect(options.bcc).to.contain(supermanEmail);
      expect(options.subject).to.equal('Removed SoCraTes Room Pair');
      expect(options.html).to.contain('Hans Dampf (Gassenhauer)');
      expect(options.html).to.contain('Fritz Fischer (Zungenbrecher)');
      expect(options.from).to.be('"SoCraTes Notifications" <' + null + '>');
    });
  });

  describe('for wikiChanges', () => {
    it('successfully passes the call', done => {
      const changes = [{dir: 'A', sortedFiles: () => []}];
      notifications.wikiChanges(changes, err => {
        const options = transport.sendMail.firstCall.args[0];
        expect(options.bcc).to.be('fritz@email.de');
        expect(options.subject).to.be('SoCraTes Wiki Changes');
        done(err);
      });
    });
  });

});

