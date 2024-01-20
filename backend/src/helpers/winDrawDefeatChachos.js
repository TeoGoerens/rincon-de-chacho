const defineMatchOutcome = async (score_chachos, score_rival) => {
  let win = false;
  let draw = false;
  let defeat = false;

  if (
    typeof score_chachos === "number" &&
    typeof score_rival === "number" &&
    Number.isInteger(score_chachos) &&
    Number.isInteger(score_rival)
  ) {
    if (score_chachos > score_rival) {
      win = true;
    } else if (score_chachos === score_rival) {
      draw = true;
    } else {
      defeat = true;
    }
  }

  console.log(win, draw, defeat);

  return { win, draw, defeat };
};

export default defineMatchOutcome;
