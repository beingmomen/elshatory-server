/* eslint-disable no-shadow */
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteAll = Model =>
  catchAsync(async (req, res, next) => {
    await Model.deleteMany({});

    res.status(200).json({
      status: 'success',
      message: 'Deleted successfully',
      data: null
    });
  });

exports.deleteOne = (Model, nextStep = false) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    if (nextStep) {
      req.deletedRecord = doc;
      return next();
    }

    res.status(200).json({
      status: 'success',
      message: 'Deleted successfully',
      data: null
    });
  });

exports.updateOne = (Model, nextStep = false) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      message: 'Updated successfully',
      data: doc
    });

    if (nextStep) {
      req.updatedRecord = doc;
      next();
    }
  });

exports.createOne = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { nextStep = false, assignUser = true } = options;
    const body = { ...req.body };
    if (assignUser && req.user) {
      body.user = req.user._id;
    }
    const doc = await Model.create(body);

    res.status(201).json({
      status: 'success',
      message: 'Created successfully',
      data: doc
    });

    if (nextStep) {
      req.createdRecord = doc;
    }
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) query = query.populate(popOptions);

    const doc = await query;

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: doc
    });
  });

exports.getAll = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const {
      optFilter = {},
      optSort = {},
      popOptions = [],
      sendResponse = true,
      nextStep = false
    } = options;

    // Build query filter
    const queryFilter = {
      ...(req.mergeFilter || {}),
      ...optFilter
    };

    // Initialize API features with combined query parameters
    const features = new APIFeatures(Model.find(queryFilter), {
      ...req.query,
      ...optSort
    })
      .filter()
      .sort()
      .limitFields()
      .search();

    // Get total count before pagination
    const total = await Model.countDocuments(features.query);

    // Apply pagination after getting total
    features.paginate();

    // Execute paginated query
    const documents = await features.query
      .populate(popOptions)
      .select(req.otherPop || '');

    // Prepare response data
    const responseData = {
      status: 'success',
      total,
      results: documents.length,
      data: documents
    };

    // Store result in request object for potential middleware
    req.resultDocs = responseData;

    // Send response if required
    if (sendResponse) {
      res.status(200).json(responseData);
    }

    if (nextStep) {
      next();
    }
  });

exports.getAllNoPagination = (Model, options = {}) =>
  catchAsync(async (req, res, next) => {
    const { optFilter = {}, popOptions = [], selectFields = '' } = options;

    const query = Model.find({ ...optFilter }).select(selectFields);

    if (popOptions.length > 0) {
      query.populate(popOptions);
    }

    const doc = await query;

    // SEND RESPONSE
    res.status(200).json(doc);
  });
