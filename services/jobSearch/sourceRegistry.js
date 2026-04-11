/**
 * Source Registry
 *
 * A simple map of source key → runner function.
 * Makes it easy to add new job sources (LinkedIn, etc.) in future milestones
 * without changing the controller.
 *
 * Usage:
 *   const { register, getRunner } = require('./sourceRegistry');
 *   register('wuzzuf', runWuzzufSearch);
 *   const runner = getRunner('wuzzuf'); // → runWuzzufSearch
 */

const registry = new Map();

function register(key, runner) {
  registry.set(key, runner);
}

function getRunner(key) {
  return registry.get(key) || null;
}

function listSources() {
  return [...registry.keys()];
}

module.exports = { register, getRunner, listSources };
