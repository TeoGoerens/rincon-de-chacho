export const matchStatsSort = (array, criteria) => {
  const matchStatsSorted = array
    .slice()
    .sort((a, b) => b[criteria] - a[criteria]);
  return matchStatsSorted;
};
