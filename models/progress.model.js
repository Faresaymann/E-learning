const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
    {
        progress: {
            type: Number,
            min: 0,
            max: 100,
        },
        user: {
            type: mongoose.Types.ObjectId,
            ref: "User",
        },
        course: {
            type: mongoose.Types.ObjectId,
            ref: "Course",
        },
        watchedTime: {
            type: Number,
            default: 0,
        },
        watchedModules: [{ // Array to track watched modules
            type: mongoose.Types.ObjectId,
            ref: "Module",
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Progress', progressSchema);
