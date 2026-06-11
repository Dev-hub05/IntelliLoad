const crypto = require('crypto');

// A list of common random names to select from
const NAMES = [
  'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Evan Wright',
  'Fiona Gallagher', 'George Clark', 'Hannah Abbott', 'Ian Malcolm', 'Julia Roberts',
  'Kevin Bacon', 'Laura Croft', 'Michael Scott', 'Natalie Portman', 'Oliver Twist',
  'Penelope Cruz', 'Quentin Tarantino', 'Rachel Green', 'Steve Rogers', 'Tony Stark'
];

function getRandomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)];
}

/**
 * Replaces placeholders like {{randomId}}, {{uuid}}, {{timestamp}}, {{isoDate}},
 * {{randomInt}}, {{randomEmail}}, {{randomName}}, and any custom runtime variables
 * in a template string (usually a request body).
 * 
 * @param {string} template - The string containing placeholders
 * @param {Object} variables - Extracted variables from previous collection requests
 * @returns {string} The expanded string
 */
function expandTemplate(template, variables = {}) {
  if (!template || typeof template !== 'string') return '';

  let result = template;

  // 1. First, replace built-in system variables
  result = result.replace(/\{\{randomId\}\}/g, () => crypto.randomBytes(4).toString('hex'));
  result = result.replace(/\{\{uuid\}\}/g, () => crypto.randomUUID());
  result = result.replace(/\{\{timestamp\}\}/g, () => Date.now().toString());
  result = result.replace(/\{\{isoDate\}\}/g, () => new Date().toISOString());
  result = result.replace(/\{\{randomInt\}\}/g, () => Math.floor(Math.random() * 100000).toString());
  result = result.replace(/\{\{randomEmail\}\}/g, () => `user_${crypto.randomBytes(3).toString('hex')}@test.com`);
  result = result.replace(/\{\{randomName\}\}/g, () => getRandomName());

  // 2. Replace runtime/custom variables from context (e.g. {{authToken}})
  if (variables && typeof variables === 'object') {
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value !== undefined && value !== null ? String(value) : '');
    }
  }

  return result;
}

module.exports = {
  expandTemplate
};
