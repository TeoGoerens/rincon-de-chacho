export const matchStatsSort = (array, criteria) => {
  // Check if playersStats is empty array
  if (!array || !Array.isArray(array) || array.length === 0) {
    return []; // Return empty array if input is not a valid array or empty
  }

  const matchStatsSorted = array
    .slice()
    .sort((a, b) => b[criteria] - a[criteria]);
  return matchStatsSorted;
};
