const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
    {
        course: {
            type: mongoose.Schema.ObjectId,
            ref: 'Course',
        },
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        url: {
            type: String
        },
        score:{
            type:String
        }
    },
    { timestamps: true }
);
module.exports = mongoose.model('Certificate', certificateSchema);
