const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema(
    {
        categoryName: {
            type: String,
            required: [true, 'Tên của category là bắt buộc'],
            minlength: [1, 'Tên của category phải có ít nhất 1 kí tự'],
            maxlength: [30, 'Tên của category không được vượt quá 30 kí tự'],
        },
        isHotCategory: {
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

CategorySchema.virtual('totalJobs', {
    ref: 'Job',
    foreignField: 'type',
    localField: '_id',
    default: [],
    match: { isAccepted: true, isDelete: false },
    count: true,
});

CategorySchema.pre(/^find/, function (next) {
    this.select('-__v -createdAt -updatedAt');
    next();
});

const CategoryJob = mongoose.model('CategoryJob', CategorySchema);

module.exports = CategoryJob;
