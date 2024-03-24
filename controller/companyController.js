const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');
const APIFeatures = require('../utils/apiFeatures');

const Job = require('../model/jobModel');
const Company = require('../model/companyModel');

exports.getAllCompany = catchAsync(async (req, res, next) => {
    const { p, d } = req.query;
    const companyQuery = new APIFeatures(Company.find({ ban: { $ne: true } }).populate('totalJobCreated'), req.query)
        .paginate()
        .filter()
        .search('companyName')
        .sort();
    let totalQuery = companyQuery.query;
    if (p) {
        totalQuery = totalQuery.find({ 'location.city': { $regex: p, $options: 'i' } });
    }
    if (d) {
        totalQuery = totalQuery.find({ 'location.district': { $regex: d, $options: 'i' } });
    }
    const companys = await totalQuery;
    const totalItems = await Company.find().merge(totalQuery).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: companys,
        totalItems,
    });
});
exports.getCompany = catchAsync(async (req, res, next) => {
    const company = await Company.findById(req.params.id).populate([
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
            path: 'jobList',
            select: 'title description photosJob salary type deadline available isDelete ',
            match: { isDelete: false },
            populate: [{ path: 'countApplication' }],
        },
        {
            path: 'totalJobCreated',
        },
    ]);
    if (!company) {
        return next(new AppError('This company is nolonger exist', 400));
    }
    if (company.ban) {
        return next(new AppError('Công ty đã bị khóa bởi quản trị viên', 401));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        data: company,
    });
});

exports.getAllMyJobCreated = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'Company')) {
        return next(new AppError('Chỉ có user thuộc dạng Công ty có thể sử dụng hành động này', 400));
    }
    if (req.user.ban) {
        return next(new AppError('Bạn đã bị khóa bởi quản trị viên', 401));
    }

    const jobsQuery = new APIFeatures(Job.find({ postedBy: req.user._id, isDelete: false }), req.query)
        .paginate()
        .sort();
    const jobs = await jobsQuery.query;
    const totalItems = await Job.find().merge(jobsQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobs,
        totalItems,
    });
});

exports.changeMe = catchAsync(async (req, res, next) => {
    if (req.user.ban) {
        return next(new AppError('Bạn đã bị khóa bởi quản trị viên', 401));
    }
    if (req.user.__t !== 'Company') {
        return next(new AppError('Chỉ có user thuộc dạng Công ty mới có thể thực hiện thao tác này', 400));
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
                'Đường dẫn này dùng để thay đổi các thông tin cụ thể của Company. Vui lòng sử dụng /user/changeMe để thay đổi các thông tin cơ bản của người dùng',
                400,
            ),
        );
    }
    const { introduce, cvImage, skills, educate, certificate, experiences, projects } = req.body;
    if (introduce || cvImage || skills || educate || certificate || experiences || projects) {
        return next(
            new AppError(
                'Đường dẫn này không dùng để thay đổi các thông tin cụ thể của JobSeeker. Vui lòng sử dụng /jobseeker/changeMe để thay thế',
                400,
            ),
        );
    }

    const { companyName, description, establishDate, website, companySize } = req.body;

    const changeInfo = {
        companyName,
        description,
        establishDate,
        website,
        companySize,
    };

    if (req?.file?.filename) {
        changeInfo.coverPhoto = req.file.filename;
    }

    const company = await Company.findByIdAndUpdate(req.user.id, changeInfo, {
        new: true,
        runValidators: true,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: company,
    });
});
