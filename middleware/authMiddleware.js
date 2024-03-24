const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../model/userModel');

exports.protectLogin = catchAsync(async (req, res, next) => {
    let token;
    const dateNow = new Date();
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(new AppError('Bạn hiện đang chưa đăng nhập. Vui lòng đăng nhập để tiếp tục', 401));
    }
    if (token.exp < dateNow.getTime() / 1000) {
        return next(new AppError('Token đã hết hạn', 403));
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_ACCESS_KEY);
    const user = await User.findOne({ _id: decoded.id });
    if (!user) {
        return next(new AppError('Người dùng hiện không còn tồn tại', 401));
    }
    if (user.ban) {
        return next(new AppError('Bạn đã bị khóa bởi quản trị viên', 401));
    }
    if (user.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Người dùng này đã thay đổi mật khẩu. Vui lòng đăng nhập lại', 401));
    }
    req.user = user;
    next();
});

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Bạn không được cấp quyền để thực hiện hành động này', 403));
        }

        next();
    };
};

exports.checkOwner = (Model, property = 'user') => {
    return catchAsync(async (req, res, next) => {
        if (req.user.role === 'admin') return next();

        const document = await Model.findById(req.params.id);
        if (!document) {
            return next(new AppError('Document không tồn tại !!!', 400));
        }
        if (
            !(document?.[property].toString() === req.user.id.toString()) &&
            !(document?.[property]?._id.toString() === req.user.id.toString())
        ) {
            return next(new AppError('Bạn không được cấp quyền để thực hiện hành động này', 400));
        }
        next();
    });
};
