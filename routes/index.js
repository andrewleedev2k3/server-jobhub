const authRoute = require('./authRoute');
const companyRoute = require('./companyRoute');
const jobSeekerRoute = require('./jobSeekerRoute');
const categoryJobRoute = require('./categoryJobRoute');
const jobRoute = require('./jobRoute');
const userRoute = require('./userRoute');
const statisticRoute = require('./statisticRoute');
const utilsRoute = require('./utilsRoute');

const route = (app) => {
    app.use('/auth', authRoute);
    app.use('/company', companyRoute);
    app.use('/jobseeker', jobSeekerRoute);
    app.use('/categoryJob', categoryJobRoute);
    app.use('/job', jobRoute);
    app.use('/user', userRoute);
    app.use('/statistic', statisticRoute);
    app.use('/utils', utilsRoute);
};

module.exports = route;
