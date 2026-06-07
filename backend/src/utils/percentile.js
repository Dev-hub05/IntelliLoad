/**
 * Calculate a percentile from a sorted array of numbers.
 * @param {number[]} sortedArr - Pre-sorted array of numbers
 * @param {number} p - Percentile (0-1), e.g. 0.95
 * @returns {number}
 */
function percentile(sortedArr, p) {
  if (!sortedArr || sortedArr.length === 0) return 0;
  const index = Math.ceil(sortedArr.length * p) - 1;
  return sortedArr[Math.max(0, index)];
}

module.exports = { percentile };
