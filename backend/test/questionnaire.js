process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const User = require("../models/User");
const Questionnaire = require("../models/Questionnaire");
const Answer = require("../models/Answer");

const server = require("../index");

chai.use(chaiHttp);

describe("Questionnaire", function () {
  const questionnaire_1 = {
    questions: [{ question: "How are you?", scale: 6 }],
    participants: { all: true, groups: [] },
    visibility: { all: true, groups: [] },
  };
  function register(callback) {
    chai
      .request(server)
      .post("/api/register")
      .send({
        username: "Mika",
        password: "123456",
        groups: ["abc", "123"],
      })
      .end((err, res) => {
        callback(res.body.data.token);
      });
  }
  function addQuestionnaire(questionnaire, callback) {
    register((token) => {
      chai
        .request(server)
        .post("/api/questionnaire")
        .set("authorization", token)
        .send(questionnaire)
        .end((err, res) => {
          callback(res);
        });
    });
  }
  function addAnswer(questionnaire, answers, callback) {
    addQuestionnaire(questionnaire, (outerRes) => {
      const id = outerRes.body.data._id;
      chai
        .request(server)
        .post("/api/questionnaire/" + id)
        .send({ answers })
        .end((err, res) => {
          callback(res);
        });
    });
  }

  beforeEach(async function () {
    await User.deleteMany();
    await Questionnaire.deleteMany();
  });

  describe("Anonym", function () {
    it("GET Questionnaires (empty)", function (done) {
      chai
        .request(server)
        .get("/api/questionnaire")
        .end((err, res) => {
          res.body.should.have.property("data").eql([]);
          done();
        });
    });

    it("GET Questionnaire (one)", function (done) {
      addQuestionnaire(questionnaire_1, () => {
        chai
          .request(server)
          .get("/api/questionnaire")
          .end((err, res) => {
            res.body.should.have.property("status").eql("success");
            done();
          });
      });
    });
    it("POST Questionnaire Answer", function (done) {
      addQuestionnaire(questionnaire_1, (outerRes) => {
        const id = outerRes.body.data._id;
        chai
          .request(server)
          .post("/api/questionnaire/" + id)
          .send({ answers: [{ value: 3, Comment: "" }] })
          .end((err, res) => {
            res.body.should.have.property("status").eql("success");
            done();
          });
      });
    });

    it("GET Questionnaire Answer", function (done) {
      addAnswer(questionnaire_1, [{ value: 3, Comment: "" }], (outerRes) => {
        const id = outerRes.body.data.questionnaire;
        chai
          .request(server)
          .get("/api/questionnaire/" + id)
          .end((err, res) => {
            res.body.should.have.property("status").eql("success");
            done();
          });
      });
    });
  });
});
