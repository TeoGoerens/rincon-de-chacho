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
        "Tu voto está incompleto. Por favor fijate que hayas votado todas las perlas",
    };
  }

  //If the length of filtered array differs from unique array, it means that there are duplicates
  if (uniquePearls.size !== filteredPearls.length) {
    return {
      isValid: false,
      message:
        "Parece que votaste dos veces por el mismo jugador. Por favor corregí tu voto",
    };
  }

  return { isValid: true, message: "El voto fue correctamente registrado" };
};

export default validateUniquePearls;
