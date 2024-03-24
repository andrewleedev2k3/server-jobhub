const dayjs = require('dayjs');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');
const APIFeatures = require('../utils/apiFeatures');
const { sendEmailToCandidate } = require('../utils/email');

const JobApplication = require('../model/jobApplicationModel');
const Job = require('../model/jobModel');
const Notification = require('../model/notificationModel');

exports.getAllApplicationOfMyCompany = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'Company')) {
        return next(new AppError('Chỉ có user thuộc dạng Công ty mới có thể thực hiện hành động này', 400));
    }

    const jobApplicationsQuery = new APIFeatures(
        JobApplication.find({ company: req.user._id }).populate([
            {
                path: 'candicate',
                select: 'firstName lastName gender photo introduce cvImage',
            },
        ]),
        req.query,
    )
        .paginate()
        .sort()
        .filter();
    const jobApplications = await jobApplicationsQuery.query;
    const totalItems = await JobApplication.find().merge(jobApplicationsQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobApplications,
        totalItems,
    });
});

exports.getAllApplicationOfJob = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'Company')) {
        return next(new AppError('Chỉ có user thuộc dạng Công ty mới có thể thực hiện hành động này', 400));
    }
    const job = await Job.find({ _id: req.params.id });
    if (!job) {
        return next(new AppError('Không tồn tại công việc này'));
    }

    const jobApplicationsQuery = new APIFeatures(
        JobApplication.find({ job: req.params.id }).populate([
            {
                path: 'candicate',
                select: 'firstName lastName gender photo introduce cvImage',
            },
        ]),
        req.query,
    )
        .paginate()
        .sort()
        .filter();
    const jobApplications = await jobApplicationsQuery.query;
    const totalItems = await JobApplication.find().merge(jobApplicationsQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobApplications,
        totalItems,
    });
});

exports.getAllMyJobApplicated = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'JobSeeker')) {
        return next(new AppError('Chỉ có user thuộc dạng người tìm việc mới có thể sử dụng hành động này', 400));
    }
    const jobsQuery = new APIFeatures(
        JobApplication.find({ candicate: req.user._id }).populate([
            {
                path: 'job',
                select: 'postedBy title description salary type available createdAt',
            },
            {
                path: 'company',
                select: 'companyName description photo coverPhoto location',
            },
        ]),
        req.query,
    )
        .paginate()
        .sort()
        .filter();
    const jobs = await jobsQuery.query;
    const totalItems = await JobApplication.find().merge(jobsQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: jobs,
        totalItems,
    });
});

exports.applyJob = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'JobSeeker')) {
        return next(new AppError('Chỉ có user thuộc dạng người tìm việc mới có thể apply vào công việc này', 400));
    }

    const job = await Job.findOne({ _id: req.params.id, isDelete: false });
    if (!job) {
        return next(new AppError('Công việc không còn tồn tại', 400));
    }
    if (job.available !== true) {
        return next(new AppError('Công việc này đã bị đóng tạm thời', 400));
    }

    const jobApplication = await JobApplication.findOne({
        company: job.postedBy,
        candicate: req.user._id,
        job: req.params.id,
    });
    if (jobApplication) {
        return next(new AppError('Bạn đã gửi đơn apply vào công việc này rồi', 400));
    }

    const payload = {
        company: job.postedBy,
        candicate: req.user._id,
        job: job._id,
    };
    const newJobApplication = await JobApplication.create(payload);
    await Notification.create({
        sender: req.user._id,
        receiver: job.postedBy,
        content: `${req.user.firstName} ${req.user.lastName} vừa nộp đơn ứng tuyển vào công việc mà bạn đăng tải`,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Đã gửi đơn ứng tuyển vào vị trí công việc này',
        data: newJobApplication,
    });
});

exports.acceptJobApplication = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'Company')) {
        return next(new AppError('Chỉ có user thuộc dạng Công ty mới có thể thực hiện hành động này', 400));
    }
    const { interviewDate } = req.body;

    const jobApplication = await JobApplication.findOne({ _id: req.params.id }).populate({
        path: 'candicate',
        select: 'email firstName lastName ',
    });
    if (!jobApplication) {
        return next(new AppError('Không tồn tại đơn ứng tuyển', 400));
    }

    if (jobApplication.company.toString() !== req.user.id) {
        return next(new AppError('Chỉ có công ty tạo ra job này mới có thể chỉnh sửa', 400));
    }

    const job = await Job.findOne({ _id: jobApplication.job, isDelete: false });
    if (!job) {
        return next(new AppError('Công việc không còn tồn tại', 400));
    }
    if (job.available !== true) {
        return next(new AppError('Công việc này đã bị đóng tạm thời', 400));
    }

    jobApplication.status = 'accepted';
    jobApplication.interviewDate = interviewDate;
    await jobApplication.save();

    await Notification.create({
        sender: jobApplication.company,
        receiver: jobApplication.candicate,
        content: `Đơn ứng tuyển của bạn đã được chấp thuận`,
    });

    await sendEmailToCandidate({
        subject: 'Đơn ứng tuyển của bạn đã được chấp thuận',
        to: jobApplication.candicate.email,
        candidateName: `${jobApplication.candicate.firstName} ${jobApplication.candicate.lastName}`,
        position: job.title,
        companyName: req.user.companyName,
        interviewDate: dayjs(interviewDate).format('HH:mm DD-MMM-YYYY'),
        location: `${req.user.location.address} ${req.user.location.district} ${req.user.location.city}`,
        deadlineConfirm: dayjs(interviewDate).add(7, 'day').format('HH:mm DD-MMM-YYYY'),
        companyPhoneNumber: req.user.phoneNumber,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Đã chấp thuận đơn ứng tuyển',
        data: jobApplication,
    });
});
exports.cancelJobApplication = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'Company')) {
        return next(new AppError('Chỉ có user thuộc dạng Công ty mới có thể thực hiện hành động này', 400));
    }

    const jobApplication = await JobApplication.findOne({ _id: req.params.id });
    if (!jobApplication) {
        return next(new AppError('Không tồn tại đơn ứng tuyển', 400));
    }

    if (jobApplication.company.toString() !== req.user.id) {
        return next(new AppError('Chỉ có công ty tạo ra job này mới có thể chỉnh sửa', 400));
    }

    const job = await Job.findOne({ _id: jobApplication.job, isDelete: false });
    if (!job) {
        return next(new AppError('Công việc không còn tồn tại', 400));
    }

    jobApplication.status = 'canceled';
    jobApplication.interviewDate = undefined;
    await jobApplication.save();
    await Notification.create({
        sender: jobApplication.company,
        receiver: jobApplication.candicate,
        content: `Đơn ứng tuyển của bạn đã bị từ chối`,
    });

    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Đã từ chối đơn ứng tuyển',
        data: jobApplication,
    });
});
exports.removeJobApplication = catchAsync(async (req, res, next) => {
    if (!(req.user.__t === 'JobSeeker')) {
        return next(new AppError('Chỉ có user thuộc dạng người tìm việc mới có thể thực hiện hành động này', 400));
    }

    const jobApplication = await JobApplication.findOne({ _id: req.params.id, candicate: req.user._id });
    if (!jobApplication) {
        return next(new AppError('Không tồn tại đơn ứng tuyển hoặc đơn ứng tuyển này không thuộc về bạn', 400));
    }
    if (jobApplication.status !== 'pending') {
        return next(new AppError('Đơn ứng tuyển này không ở trạng thái chờ duyệt để có thể hủy bỏ', 400));
    }

    await JobApplication.deleteOne({ _id: req.params.id, candicate: req.user._id });

    return sendResponseToClient(res, 204, {
        status: 'success',
        msg: 'Đã xóa đơn ứng tuyển',
    });
});
