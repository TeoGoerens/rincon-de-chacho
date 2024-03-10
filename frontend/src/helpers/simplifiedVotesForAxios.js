export const simplifyVotesInformation = (votes) => {
  return votes.map((vote) => ({
    _id: vote._id,
    white_pearl: vote.white_pearl?.id || null,
    vanilla_pearl: vote.vanilla_pearl?.id || null,
    ocher_pearl: vote.ocher_pearl?.id || null,
    black_pearl: vote.black_pearl?.id || null,
  }));
};
