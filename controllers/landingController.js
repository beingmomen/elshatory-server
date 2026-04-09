const catchAsync = require('../utils/catchAsync');
const Project = require('../models/projectModel');
const Service = require('../models/serviceModel');
const Skill = require('../models/skillModel');
const Testimonial = require('../models/testimonialModel');
const Client = require('../models/clientModel');
const Info = require('../models/infoModel');
const Experience = require('../models/experienceModel');
const Faq = require('../models/faqModel');

exports.getLandingData = catchAsync(async (req, res, next) => {
  const [
    skills,
    services,
    testimonials,
    projects,
    projectsCount,
    clients,
    info,
    experiences,
    faqs
  ] = await Promise.all([
    Skill.find().select('title icon -_id').sort('-createdAt').limit(20).lean(),

    Service.find()
      .select('title description altText image -_id')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Testimonial.find({ isConfirmed: true })
      .select('name email description image -_id')
      .sort('-createdAt')
      .limit(20)
      .lean(),

    Project.find({ isActive: true })
      .select('title tag skills skillIds url image altText -_id')
      .sort('-createdAt')
      .limit(6)
      .populate({
        path: 'skills',
        select: 'title -_id'
      })
      .lean(),

    Project.countDocuments({ isActive: true }),

    Client.find().select('image name -_id').sort('-createdAt').limit(20).lean(),

    Info.findOne().select('resumeUrl bio stats skills images -_id').lean(),

    Experience.find()
      .select(
        'company position employmentType workPlace startDate endDate responsibilities linkedInUrl companySiteUrl iconName imageAlt order -_id'
      )
      .sort('order')
      .lean(),

    Faq.find()
      .select('category question answer order -_id')
      .sort('category order')
      .lean()
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
      info,
      experiences,
      faqs
    }
  });
});
