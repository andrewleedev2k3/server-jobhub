const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');

const CategoryJob = require('../model/categoryJobModel');
const Job = require('../model/jobModel');

exports.getAllCategoryJob = catchAsync(async (req, res, next) => {
    const categoryQuery = new APIFeatures(CategoryJob.find({}).populate('totalJobs'), req.query).paginate().filter();

    const categories = await categoryQuery.query;
    const totalItems = await CategoryJob.find().merge(categoryQuery.query).skip(0).limit(0).count();

    return sendResponseToClient(res, 200, {
        status: 'success',
        data: categories,
        totalItems,
    });
});

exports.createCategoryJob = catchAsync(async (req, res, next) => {
    const newCategoryJob = await CategoryJob.create({
        categoryName: req.body.categoryName,
    });
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Tạo danh mục công việc mới thành công',
        data: newCategoryJob,
    });
});

exports.deleteCategoryJob = catchAsync(async (req, res, next) => {
    const categoryJob = await CategoryJob.findByIdAndDelete(req.params.id);
    if (!categoryJob) {
        return next(new AppError('Danh mục ngành nghề không tồn tại', 400));
    }
    await Job.deleteMany({ type: req.params.id });
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Xóa danh mục thành công',
    });
});

exports.changeCategoryJob = catchAsync(async (req, res, next) => {
    const { categoryName, isHotCategory } = req.body;

    const categoryJob = await CategoryJob.findByIdAndUpdate(
        req.params.id,
        { categoryName, isHotCategory },
        {
            new: true,
            runValidators: true,
        },
    );
    if (!categoryJob) {
        return next(new AppError('Danh mục ngành nghề không tồn tại', 400));
    }
    return sendResponseToClient(res, 200, {
        status: 'success',
        msg: 'Thay đổi thông tin thành công',
        data: categoryJob,
    });
});
