const multer = require('multer');
const sharp = require('sharp');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// Use file streamAble to post file buffer to cloundinary
const streamifier = require('streamifier');
const cloudinary = require('../utils/cloudinary').v2;
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
});

const streamUploadCloudinary = (fileBuffer, destination) => {
    return new Promise((resolve, reject) => {
        const cld_upload_stream = cloudinary.uploader.upload_stream(
            {
                folder: destination,
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            },
        );
        streamifier.createReadStream(fileBuffer).pipe(cld_upload_stream);
    });
};

exports.uploadSinglePhoto = (nameInput) => {
    return upload.single(nameInput);
};
exports.uploadMultiplePhoto = (nameInput, count) => {
    return upload.array(nameInput, count);
};
exports.uploadMultipleFields = (fields) => {
    return upload.fields(fields);
};

exports.resizePhoto = (destination) => {
    return catchAsync(async (req, res, next) => {
        if (!req.file && !req.files) return next();
        // Single File Upload
        if (!req.files) {
            const fileBuffer = await sharp(req.file.buffer)
                // .resize(500, 500)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toBuffer();
            const responseUpload = await streamUploadCloudinary(fileBuffer, destination);
            req.file.filename = responseUpload.secure_url;
            return next();
        }

        // Multiple Files Upload

        // 1.Upload.array
        if (Array.isArray(req.files)) {
            const promises = req.files.map((element) => {
                return new Promise(async (resolve, reject) => {
                    try {
                        const fileBuffer = await sharp(element.buffer)
                            // .resize(500, 500)
                            .toFormat('jpeg')
                            .jpeg({ quality: 90 })
                            .toBuffer();
                        const responseUpload = await streamUploadCloudinary(fileBuffer, destination);
                        resolve(responseUpload.secure_url);
                    } catch (err) {
                        reject(err);
                    }
                });
            });
            if (!req?.files?.filename) {
                req.files.filename = {};
            }
            await Promise.all(promises)
                .then((values) => (req.files.filename = values))
                .catch((err) => {
                    return next(err);
                });
        }

        // 2. Upload.Fields
        else {
            const listPromise = Object.entries(req.files)
                .map(([key, value]) => {
                    const object = {
                        [key]: [],
                    };
                    const promises = value.map((element) => {
                        return new Promise(async (resolve, reject) => {
                            try {
                                const fileBuffer = await sharp(element.buffer)
                                    // .resize(500, 500)
                                    .toFormat('jpeg')
                                    .jpeg({ quality: 90 })
                                    .toBuffer();
                                const responseUpload = await streamUploadCloudinary(fileBuffer, destination);
                                object[key] = [...object[key], responseUpload.secure_url];
                                resolve(object);
                            } catch (err) {
                                reject(err);
                            }
                        });
                    });
                    return promises;
                })
                .flat();

            if (!req?.files?.filename) {
                req.files.filename = {};
            }
            await Promise.all(listPromise)
                .then((values) => {
                    const responseDataUpload = Object.assign({}, ...values);
                    req.files.filename = responseDataUpload;
                })
                .catch((err) => {
                    return next(err);
                });
        }

        next();
    });
};
