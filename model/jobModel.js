const mongoose = require('mongoose');
const dayjs = require('dayjs');
const { skills } = require('../constants/index');

const JobSchema = new mongoose.Schema(
    {
        postedBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'Company',
        },
        title: {
            type: String,
            maxlength: [100, 'Tiêu đề của công việc nên ít hơn 100 kí tự'],
            required: [true, 'Tiêu đề là trường bắt buộc'],
        },
        description: {
            type: String,
            maxlength: [1500, 'Mô tả công việc không được vượt quá 1500 kí tự'],
            required: [true, 'Mô tả công việc là trường bắt buộc'],
        },
        photosJob: [String],
        skillsRequire: [
            {
                type: String,
                enum: {
                    values: Object.values(skills).flat(),
                    message: `Chỉ được chọn các kĩ năng trong danh sách sau: ${Object.values(skills)
                        .flat()
                        .join(', ')}`,
                },
            },
        ],
        jobRequire: [
            {
                type: String,
                maxlength: [1500, 'Yêu cầu công việc không được vượt quá 1500 kí tự'],
                required: [true, 'Yêu cầu công việc là trường bắt buộc'],
            },
        ],
        salary: {
            type: Number,
            min: 0,
            required: [true, 'Lương là trường bắt buộc'],
        },
        numberRecruitment: {
            type: Number,
            min: 0,
            default: 1,
        },
        type: {
            type: mongoose.Schema.ObjectId,
            ref: 'CategoryJob',
            required: [true, 'Loại công việc là trường bắt buộc'],
        },
        deadline: {
            type: Date,
            required: [true, 'Bạn chưa chọn ngày kết thúc tuyển dụng'],
            default: dayjs().add(20, 'day'),
        },
        available: {
            type: Boolean,
            default: true,
        },
        isAccepted: {
            type: Boolean,
            default: false,
        },
        isDelete: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

JobSchema.virtual('countApplication', {
    ref: 'JobApplication',
    foreignField: 'job',
    localField: '_id',
    default: [],
    count: true,
});

JobSchema.virtual('applications', {
    ref: 'JobApplication',
    foreignField: 'job',
    localField: '_id',
    default: [],
});

JobSchema.virtual('comments', {
    ref: 'CommentJob',
    foreignField: 'job',
    localField: '_id',
    default: [],
});

const Job = mongoose.model('Job', JobSchema);

module.exports = Job;
