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