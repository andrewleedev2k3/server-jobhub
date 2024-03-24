const dayjs = require('dayjs');

const catchAsync = require('../utils/catchAsync');
const { sendResponseToClient } = require('../utils/ultils');

const Job = require('../model/jobModel');
const Company = require('../model/companyModel');
const JobApplication = require('../model/jobApplicationModel');
const User = require('../model/userModel');
const CategoryJob = require('../model/categoryJobModel');

exports.getStatisticJob = catchAsync(async (req, res, next) => {
    const statistic = await Job.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: dayjs().add(-12, 'month').startOf('month').toDate(),
                    $lte: dayjs().endOf('month').toDate(),
                },
            },
        },
        {
            $group: {
                _id: { $month: '$createdAt' },
                amountJob: { $sum: 1 },
            },
        },
        {
            $addFields: { month: '$_id' },
        },
        {
            $sort: { month: 1 },
        },
        {
            $project: {
                _id: 0,
            },
        },
    ]);
    sendResponseToClient(res, 200, {
        status: 'success',
        data: statistic,
    });
});

exports.getTopCompany = catchAsync(async (req, res, next) => {
    const statistic = await Job.aggregate([
        {
            $group: {
                _id: '$postedBy',
                amountJobPosted: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: Company.collection.name,
                localField: '_id',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            companyName: 1,
                            coverPhoto: 1,
                            description: 1,
                            establishDate: 1,
                            location: 1,
                            photo: 1,
                            ban: 1,
                        },
                    },
                ],
                as: 'company',
            },
        },
        { $unwind: '$company' },
        { $match: { ban: { $ne: true } } },
        { $sort: { amountJobPosted: -1 } },
        { $limit: 3 },
    ]);
    sendResponseToClient(res, 200, {
        status: 'success',
        data: statistic,
    });
});

exports.getTopJob = catchAsync(async (req, res, next) => {
    const statistic = await JobApplication.aggregate([
        {
            $group: {
                _id: '$job',
                amountApplication: { $sum: 1 },
            },
        },
        {
            $lookup: {
                from: Job.collection.name,
                localField: '_id',
                foreignField: '_id',
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            description: 1,
                            photosJob: 1,
                            salary: 1,
                            numberRecruitment: 1,
                            type: 1,
                            skillsRequire: 1,
                            deadline: 1,
                            available: 1,
                        },
                    },
                ],
                as: 'job',
            },
        },
        { $unwind: '$job' },
        { $match: { isDelete: { $ne: true } } },
        { $match: { isAccepted: { $ne: false } } },
        { $sort: { amountApplication: -1 } },
        { $limit: 3 },
    ]);
    sendResponseToClient(res, 200, {
        status: 'success',
        data: statistic,
    });
});

exports.getStatisticTotal = catchAsync(async (req, res, next) => {
    const totalUsers = await User.countDocuments();
    const totalApplications = await JobApplication.countDocuments();
    const totalJobs = await Job.countDocuments();
    const totalCategories = await CategoryJob.countDocuments();

    sendResponseToClient(res, 200, {
        status: 'success',
        data: {
            totalUsers,
            totalApplications,
            totalJobs,
            totalCategories,
        },
    });
});
