const cron = require('node-cron');
const { nextTagDistributionTimestamp } = require('../utils/genesisTrials/randomTagAppearance');
const mongoose = require('mongoose');
const { AllianceSchema } = require('../utils/schemas');

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

mongoose.connect(process.env.MONGODB_URI);

// const test = async () => {
//     try {
//         const names = ['asd123', 'asd', 'Hello World'];
//         // test delete document from collection
//         const Alliance = mongoose.model('AllianceData', AllianceSchema, 'RHDiscordAllianceData');

//         const query = await Alliance.findOne({ allianceName: 'asd' });
//         query.allianceName = undefined;

//         await query.save();

//         console.log('updated');

//         // await Alliance.deleteMany({ allianceName: { $in: names } });
//         // console.log('deleted');
//     } catch (err) {
//         throw err;
//     }
// };

const validate = () => {
    const valid = cron.validate('59 * * * *');
    console.log(valid);
}