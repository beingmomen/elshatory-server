const { validate, parseFormFields } = require('./common');
const {
  signupRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updatePasswordRules,
  updateMeRules,
  createAdminRules
} = require('./user.validator');
const {
  createProjectRules,
  updateProjectRules
} = require('./project.validator');
const { createBlogRules, updateBlogRules } = require('./blog.validator');
const {
  createServiceRules,
  updateServiceRules
} = require('./service.validator');
const { createSkillRules, updateSkillRules } = require('./skill.validator');
const { createClientRules, updateClientRules } = require('./client.validator');
const {
  createContactRules,
  updateContactRules
} = require('./contact.validator');
const {
  createTestimonialRules,
  updateTestimonialRules
} = require('./testimonial.validator');
const {
  createResourceRules,
  updateResourceRules
} = require('./resource.validator');
const { createInfoRules, updateInfoRules } = require('./info.validator');
const {
  createExperienceRules,
  updateExperienceRules
} = require('./experience.validator');
const { createFaqRules, updateFaqRules } = require('./faq.validator');
const {
  createJobSearchRunRules,
  updateJobRules,
  importJobRules,
  updateCareerProfileSettingsRules
} = require('./job.validator');

module.exports = {
  validate,
  parseFormFields,
  signupRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updatePasswordRules,
  updateMeRules,
  createAdminRules,
  createProjectRules,
  updateProjectRules,
  createBlogRules,
  updateBlogRules,
  createServiceRules,
  updateServiceRules,
  createSkillRules,
  updateSkillRules,
  createClientRules,
  updateClientRules,
  createContactRules,
  updateContactRules,
  createTestimonialRules,
  updateTestimonialRules,
  createResourceRules,
  updateResourceRules,
  createInfoRules,
  updateInfoRules,
  createExperienceRules,
  updateExperienceRules,
  createFaqRules,
  updateFaqRules,
  createJobSearchRunRules,
  updateJobRules,
  importJobRules,
  updateCareerProfileSettingsRules
};
