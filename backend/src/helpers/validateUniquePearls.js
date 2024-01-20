const validateUniquePearls = async (vote) => {
  const pearls = [
    vote.white_pearl,
    vote.vanilla_pearl,
    vote.ocher_pearl,
    vote.black_pearl,
  ];

  // Filter all undefined values (in case any field is empty)
  const filteredPearls = pearls.filter(
    (pearl) => pearl !== undefined && pearl !== "" && pearl !== null
  );

  // Transform filtered pearls array into a set to eliminate duplicate values
  const uniquePearls = new Set(filteredPearls);

  // If the length of original array differs from filtered array, it means that the user has forgotten to vote a specific pearl
  if (pearls.length !== filteredPearls.length) {
    return {
      isValid: false,
      message:
        "Your vote is incomplete. Please check that you have voted for all pearls",
    };
  }

  //If the length of filtered array differs from unique array, it means that there are duplicates
  if (uniquePearls.size !== filteredPearls.length) {
    return {
      isValid: false,
      message:
        "It seems you have voted twice for the same player. Please review your vote",
    };
  }

  return { isValid: true, message: "Vote correctly submitted" };
};

export default validateUniquePearls;
