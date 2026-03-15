const mongoose = require('mongoose');
const logger = require('./logger');

const cleanupOldViews = async () => {
  const BlogView = mongoose.model('BlogView');
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    const result = await BlogView.deleteMany({
      timestamp: { $lt: ninetyDaysAgo }
    });

    logger.info(`Cleaned up ${result.deletedCount} old view records`);
    return result;
  } catch (error) {
    logger.error('Error cleaning up old views', error);
    throw error;
  }
};

const resetAllViews = async () => {
  const Blog = mongoose.model('Blog');
  const BlogView = mongoose.model('BlogView');

  try {
    const [blogResult, viewResult] = await Promise.all([
      Blog.updateMany({}, { $set: { uniqueViews: 0 } }),
      BlogView.deleteMany({})
    ]);

    logger.info(
      `Reset views for ${blogResult.modifiedCount} blogs, deleted ${viewResult.deletedCount} view records`
    );
    return { blogResult, viewResult };
  } catch (error) {
    logger.error('Error resetting views', error);
    throw error;
  }
};

const getViewStats = async blogId => {
  const BlogView = mongoose.model('BlogView');
  const Blog = mongoose.model('Blog');

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new Error('Blog not found');
  }

  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [totalViews, viewsLast24h, viewsLastWeek, viewsLastMonth, uniqueIPs] =
    await Promise.all([
      BlogView.countDocuments({ blog: blogId }),
      BlogView.countDocuments({ blog: blogId, timestamp: { $gt: oneDayAgo } }),
      BlogView.countDocuments({
        blog: blogId,
        timestamp: { $gt: oneWeekAgo }
      }),
      BlogView.countDocuments({
        blog: blogId,
        timestamp: { $gt: oneMonthAgo }
      }),
      BlogView.distinct('ip', { blog: blogId })
    ]);

  return {
    totalViews,
    uniqueViews: blog.uniqueViews,
    viewsLast24Hours: viewsLast24h,
    viewsLastWeek,
    viewsLastMonth,
    uniqueIPsAllTime: uniqueIPs.length
  };
};

module.exports = {
  cleanupOldViews,
  resetAllViews,
  getViewStats
};
