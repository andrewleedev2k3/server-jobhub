const mongoose = require('mongoose');
const User = require('./userModel');

const CompanySchema = new mongoose.Schema(
    {
        companyName: {
            type: String,
            maxlength: [100, 'Tên của công ty có tối đa 100 kí tự'],
            required: [true, 'Tên công ty là trường bắt buộc'],
        },
        description: {
            type: String,
            maxlength: [1500, 'Mô tả của công ty không nên vượt quá 1500 kí tự'],
        },
        establishDate: {
            type: Date,
            required: [true, 'Ngày thành lập công ty là trường bắt buộc'],
        },
        companySize: {
            type: {
                from: {
                    type: Number,
                    min: 0,
                    default: 1,
                    required: [true, 'Quy mô nhân sự của công ty là trường bắt buộc'],
                },
                to: {
                    type: Number,
                    min: 0,
                    default: 10,
                    required: [true, 'Quy mô nhân sự của công ty là trường bắt buộc'],
                },
            },
            required: [true, 'Quy mô nhân sự của công ty là trường bắt buộc'],
        },
        coverPhoto: {
            type: String,
            default: 'https://res.cloudinary.com/dcv1op3hs/image/upload/v1697170940/users/ogk5xpi6dc8agk9d4cq9.png',
        },
        website: String,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

CompanySchema.virtual('jobList', {
    ref: 'Job',
    foreignField: 'postedBy',
    localField: '_id',
    default: [],
});
CompanySchema.virtual('totalJobCreated', {
    ref: 'Job',
    foreignField: 'postedBy',
    localField: '_id',
    count: true,
});

const options = { discriminatorKey: 'kind' };
const Company = User.discriminator('Company', CompanySchema, options);

module.exports = Company;
