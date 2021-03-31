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
  const Q_all_all = {
    title: "Feelings",
    questions: [
      { question: "How are you?", scale: 6 },
      { question: "How tall are you?", scale: 200 },
    ],
    participants: { all: true, groups: [] },
    visibility: { all: true, groups: [] },
  };
  const answer_1 = [
    { value: 1, comment: "" },
    { value: 100, comment: "" },
  ];
  const answer_2 = [
    { value: 2, comment: "" },
    { value: 150, comment: "" },
  ];
  const answer_3 = [
    { value: 3, comment: "" },
    { value: 200, comment: "" },
  ];

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
  function addAnswers(questionnaire, answers, callback) {
    function add(qid, answers, res) {
      if (answers.length) {
        answer = answers.pop();
        chai
          .request(server)
          .post("/api/questionnaire/" + qid)
          .send({ answers: answer })
          .end((err, res) => {
            add(qid, answers, res);
          });
      } else {
        callback(res, qid);
      }
    }
    addQuestionnaire(questionnaire, (res) => {
      const qid = res.body.data._id;
      add(qid, answers, res);
    });
  }

  beforeEach(async function () {
    await User.deleteMany();
    await Questionnaire.deleteMany();
    await Answer.deleteMany();
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
      addQuestionnaire(Q_all_all, () => {
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
      addQuestionnaire(Q_all_all, (outerRes) => {
        const id = outerRes.body.data._id;
        chai
          .request(server)
          .post("/api/questionnaire/" + id)
          .send({ answers: answer_1 })
          .end((err, res) => {
            res.body.should.have.property("status").eql("success");
            done();
          });
      });
    });

    it("GET Questionnaire Answer", function (done) {
      addAnswers(Q_all_all, [answer_1, answer_2, answer_3], (outerRes, qid) => {
        chai
          .request(server)
          .get("/api/questionnaire/" + qid)
          .end((err, res) => {
            res.body.should.have.property("status").eql("success");
            done();
          });
      });
    });
  });
});
