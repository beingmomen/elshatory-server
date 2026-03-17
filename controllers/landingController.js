const catchAsync = require('../utils/catchAsync');
const Project = require('../models/projectModel');
const Service = require('../models/serviceModel');
const Skill = require('../models/skillModel');
const Testimonial = require('../models/testimonialModel');
const Client = require('../models/clientModel');
const Info = require('../models/infoModel');

exports.getLandingData = catchAsync(async (req, res, next) => {
  const [
    skills,
    services,
    testimonials,
    projects,
    projectsCount,
    clients,
    info
  ] = await Promise.all([
    Skill.find()
      .select('title icon -_id -createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Service.find()
      .select('title description altText image -_id -createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Testimonial.find({ isConfirmed: true })
      .select('name email description image -_id -createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Project.find({ isActive: true })
      .select('title tag skills skillIds url image altText -createdAt')
      .sort('-createdAt')
      .limit(6)
      .populate({
        path: 'skills',
        select: 'title -_id -createdAt'
      })
      .lean(),

    Project.countDocuments({ isActive: true }),

    Client.find()
      .select('image name -_id -createdAt')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Info.findOne().select('resumeUrl -_id -createdAt').lean()
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      skills,
      services,
      testimonials,
      projects,
      projectsTotal: projectsCount,
      clients,
      info
    }
  });
});
