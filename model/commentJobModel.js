const mongoose = require('mongoose');

const CommentJobSchema = new mongoose.Schema(
    {
        job: {
            type: mongoose.Schema.ObjectId,
            ref: 'Job',
        },
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
        },
        content: {
            type: String,
            maxlength: [250, 'Nội dung thông báo không được vượt quá 250 kí tự'],
            minlength: [1, 'Nội dung thông báo phải có ít nhất 1 kí tự'],
            required: [true, 'Nội dung thông báo là bắt buộc'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);

const CommentJob = mongoose.model('CommentJob', CommentJobSchema);

module.exports = CommentJob;
