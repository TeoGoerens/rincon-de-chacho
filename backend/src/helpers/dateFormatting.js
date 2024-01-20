const dateFormattingToArgentina = (date) => {
  const formattedDate = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
};

export default dateFormattingToArgentina;
