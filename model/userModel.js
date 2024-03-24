const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');

const userSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: [true, 'Please tell us your frist name'],
            maxlength: [30, 'First name should be less than 30 character'],
        },
        lastName: {
            type: String,
            required: [true, 'Please tell us your last name'],
            maxlength: [30, 'Last name should be less than 30 character'],
        },
        email: {
            type: String,
            required: [true, 'Please provide your email'],
            unique: true,
            lowercase: true,
            validate: [validator.isEmail, 'Please provide a valid email'],
        },
        phoneNumber: {
            type: String,
            required: [true, 'Please provide your phone number'],
            maxlength: [10, 'Phone number must have 10 character'],
            minlength: [10, 'Phone number must have 10 character'],
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'others'],
            default: 'male',
        },
        photo: {
            type: String,
            default: 'https://res.cloudinary.com/dcv1op3hs/image/upload/v1697170940/users/ogk5xpi6dc8agk9d4cq9.png',
        },

        location: {
            type: {
                city: {
                    type: String,
                    required: [true, 'Bạn chưa chọn Tỉnh/Thành phố'],
                },
                district: {
                    type: String,
                    required: [true, 'Bạn chưa chọn quận/huyện'],
                },
                address: {
                    type: String,
                    required: [true, 'Bạn chưa nhập địa chỉ chi tiết'],
                },
            },
            required: [true, 'Thông tin địa chỉ là trường bắt buộc'],
        },

        follows: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
        followers: [
            {
                type: mongoose.Schema.ObjectId,
                ref: 'User',
            },
        ],
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        ban: {
            type: Boolean,
            default: false,
        },
        password: {
            type: String,
            required: [true, 'Please provide a password'],
            minlength: 8,
            select: false,
        },
        passwordConfirm: {
            type: String,
            required: [true, 'Please confirm your password'],
            validate: {
                // This only works on CREATE and SAVE!!! EVEN IF use options new and runValidator in findAndUpdate
                validator: function (value) {
                    // This === curent document
                    return value === this.password;
                },
                message: 'Passwords are not the same!',
            },
        },
        refreshToken: { type: String, select: false },
        otp: String,
        otpExpires: Date,
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    },
);
userSchema.virtual('notifications', {
    ref: 'Notification',
    foreignField: 'receiver',
    localField: '_id',
    default: [],
});

userSchema.pre(/^find/, function (next) {
    this.select('-__v');
    next();
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.passwordConfirm = undefined;
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.correctPassword = async (userPassword, passwordFromUser) => {
    return await bcrypt.compare(passwordFromUser, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    // False means NOT changed
    return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
