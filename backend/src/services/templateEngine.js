const crypto = require('crypto');

// Predefined set of names for randomName variable
const NAMES = [
  'Alice Smith', 'Bob Jones', 'Charlie Brown', 'Diana Prince', 'Evan Wright',
  'Fiona Gallagher', 'George Clark', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
  'Kevin Bacon', 'Laura Croft', 'Michael Scott', 'Natalie Portman', 'Oliver Queen',
  'Penelope Cruz', 'Quentin Tarantino', 'Rachel Green', 'Steve Rogers', 'Tony Stark'
];

/**
 * Generates a random name from a static collection.
 */
function getRandomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

/**
 * Replaces template variables in a string/JSON.
 * Supported variables:
 * - {{randomId}}       : 8-char hex string
 * - {{uuid}}           : Standard UUID v4
 * - {{timestamp}}      : Current Unix timestamp (ms)
 * - {{isoDate}}        : ISO 8601 string
 * - {{randomInt}}      : Random integer between 0 and 99999
 * - {{randomEmail}}    : Random email e.g. user_abc123@test.com
 * - {{randomName}}     : Random name from names list
 * 
 * Also supports runtime variables passed via customContext (e.g. from response extraction)
 * - {{customVar}}      : Replaced by customContext['customVar']
 * 
 * @param {string} templateStr - String containing template variables
 * @param {Object} [customContext={}] - Key-value pair object of custom extracted variables
 * @returns {string} Fully expanded string
 */
function expandTemplate(templateStr, customContext = {}) {
  if (typeof templateStr !== 'string') {
    return templateStr;
  }

  let result = templateStr;

  // 1. Process standard dynamic variables
  result = result.replace(/\{\{randomId\}\}/g, () => crypto.randomBytes(4).toString('hex'));
  result = result.replace(/\{\{uuid\}\}/g, () => crypto.randomUUID());
  result = result.replace(/\{\{timestamp\}\}/g, () => Date.now().toString());
  result = result.replace(/\{\{isoDate\}\}/g, () => new Date().toISOString());
  result = result.replace(/\{\{randomInt\}\}/g, () => Math.floor(Math.random() * 100000).toString());
  result = result.replace(/\{\{randomEmail\}\}/g, () => `user_${crypto.randomBytes(3).toString('hex')}@test.com`);
  result = result.replace(/\{\{randomName\}\}/g, () => getRandomName());

  // 2. Process custom context variables (if provided)
  if (customContext && Object.keys(customContext).length > 0) {
    for (const [key, value] of Object.entries(customContext)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
    }
  }

  return result;
}

module.exports = {
  expandTemplate,
  getRandomName
};
