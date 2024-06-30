export const countUniqueValues = (array, field) => {
  const uniqueValues = new Set();

  array?.forEach((item) => {
    if (item[field]) {
      uniqueValues.add(item[field]);
    }
  });

  return uniqueValues.size;
};
