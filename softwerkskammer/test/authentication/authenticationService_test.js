"use strict";

const sinon = require("sinon").createSandbox();
const expect = require("must-dist");

const conf = require("../../testutil/configureForTest");
const beans = conf.get("beans");

const authenticationService = beans.get("authenticationService");
const membersPersistence = beans.get("membersPersistence");

describe("Authentication Service", () => {
  describe("- where member cannot be found -", () => {
    beforeEach(() => {
      sinon.stub(membersPersistence, "getByWhere").returns(null);
    });

    afterEach(() => {
      sinon.restore();
    });

    it("createUserObjectFromGooglePlus creates a user object with profile information", (done) => {
      const req = {};
      const sub = "12345678";
      const jwtClaims = {};
      const profile = {
        displayName: { familyName: "Dampf", givenName: "Hans" },
        name: {},
        _raw: "",
        _json: {
          kind: "plus#person",
          etag: '"asfsadfsadfasdfsadfasfsadfasfd"',
          occupation: "Developer",
          gender: "male",
          emails: [
            { value: "hans.dampf@mail.com", type: "account" },
            { value: "hans.dampf@dampfmaschine.de", type: "account" },
          ],
          urls: [
            {
              value: "http://www.flickr.com/photos/hansdampf/",
              type: "otherProfile",
              label: "http://www.flickr.com/photos/hansdampf/",
            },
            { value: "http://www.facebook.com/dampfi", type: "otherProfile", label: "http://www.facebook.com/dampfi" },
          ],
          objectType: "person",
          id: "1234567887654321",
          displayName: "Hans Dampf",
          name: { familyName: "Dampf", givenName: "Hans" },
          tagline: "The world's geekiest geek",
          aboutMe: "<p>Programmer, Tester, Ops Guy</p>",
          url: "https://plus.google.com/+HansDampf",
          image: { url: "https://lh6.googleusercontent.com/ddffddffddffddff/photo.jpg?sz=50", isDefault: false },
          organizations: [
            { name: "School of Schools", type: "school", primary: false },
            { name: "Dampfmaschine", title: "Developer", type: "work", startDate: "2000", primary: true },
          ],
          placesLived: [{ value: "Hannover, Deutschland", primary: true }],
          isPlusUser: true,
          language: "de_DE",
          circledByCount: 1234,
          verified: false,
        },
      };
      authenticationService.createUserObjectFromGooglePlus(
        req,
        undefined,
        sub,
        profile,
        jwtClaims,
        undefined,
        undefined,
        undefined,
        (err, user) => {
          expect(user).to.eql({
            authenticationId: "https://plus.google.com/12345678",
            profile: {
              emails: [{ value: "hans.dampf@mail.com", type: "account" }],
              name: { familyName: "Dampf", givenName: "Hans" },
              profileUrl: "https://plus.google.com/+HansDampf",
            },
          });
          done(err);
        },
      );
    });

    it("createUserObjectFromGithub creates a user object with profile information", (done) => {
      const req = {};
      const profile = {
        id: "123456",
        displayName: "Hans Dampf",
        username: "HansDampf",
        profileUrl: "https://github.com/HansDampf",
        photos: [
          {
            value: "https://avatars.githubusercontent.com/u/123456?v=3",
          },
        ],
        provider: "github",
        _raw: "",
        _json: {
          login: "HansDampf",
          id: 123456,
          avatar_url: "https://avatars.githubusercontent.com/u/123456?v=3",
          gravatar_id: "",
          url: "https://api.github.com/users/HansDampf",
          html_url: "https://github.com/HansDampf",
          followers_url: "https://api.github.com/users/HansDampf/followers",
          following_url: "https://api.github.com/users/HansDampf/following{/other_user}",
          gists_url: "https://api.github.com/users/HansDampf/gists{/gist_id}",
          starred_url: "https://api.github.com/users/HansDampf/starred{/owner}{/repo}",
          subscriptions_url: "https://api.github.com/users/HansDampf/subscriptions",
          organizations_url: "https://api.github.com/users/HansDampf/orgs",
          repos_url: "https://api.github.com/users/HansDampf/repos",
          events_url: "https://api.github.com/users/HansDampf/events{/privacy}",
          received_events_url: "https://api.github.com/users/HansDampf/received_events",
          type: "User",
          site_admin: false,
          name: "Hans Dampf",
          company: null,
          blog: "http://hans-dampf.de",
          location: "Hannover",
          email: null,
          hireable: null,
          bio: null,
          public_repos: 13,
          public_gists: 10,
          followers: 2,
          following: 3,
          created_at: "2010-11-11T10:00:00Z",
          updated_at: "2014-04-10T12:30:00Z",
        },
      };
      authenticationService.createUserObjectFromGithub(req, undefined, undefined, profile, (err, user) => {
        expect(user).to.eql({
          authenticationId: "github:123456",
          profile: {
            emails: [null],
            profileUrl: "https://github.com/HansDampf",
            _json: {
              blog: "http://hans-dampf.de",
            },
          },
        });
        done(err);
      });
    });

    it("createUserObjectFromOpenId creates a user object with profile information", (done) => {
      const req = {};
      const profile = {
        name: { familyName: "Dampf", givenName: "Hans" },
        profileUrl: "https://mywebsite.com/HansDampf",
        emails: [{}],
        _json: {
          login: "HansDampf",
          id: 123456,
        },
      };
      authenticationService.createUserObjectFromOpenID(req, "my-authentication", profile, (err, user) => {
        expect(user).to.eql({
          authenticationId: "my-authentication",
          profile: {
            emails: [{}],
            name: { familyName: "Dampf", givenName: "Hans" },
            profileUrl: "https://mywebsite.com/HansDampf",
          },
        });
        done(err);
      });
    });
  });
});
