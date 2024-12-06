const validateCronicaFields = (req, res, next) => {
  const { title, subtitle, year, body } = req.body;

  if (!title || !subtitle || !year || !body) {
    return res.status(400).json({
      message: "All required fields must be provided",
    });
  }

  next();
};

export default validateCronicaFields;
