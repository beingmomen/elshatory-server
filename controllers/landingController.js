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
    Skill.find().select('title icon -createdAt').lean(),

    Service.find().select('title description altText image -createdAt').lean(),

    Testimonial.find({ isConfirmed: true })
      .select('name email description image -createdAt')
      .lean(),

    Project.find({ isActive: true })
      .select('title tag tags skillIds url image altText -createdAt')
      .limit(6)
      .populate({
        path: 'tags',
        select: 'title -createdAt'
      })
      .lean(),

    Project.find({ isActive: true }).countDocuments(),

    Client.find().select('image name -createdAt').lean(),

    Info.findOne().select('resumeUrl -createdAt').lean()
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
