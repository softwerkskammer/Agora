/*eslint no-process-exit: 0 */
/* eslint no-console: 0 */
"use strict";

require("./configure"); // initializing parameters
const beans = require("simple-configure").get("beans");
const membersPersistence = beans.get("membersPersistence");
const groupsPersistence = beans.get("groupsPersistence");
const Group = beans.get("group");
const Member = beans.get("member");

const really = process.argv[2];

if (!really || really !== "really") {
  console.log('If you really want to init the db, append "really" to the command line.');
  process.exit();
}

const groups = [
  {
    id: "alle",
    emailPrefix: "alleAlle",
    description: "D-Scription",
    shortName: "Alle",
    longName: "Alle",
    type: "Themengruppe",
    color: "#ff0000",
    mapX: "100",
    mapY: "100",
  },
  {
    id: "commercial",
    emailPrefix: "commercial",
    description: "D-Scription",
    longName: "Commercial",
    type: "Themengruppe",
    color: "#ff00ff",
    mapX: "200",
    mapY: "100",
    shortName: "C",
  },
  {
    id: "neueplattform",
    emailPrefix: "neueplattform",
    description: "D-Scription",
    longName: "Agora",
    type: "Themengruppe",
    color: "#ffff00",
    mapX: "180",
    mapY: "100",
    shortName: "A",
  },
  {
    id: "crafterswap",
    emailPrefix: "crafterswap",
    description: "D-Scription",
    longName: "Crafter Swaps",
    type: "Themengruppe",
    color: "#0000ff",
    mapX: "100",
    mapY: "200",
    shortName: "CS",
  },
  {
    id: "internet",
    emailPrefix: "internet",
    description: "D-Scription",
    longName: "Virtual Group",
    type: "Themengruppe",
    color: "#00ff00",
    mapX: "100",
    mapY: "300",
    shortName: "VG",
  },
  {
    color: "#244BB3",
    contactingOrganizersEnabled: true,
    description:
      "#### Willkommen auf der Seite der Regionalgruppe Karlsruhe!\r\n\r\nWir treffen uns regelmäßig einmal im Monat, in der Regel am 2. Dienstag/Mittwoch im Monat, ab 19:30 Uhr.\r\n\r\n",
    emailPrefix: "SWK-KA",
    id: "karlsruhe",
    longName: "Karlsruhe",
    mapX: "8.4036527",
    mapY: "49.0068901",
    meetupURL: "",
    shortName: "KA",
    type: "Regionalgruppe",
  },
];
const members = [
  {
    authentications: ["password:test@user.de"],
    email: "test@user.de",
    firstname: "test",
    hashedPassword:
      "c8c334582be43e0de836727186644558f089d9ff4bc892f08970a083e46ddfd4cd18b7cbc8a8318ca4b58d4ae940ccc707a02b2fdb267b59871c33975a9555fedd041be36514491f943b7f9ec99ddf90a58c51220a4f405032e9d3c5f487cec4f5057873cbda1cdf96fddc76fb1ed24ad705fed7c42454222c099a1fa9ea0cfbbd6d07d1529906662eff71d861df06b4bbe31c37a4570069c6cea3080e71dc4a7002c45223f53c699705bd61b916264f821eebc6753d90d57c91309dcc4f7abf8e11272651a28fb677a62fe929a68f7aaaa23a57d654680b8781eee6d81925c46dd2e393d8083b400945540c3eec42c2580e06226218ce8b24989e61b6b793abeb816b82716ff589ef282caf590d8d4a0d63d757cfe9a4df0ffe3cbb8287ce1e3baac7342cdf21711404ecdeedc91a86077176df8e7c08b0c56238ae21ecd0422dcb9b047ed9418f73160ce52a45893ccdaae568613a593801f879b38adebd2a65ea10e52fb6912145779b0770bdfc01c70a148912d192489f5d73f1085df37046e42b4eedb636a329c8128918ef50a0440f847bde5550130011fc3d69bc1e990ff733e8693f57fffdc2b358e4d8578d5648b81f96c3c1c671c0571abe3e81938cd78b61ce6142e2adeb4ddae63ff7b8f806e9c43caf9043cad0aae31292ace9fcb7b0d90f5b187fe7d4fb8a3385408a6d8be31c8e7fd98af9f481d58770eb17",
    id: "password:test@user.de",
    lastname: "user",
    location: "test",
    nickname: "testuser",
    notifyOnWikiChanges: false,
    profession: "test",
    reference: "test",
    salt: "d8a4a4e8a28175eb9143540a5811ba1dcea958c4a948fff71b62b3889c948214",
  },
  {
    id: "auth01",
    nickname: "Testi",
    firstname: "Ich",
    lastname: "Tester",
    email: "test@me.de",
    location: "Hier",
    profession: "Testbeauftragter",
    reference: "-",
    authentications: ["auth01"],
  },
  {
    id: "auth02",
    nickname: "Schumi",
    firstname: "Michael",
    lastname: "Schumacher",
    email: "michael@schumacher.de",
    location: "Hürth",
    profession: "Ex-Rennfahrer",
    reference: "-",
    authentications: ["auth02"],
  },
  {
    id: "auth03",
    nickname: "Balli",
    firstname: "Michael",
    lastname: "Ballack",
    email: "michael@ballack.de",
    location: "Görlitz",
    profession: "Ex-Fußballer",
    reference: "-",
    authentications: ["auth03"],
  },
  {
    id: "auth04",
    nickname: "Jamie",
    firstname: "James",
    lastname: "Hetfield",
    email: "james@hetfield.com",
    location: "Downey, LA",
    profession: "Musiker",
    reference: "-",
    authentications: ["auth04"],
  },
  {
    id: "auth05",
    nickname: "leider",
    firstname: "Andreas",
    lastname: "Leidig",
    email: "andreas@leidig.com",
    location: "Jöhlingen",
    profession: "SoCra",
    interests: "clean code tag1 skiing smoking ",
    reference: "-",
    authentications: ["auth05"],
  },
];

try {
  groups.forEach((group) => {
    group.description =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras at pellentesque leo. Suspendisse at ante in lorem faucibus aliquet volutpat ac metus. Aenean vel mauris et lacus venenatis venenatis rhoncus eu nisi. Nam imperdiet pretium ante vel hendrerit. Etiam lacinia lacinia bibendum. Ut malesuada neque sed enim accumsan, id tristique lectus gravida. Morbi lorem justo, vestibulum quis est non, pretium cursus ante. Aenean porttitor nulla eget elit rhoncus rhoncus. In vitae lacinia arcu, quis aliquet nibh. ";
    return groupsPersistence.save(new Group(group));
  });
  members.forEach((member) => {
    const existingMember = membersPersistence.getById(member.id);
    if (existingMember) {
      console.log('Member "' + member.nickname + '" (already existing)');
      return;
    }
    return membersPersistence.save(new Member(member).state);
  });
  process.exit(0);
} catch (e) {
  console.log(e);
  process.exit(1);
}
