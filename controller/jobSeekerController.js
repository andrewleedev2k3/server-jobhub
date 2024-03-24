const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');
const APIFeatures = require('../utils/apiFeatures');

const JobSeeker = require('../model/jobSeekerModel');

exports.getAllJobSeeker = catchAsync(async (req, res, next) => {
    const jobSeekerQuery = new APIFeatures(JobSeeker.find({ ban: { $ne: true } }), req.query)
        .paginate()
        .filter()
        .search('firstName');

    const jobSeekers = await jobSeekerQuery.query;
    const totalItems = await JobSeeker.find().merge(jobSeekerQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobSeekers,
        totalItems,
    });
});
exports.getJobSeeker = catchAsync(async (req, res, next) => {
    const jobSeeker = await JobSeeker.findById(req.params.id).populate([
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
            path: 'jobHistory',
            populate: [
                { path: 'company', select: 'companyName establishDate photo' },
                { path: 'job', select: 'title description photosJob' },
            ],
        },
    ]);
    if (!jobSeeker) {
        return next(new AppError('Người dùng không tồn tại', 400));
    }
    if (jobSeeker.ban) {
        return next(new AppError('Người dùng đã bị khóa bởi quản trị viên', 401));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobSeeker,
    });
});
exports.changeMe = catchAsync(async (req, res, next) => {
    if (req.user.ban) {
        return next(new AppError('Bạn đã bị khóa bởi quản trị viên', 401));
    }
    if (req.user.__t !== 'JobSeeker') {
        return next(new AppError('Chỉ có user thuộc dạng người tìm việc mới có thể thực hiện thao tác này', 400));
    }
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi mật khẩu. Vui lòng dùng /updateMyPassword để thay thế',
                400,
            ),
        );
    }

    const { firstName, lastName, location, gender, phoneNumber } = req.body;
    if (firstName || lastName || location || gender || phoneNumber) {
        return next(
            new AppError(
                'Đường dẫn này dùng để thay đổi các thông tin cụ thể của JobSeeker. Vui lòng sử dụng /user/changeMe để thay đổi các thông tin cơ bản của người dùng',
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
    const { introduce, cvImage, skills, educate, certificate, experiences, projects } = req.body;

    const changeInfo = {
        introduce,
        cvImage,
        skills,
        educate,
        certificate,
        experiences,
        projects,
    };

    if (req?.file?.filename) {
        changeInfo.cvImage = req.file.filename;
    }

    const jobSeeker = await JobSeeker.findByIdAndUpdate(req.user.id, changeInfo, {
        new: true,
        runValidators: true,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobSeeker,
    });
});
