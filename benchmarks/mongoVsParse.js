require('dotenv').config();
const mongoose = require('mongoose');
const Moralis = require('moralis-v1/node');
const { parseJSON } = require('../utils/jsonParser');
const { generateObjectId } = require('../utils/cryptoUtils');

const mongooseCollectionFind = async () => {
    mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection;

    const start = performance.now();

    const checkCollection = await db.collection('Benchmarking').findOne();

    console.log(checkCollection['_acl']['*']);

    const end = performance.now();
    console.log(`Benchmark time MongoDB collection find: ${end-start} ms`);
};

const parseCollectionQuery = async () => {
    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });

    const start = performance.now();

    const User = new Moralis.Query('_User');
    const query = await User.first({ useMasterKey: true });

    // turn query readable
    const parsedQuery = parseJSON(query);

    const end = performance.now();
    console.log(`Benchmark time Parse collection query: ${end-start} ms`);
};

const mongooseAddDocument = async () => {
    mongoose.connect(process.env.MONGODB_URI);

    const start = performance.now();

    const userSchema = new mongoose.Schema(
        {
            _id: {
                type: String,
                default: mongoose.Types.ObjectId(),
            },
            _created_at: Date,
            _updated_at: Date,
            name: String,
            age: Number,
        },
        {
            versionKey: false,
        },
    );

    const User = mongoose.model('User', userSchema, 'Benchmarking');

    const User1 = new User({ _id: generateObjectId(), _created_at: Date.now(), _updated_at: Date.now(), name: 'John', age: 20 });

    User1.save((err, user) => {
        console.log(user.name + ' saved to collection.');
    });

    const end = performance.now();

    console.log(`Benchmark time MongoDB add document: ${end-start} ms`);
};

const parseAddRecord = async () => {
    await Moralis.start({
        serverUrl: process.env.MORALIS_SERVERURL,
        appId: process.env.MORALIS_APPID,
        masterKey: process.env.MORALIS_MASTERKEY,
    });

    const start = performance.now();

    const User = Moralis.Object.extend('Benchmarking');
    const user = new User();

    user.set('name', 'John');
    user.set('age', 20);

    await user.save(null, { useMasterKey: true });

    const end = performance.now();

    console.log(`Benchmark time Parse add record: ${end-start} ms`);
};

const benchmark = async () => {
    await mongooseCollectionFind();
    // await parseCollectionQuery();

    // await mongooseAddDocument();
    // await parseAddRecord();

    // PREV BENCHMARK:
    // Benchmark time MongoDB collection find: 449.2127000000328 ms
    // Benchmark time Parse collection query: 638.9442999996245 ms
    // Benchmark time MongoDB add document: 7.269100001081824 ms
    // Benchmark time Parse add record: 647.0845999997109 ms
};
