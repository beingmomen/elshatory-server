const mongoose = require('mongoose');
const catchAsync = require('./catchAsync');

/**
 * Clean up old view history records to maintain performance
 * Removes view records older than 90 days
 */
const cleanupOldViews = catchAsync(async () => {
  const Blog = mongoose.model('Blog');
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  try {
    const result = await Blog.updateMany(
      {},
      {
        $pull: {
          viewHistory: {
            timestamp: { $lt: ninetyDaysAgo }
          }
        }
      }
    );

    console.log(
      `Cleaned up old view records from ${result.modifiedCount} blogs`
    );
    return result;
  } catch (error) {
    console.error('Error cleaning up old views:', error);
    throw error;
  }
});

/**
 * Reset views for development/testing purposes
 * WARNING: This will reset all view counts and history
 */
const resetAllViews = catchAsync(async () => {
  const Blog = mongoose.model('Blog');

  try {
    const result = await Blog.updateMany(
      {},
      {
        $set: {
          views: 0,
          uniqueViews: 0,
          viewHistory: []
        }
      }
    );

    console.log(`Reset views for ${result.modifiedCount} blogs`);
    return result;
  } catch (error) {
    console.error('Error resetting views:', error);
    throw error;
  }
});

/**
 * Get view statistics for a specific blog
 */
const getViewStats = catchAsync(async blogId => {
  const Blog = mongoose.model('Blog');

  const blog = await Blog.findById(blogId).select('+viewHistory');
  if (!blog) {
    throw new Error('Blog not found');
  }

  const now = new Date();
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const stats = {
    totalViews: blog.views,
    uniqueViews: blog.uniqueViews,
    viewsLast24Hours: blog.viewHistory.filter(
      view => view.timestamp > oneDayAgo
    ).length,
    viewsLastWeek: blog.viewHistory.filter(view => view.timestamp > oneWeekAgo)
      .length,
    viewsLastMonth: blog.viewHistory.filter(
      view => view.timestamp > oneMonthAgo
    ).length,
    uniqueIPsLast24Hours: new Set(
      blog.viewHistory
        .filter(view => view.timestamp > oneDayAgo)
        .map(view => view.ip)
    ).size,
    uniqueIPsLastWeek: new Set(
      blog.viewHistory
        .filter(view => view.timestamp > oneWeekAgo)
        .map(view => view.ip)
    ).size,
    uniqueIPsLastMonth: new Set(
      blog.viewHistory
        .filter(view => view.timestamp > oneMonthAgo)
        .map(view => view.ip)
    ).size
  };

  return stats;
});

module.exports = {
  cleanupOldViews,
  resetAllViews,
  getViewStats
};
