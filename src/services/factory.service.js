const asyncHandler = require("express-async-handler");
const { recordNotFound } = require("../utils/response/errors");
const { success } = require("../utils/response/response");
const ApiFeatures = require("./api-features.service");

exports.getOne = (Model, populationOpt) =>
  asyncHandler(async (req, res, next) => {
    // 1- build query
    let query = Model.findById(req.params.id);
    if (populationOpt) query = query.populate(populationOpt);

    // 2- execute query
    const document = await query;

    // 3- check if Model exists
    if (!document) {
      return next(
        recordNotFound({
          message: `model with id ${req.params.id} not found`,
        })
      );
    }

    // 4- send response with Model info
    const { statusCode, body } = success({ data: document });
    res.status(statusCode).json(body);
  });

exports.updateOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    // 1- update Model by id
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    // 2- check if Model exists
    if (!document) {
      return next(
        recordNotFound({ message: `user with id ${req.params.id} not found` })
      );
    }

    // 3- send response back
    const { statusCode, body } = success({ data: document });
    res.status(statusCode).json(body);
  });

exports.deleteOne = (Model) =>
  asyncHandler(async (req, res, next) => {
    // 1- delete Model by id
    const document = await Model.findByIdAndDelete(req.params.id);

    // 2- check if Model exists
    if (!document) {
      return next(
        recordNotFound({ message: `Model with id ${req.params.id} not found` })
      );
    }

    // 3- send response back
    const { statusCode, body } = success({
      message: `was deleted successfully`,
    });
    res.status(statusCode).json(body);
  });

exports.createOne = (Model) =>
  asyncHandler(async (req, res) => {
    // 1- create new Model
    const document = await Model.create(req.body);

    // 2- send response back
    const { statusCode, body } = success({
      message: `new Model was created successfully`,
      data: document,
    });
    res.status(statusCode).json(body);
  });

exports.getAll = (Model, modelName = "") =>
  asyncHandler(async (req, res) => {
    // Build query
    // const documentsCounts = await Model.countDocuments();
    const apiFeatures = new ApiFeatures(Model.find({}), req.query)
      // .paginate(documentsCounts)
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    // Execute query
    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    const { body, statusCode } = success({
      data: { results: documents, paginationResult },
    });
    res.status(statusCode).json(body);
  });
