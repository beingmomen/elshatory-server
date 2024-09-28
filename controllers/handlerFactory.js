const deleteImageMiddleware = require('../utils/deleteImageMiddleware');

const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const APIFeatures = require('./../utils/apiFeatures');

exports.deleteOne = (Model, images = []) => (req, res, next) => {
  deleteImageMiddleware(Model, images)(req, res, () => {
    catchAsync(async (req, res, next) => {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return next(new AppError('No document found with that ID', 404));
      }

      res.status(200).json({
        status: 'success',
        message: 'Deleted successfully',
        data: null
      });
    })(req, res, next);
  });
};

exports.updateOne = Model =>
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
      data: {
        data: doc
      }
    });
  });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create({ ...req.body, user: req.user._id });

    res.status(201).json({
      status: 'success',
      message: 'Created successfully',
      data: {
        data: doc
      }
    });
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
      data: {
        data: doc
      }
    });
  });

exports.getAll = (Model, popOptions = [], nextStep = false, stopRes = true) =>
  catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)

    const mergeFilter = req.mergeFilter || {};
    const otherPop = req.otherPop || '';

    let filter = { role: { $ne: 'dev' }, ...mergeFilter };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .search();

    const total = await Model.countDocuments(features.query);

    if (req.query.limit !== 'all') {
      features.paginate();
    }

    const doc = await features.query.populate(popOptions).select(otherPop);

    req.resultDocs = {
      status: 'success',
      total: total,
      results: doc.length,
      data: doc
    };

    if (stopRes) {
      // SEND RESPONSE
      res.status(200).json({
        status: 'success',
        total: total,
        results: doc.length,
        data: doc
      });
    }

    if (nextStep) next();
  });

exports.getAllNoPagination = (Model, popOptions = [], selectFields = '') =>
  catchAsync(async (req, res, next) => {
    const query = Model.find().select(selectFields);

    if (popOptions.length > 0) {
      query.populate(popOptions);
    }

    const doc = await query;

    // SEND RESPONSE
    res.status(200).json(doc);
  });
