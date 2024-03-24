const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'q', 'p', 'd'];
        excludedFields.forEach((el) => delete queryObj[el]);

        // 1B) Advanced filtering
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt|all|in)\b/g, (match) => `$${match}`);
        // Handle array query string
        queryStr = queryStr.replace('"[', (match) => match.replace('"', ''));
        queryStr = queryStr.replace(']"', (match) => match.replace('"', ''));
        queryStr = queryStr.replace(/\\/g, '');

        if (this.query instanceof mongoose.Aggregate) {
            // Because arrgegate only match with exactly type of value, example '140000' won't match because it's string
            // => We have to handle to convert it to number type
            const query = Object.entries(JSON.parse(queryStr)).reduce((prev, [key, value]) => {
                let finalValue = value;
                if (typeof value === 'object') {
                    finalValue = Object.entries(value).reduce(
                        (prevItem, [keyItem, valueItem]) => ({
                            ...prevItem,
                            [keyItem]: +valueItem ? +valueItem : valueItem,
                        }),
                        {},
                    );
                }
                // If finalValue is number
                if (+finalValue) {
                    return { ...prev, [key]: +finalValue };
                }
                // If finalValue is string

                // Check if it's objectId or not
                if (ObjectId.isValid(finalValue)) {
                    return { ...prev, [key]: new ObjectId(finalValue) };
                }
                return { ...prev, [key]: finalValue };
            }, {});
            this.query = this.query.match(query);
        } else {
            this.query = this.query.find(JSON.parse(queryStr));
        }
        return this;
    }

    search(fieldName) {
        const q = this.queryString.q;
        if (q) {
            if (this.query instanceof mongoose.Aggregate) {
                this.query = this.query.match({ [fieldName]: { $regex: q, $options: 'i' } });
            } else {
                this.query = this.query.find({ [fieldName]: { $regex: q, $options: 'i' } });
            }
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }

        return this;
    }

    limit() {
        if (this.queryString.limit) {
            const limit = this.queryString.limit * 1 || 10;
            this.query = this.query.limit(limit);
        }

        return this;
    }
    limitFields() {
        if (this.query instanceof mongoose.Aggregate) {
            console.log('Aggregate is not available to limit fields');
            return this;
        }
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}
module.exports = APIFeatures;
