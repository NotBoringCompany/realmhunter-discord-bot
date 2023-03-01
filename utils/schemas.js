const mongoose = require('mongoose');

const DiscordUserSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: mongoose.Types.ObjectId(),
        },
        _created_at: Date,
        _updated_at: Date,
        _wperm: Array,
        _rperm: Array,
        _acl: Object,
        userId: String,
        hunterTags: Number,
        realmPoints: Number,
        dailyTagsClaimed: Boolean,
    },
    {
        versionKey: false,
    },
);

const ContributionSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: mongoose.Types.ObjectId(),
        },
        _created_at: Date,
        _updated_at: Date,
        _wperm: Array,
        _rperm: Array,
        _acl: Object,
        userId: String,
        contributions: Array,
    },
    {
        versionKey: false,
    },
);

module.exports = {
    DiscordUserSchema,
    ContributionSchema,
};
