const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');
const APIFeatures = require('../utils/apiFeatures');

const Job = require('../model/jobModel');
const User = require('../model/userModel');
const Notification = require('../model/notificationModel');

exports.getAllUser = catchAsync(async (req, res, next) => {
    const userQuery = new APIFeatures(User.find({ ban: { $ne: true } }), req.query)
        .paginate()
        .filter()
        .search('firstName');
    const users = await userQuery.query;
    const totalItems = await User.find().merge(userQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: users,
        totalItems,
    });
});

exports.getAllUserBanned = catchAsync(async (req, res, next) => {
    const userQuery = new APIFeatures(User.find({ ban: true }), req.query).paginate().filter().search('firstName');
    const totalItems = await User.find().merge(userQuery.query).skip(0).limit(0).count();
    const users = await userQuery.query;

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: users,
        totalItems,
    });
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id).populate([
        {
            path: 'follows',
            select: 'firstName lastName photo',
        },
        ,
        {
            path: 'followers',
            select: 'firstName lastName photo',
        },
    ]);
    if (!user) {
        return next(new AppError('Người dùng không tồn tại', 400));
    }
    if (user.ban) {
        return next(new AppError('Tài khoản này đã bị khóa bởi quản trị viên', 401));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.getMe = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).populate([
        {
            path: 'follows',
            select: 'firstName lastName photo',
        },
        ,
        {
            path: 'followers',
            select: 'firstName lastName photo',
        },
        {
            path: 'notifications',
            select: 'sender content createdAt',
            populate: {
                path: 'sender',
                select: 'firstName lastName',
            },
        },
    ]);
    if (!user) {
        return next(new AppError('Người dùng không tồn tại', 400));
    }
    if (user.ban) {
        return next(new AppError('Tài khoản này đã bị khóa bởi quản trị viên', 401));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.followUser = catchAsync(async (req, res, next) => {
    const currentUser = await User.findById(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user || !currentUser) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 400));
    }

    if (currentUser.id === user.id) {
        return next(new AppError('Bạn không thể tự follow bản thân mình', 400));
    }
    if (currentUser.follows.includes(user.id)) {
        return next(new AppError('Bạn đã follow người dùng này rồi, để unfollow hãy sử dụng /unfollow', 400));
    }

    await currentUser.updateOne({ $push: { follows: user.id } });
    await user.updateOne({ $push: { followers: currentUser.id } });
    await Notification.create({
        sender: currentUser._id,
        receiver: user._id,
        content: `${currentUser.firstName} ${currentUser.lastName} vừa theo dõi bạn`,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Follow người dùng thành công',
        data: currentUser,
    });
});

exports.unFollowUser = catchAsync(async (req, res, next) => {
    const currentUser = await User.findById(req.user.id);
    const user = await User.findById(req.params.id);

    if (!user || !currentUser) {
        return next(new AppError('Người dùng này hiện không còn tồn tại', 400));
    }
    if (currentUser.id === user.id) {
        return next(new AppError('Bạn không thể tự unfollow bản thân mình', 400));
    }
    if (!currentUser.follows.includes(user.id)) {
        return next(
            new AppError(
                'Bạn chưa follow người dùng này trước đó, sử dụng /follow để bắt đầu theo dõi người dùng này',
                400,
            ),
        );
    }

    await currentUser.updateOne({ $pull: { follows: user.id } });
    await user.updateOne({ $pull: { followers: user.id } });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'unfollow người dùng thành công',
        data: currentUser,
    });
});

exports.changeMe = catchAsync(async (req, res, next) => {
    if (req.user.ban) {
        return next(new AppError('Bạn đã bị khóa bởi quản trị viên', 401));
    }
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi mật khẩu. Vui lòng dùng /updateMyPassword để thay thế',
                400,
            ),
        );
    }
    const { introduce, cvImage, skills, educate, certificate, experience, projects } = req.body;
    if (introduce || cvImage || skills || educate || certificate || experience || projects) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi các thông tin cụ thể của JobSeeker. Vui lòng sử dụng /jobseeker/changeMe để thay thế',
                400,
            ),
        );
    }
    const { companyName, description, establishDate, website } = req.body;
    if (companyName || description || establishDate || website) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi các thông tin cụ thể của Company. Vui lòng sử dụng /company/changeMe để thay thế',
                400,
            ),
        );
    }

    const { firstName, lastName, location, gender, phoneNumber } = req.body;
    let changeInfo = {
        firstName,
        lastName,
        location,
        gender,
        phoneNumber,
    };

    if (req?.file?.filename) {
        changeInfo.photo = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(req.user.id, changeInfo, {
        new: true,
        runValidators: true,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: user,
    });
});

exports.unbanUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { ban: false });
    if (!user) {
        return next(new AppError('Người dùng hiện không tồn tại hoặc đã bị chặn', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Gỡ chặn người dùng thành công',
    });
});
exports.banUser = catchAsync(async (req, res, next) => {
    const user = await User.findByIdAndUpdate(req.params.id, { ban: true });
    if (!user) {
        return next(new AppError('Người dùng hiện không tồn tại hoặc đã bị chặn', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Chặn người dùng thành công',
    });
});
