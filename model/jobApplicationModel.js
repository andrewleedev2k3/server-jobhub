const mongoose = require('mongoose');

const JobApplicationSchema = new mongoose.Schema(
    {
        company: {
            type: mongoose.Schema.ObjectId,
            ref: 'Company',
        },
        candicate: {
            type: mongoose.Schema.ObjectId,
            ref: 'JobSeeker',
        },
        job: {
            type: mongoose.Schema.ObjectId,
            ref: 'Job',
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'canceled'],
            default: 'pending',
        },
        interviewDate: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

JobApplicationSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

const JobApplication = mongoose.model('JobApplication', JobApplicationSchema);

module.exports = JobApplication;
