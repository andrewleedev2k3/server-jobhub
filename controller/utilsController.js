const axios = require('axios');

const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { sendResponseToClient } = require('../utils/ultils');

const { skills } = require('../constants/index');
const { locations } = require('../constants/location');

exports.getSkills = catchAsync(async (req, res, next) => {
    const { name } = req.query;
    let result = [];
    if (name) {
        if (!skills[name]) {
            return next(new AppError('Ngành nghề này không tồn tại trong hệ thống', 400));
        }
        result = [...skills.common, ...skills[name]];
    } else {
        result = Object.values(skills).flat();
    }
    sendResponseToClient(res, 200, {
        status: 'success',
        data: result || [],
    });
});

exports.getLocation = catchAsync(async (req, res, next) => {
    sendResponseToClient(res, 200, {
        status: 'success',
        data: locations,
    });
});

exports.getDistrict = catchAsync(async (req, res, next) => {
    const { code } = req.query;

    sendResponseToClient(res, 200, {
        status: 'success',
        data: district.data,
    });
});

exports.getAllCity = catchAsync(async (req, res, next) => {
    const { code } = req.query;

    sendResponseToClient(res, 200, {
        status: 'success',
        data: locations,
    });
});

exports.getCity = catchAsync(async (req, res, next) => {
    const { code } = req.params;

    const city = locations.find((location) => +location.code === +code);

    sendResponseToClient(res, 200, {
        status: 'success',
        data: city,
    });
});
