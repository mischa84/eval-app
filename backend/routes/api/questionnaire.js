const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../../models/User");
const Questionnaire = require("../../models/Questionnaire");
const Answer = require("../../models/Answer");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");

router.route("/").get(async (req, res) => {
  try {
    let user;
    if (req.headers.authorization) {
      const payload = await AuthHelper.verifyToken(req.headers.authorization);
      user = await User.findById(payload.userId);
    } else {
      user = { groups: [] };
    }
    const questionnaires = await Questionnaire.find().or([
      { "visibility.all": true },
      { "visibility.groups": { $in: user.groups } },
      { author: mongoose.Types.ObjectId(user.id) },
    ]);
    return ResHelper.success(res, questionnaires);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").get(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    let user = await User.findById(payload.userId);
    user = user || { groups: [] };
  } catch (err) {
    return ResHelper.error(res, err);
  }
  try {
    questionnaires = await Questionnaire.findById(req.params.id).or([
      { "visibility.all": true },
      { "visibility.groups": { $in: user.groups } },
      { author: mongoose.Types.ObjectId(user.id) },
    ]);
    return ResHelper.success(res, questionnaires);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/").post(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to add a questionnaire",
        403
      );
    }
    const newQuestionnaire = new Questionnaire({
      author: user.id,
      ...req.body,
    });
    const questionnaire = await newQuestionnaire.save();
    ResHelper.success(res, questionnaire, 201);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").put(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to update a questionnaire",
        403
      );
    }
    const oldQuestionnaire = await Questionnaire.findById(req.params.id);
    if (!oldQuestionnaire) {
      return ResHelper.fail(res, "Qestionnaire not found", 404);
    }
    if (user.id != oldQuestionnaire.author) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be the owner to change the questionnaire",
        403
      );
    }
    Object.assign(oldQuestionnaire, req.body);
    const questionnaire = await oldQuestionnaire.save();
    ResHelper.success(res, questionnaire);
  } catch (err) {
    return ResHelper.error(res, err);
  }
});

router.route("/:id").delete(async (req, res) => {
  try {
    const payload = await AuthHelper.verifyToken(req.headers.authorization);
    const user = await User.findById(payload.userId);
    if (!user) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be logged in to delete a questionnaire",
        403
      );
    }
    const oldQuestionnaire = await Questionnaire.findById(req.params.id);
    if (!oldQuestionnaire) {
      return ResHelper.fail(res, "Qestionnaire not found", 404);
    }
    if (user.id != oldQuestionnaire.author) {
      return ResHelper.fail(
        res,
        "Access denied: You need to be the owner to delete the questionnaire",
        403
      );
    }

    const session = await mongoose.startSession();
    session.withTransaction(async () => {
      await Answer.deleteMany(
        {
          questionnaire: mongoose.Types.ObjectId(req.params.id),
        },
        { session }
      );
      await oldQuestionnaire.remove({ session });
    });
    await session.endSession();
    return ResHelper.success(res, { deleted: oldQuestionnaire.id });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      await session.endSession();
    }
    return ResHelper.error(res, err);
  }
});

module.exports = router;
