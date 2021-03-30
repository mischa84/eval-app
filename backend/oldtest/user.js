process.env.NODE_ENV = "test";

const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();

const User = require("../models/User");
const Questionnaire = require("../models/Questionnaire");

const server = require("../index");

chai.use(chaiHttp);

describe("User", function () {
  before(async function () {
    await User.deleteMany();
  });

  describe("register", function () {
    const newUser = {
      username: "Mika",
      password: "123456",
      groups: ["abc", "123"],
    };

    it("Register new user successfully", function (done) {
      chai
        .request(server)
        .post("/api/register")
        .send(newUser)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a("Object");
          res.body.should.have.property("data");
          done();
        });
    });
  });
});
