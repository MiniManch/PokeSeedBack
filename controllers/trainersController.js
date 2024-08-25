const Trainer = require('../models/PokeTrainers');

exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await Trainer.find({}).populate('team');
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trainers", error });
  }
};

exports.getTrainerByName = async (req, res) => {
  try {
    const trainerName = req.params.name;
    console.log('Fetching trainer with name:', trainerName); // Log the trainer name
    
    const trainer = await Trainer.findOne({ name: trainerName }).populate('team');
    if (!trainer) {
      return res.status(404).json({ message: "Trainer not found" });
    }
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ message: "Error fetching trainer", error });
  }
};
