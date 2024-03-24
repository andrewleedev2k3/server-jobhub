const mongoose = require('mongoose');
const User = require('./userModel');
const { skills } = require('../constants/index');

const jobSeekerSchema = new mongoose.Schema(
    {
        introduce: {
            type: String,
            maxlength: [1500, 'Lời giới thiệu nên ít hơn 1500 kí tự'],
        },
        cvImage: {
            type: String,
        },
        skills: [
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
        educate: [
            {
                type: {
                    major: {
                        type: String,
                        maxlength: [50, 'Ngành học có tối đa 50 kí tự'],
                        required: [true, 'Tên ngành học là bắt buộc'],
                    },
                    school: {
                        type: String,
                        maxlength: [50, 'Tên trường có tối đa 50 kí tự'],
                        required: [true, 'Tên trường học là bắt buộc'],
                    },
                    date: {
                        from: {
                            type: Date,
                            required: [true, 'Thời gian nhập học là bắt buộc'],
                        },
                        to: {
                            type: Date,
                        },
                    },
                    isLearning: {
                        type: Boolean,
                        default: false,
                    },
                },
            },
        ],
        certificate: [
            {
                name: { type: String, required: [true, 'Tên của chứng chỉ là bắt buộc'] },
                organization: { type: String, required: [true, 'Tên của tổ chức cung cấp chứng chỉ là bắt buộc '] },
                date: {
                    from: {
                        type: Date,
                        required: [true, 'Phải có thời gian bắt đầu học chứng chỉ'],
                    },
                    to: {
                        type: Date,
                        required: [true, 'Phải có thời gian kết thúc của chứng chỉ'],
                    },
                },
            },
        ],
        experiences: [
            {
                position: {
                    type: String,
                    required: [true, 'Vị trí công việc là bắt buộc'],
                    maxlength: [50, 'Vị trí công việc nên ít hơn 50 kí tự'],
                },
                company: {
                    type: String,
                    required: [true, 'Tên công ty là bắt buộc'],
                    maxlength: [50, 'Tên công ty nên ít hơn 50 kí tự'],
                },
                date: {
                    from: {
                        type: Date,
                        required: [true, 'Phải có thời gian bắt đầu làm việc'],
                    },
                    to: {
                        type: Date,
                    },
                },
                isWorking: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
        projects: [
            {
                name: {
                    type: String,
                    maxlength: [50, 'Tên của dự án nên ít hơn 50 kí tự'],
                    required: [true, 'Phải nhập tên của dự án'],
                },
                description: {
                    type: String,
                    maxlength: [250, 'Mô tả về dự án nên ít hơn 250 kí tự'],
                },
                url: {
                    type: String,
                },
                date: {
                    from: {
                        type: Date,
                        required: [true, 'Phải có thời gian bắt đầu thực hiện dự án'],
                    },
                    to: {
                        type: Date,
                    },
                },
                isWorking: {
                    type: Boolean,
                    default: false,
                },
            },
        ],
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

jobSeekerSchema.virtual('jobHistory', {
    ref: 'JobApplication',
    foreignField: 'candicate',
    localField: '_id',
    default: [],
});

const options = { discriminatorKey: 'kind' };
const JobSeeker = User.discriminator('JobSeeker', jobSeekerSchema, options);

module.exports = JobSeeker;
