exports.sendResponseToClient = (res, statusCode, data) => {
    res.status(statusCode).json({
        status: statusCode,
        data,
    });
};
