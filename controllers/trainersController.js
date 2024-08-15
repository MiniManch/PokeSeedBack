const Trainer = require('../models/PokeTrainers');

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find({});
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trainers", error });
  }
};

exports.getTrainerByName = async (req, res) => {
  try {
    const trainerName = req.params.name;
    const trainer = await Trainer.findOne({ name: trainerName });
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trainer", error });
  }
};
