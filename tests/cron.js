const cron = require('node-cron');
const { nextTagDistributionTimestamp } = require('../utils/genesisTrials/randomTagAppearance');

// const test = () => {
//     cron.schedule('07 22 * * *', async () => {
//         console.log('run at london time zone');
//     }, {
//         timezone: 'Europe/London',
//     })
// }
// test();

// const check = () => {
//     console.log(new Date(process.env.JOIN_DATE_REQUIREMENT * 1000).toString());


//     // console.log(process.env.JOIN_DATE_REQUIREMENT)
//     // console.log(checkDate);
// }

// check();