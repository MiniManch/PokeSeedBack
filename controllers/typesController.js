const PokeTypes = require('../models/PokeTypes');

exports.getAllTypes = async (req, res) => {
  try {
    const types = await PokeTypes.find({});
    res.json(types);
  } catch (error) {
    res.status(500).json({ message: "Error fetching types", error });
  }
};

exports.getTypeByName = async (req, res) => {
  try {
    const typeName = req.params.name;
    const type = await PokeTypes.findOne({ name: typeName });
    if (!type) {
      return res.status(404).json({ message: "Type not found" });
    }
    res.json(type);
  } catch (error) {
    res.status(500).json({ message: "Error fetching type", error });
  }
};
