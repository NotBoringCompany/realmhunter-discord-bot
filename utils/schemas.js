const mongoose = require('mongoose');

const BenchmarkSchema = new mongoose.Schema(
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
        name: String,
        age: Number,
    }, {
        versionKey: false,
    },
);

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
        timesDistributionTagsClaimed: Number,
        dailyContributionTagsClaimed: Boolean,
        contributionTagsEarned: Number,
        // pointer to alliance object via its object ID in RHDiscordAllianceData.
        _p_alliance: String,
        _p_nation: String,
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

const TagsSchema = new mongoose.Schema(
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
        uniqueId: Number,
        previousAppearance: Number,
        previousClaimedTimestamp: Number,
        nextAppearance: Number,
        availableToClaim: Boolean,
    },
    {
        versionKey: false,
    },
);

const AllianceSchema = new mongoose.Schema(
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
        allianceName: String,
        memberData: Array,
    },
    {
        versionKey: false,
    },
);

const AlliancePendingInviteSchema = new mongoose.Schema(
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
        inviterId: String,
        inviteeId: String,
        invitedTimestamp: Number,
        inviteExpiryTimestamp: Number,
        // pointer to alliance object via its object ID in RHDiscordAllianceData.
        _p_alliance: String,
    },
    {
        versionKey: false,
    },
);

const NationsSchema = new mongoose.Schema(
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
        nation: String,
        members: Array,
        tagsStolen: Number,
        tagsEarned: Number,
    },
    {
        versionKey: false,
    },
);

const NationLeadVoteSchema = new mongoose.Schema(
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
        voterId: String,
        _p_nation: String,
        nomineesVoted: Array,
    }, {
        versionKey: false,
    },
);

const QuestEntriesSchema = new mongoose.Schema(
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
        isWinner: Boolean,
        claimed: Boolean,
    },
    {
        versionKey: false,
    },
);

module.exports = {
    BenchmarkSchema,
    DiscordUserSchema,
    ContributionSchema,
    TagsSchema,
    AllianceSchema,
    AlliancePendingInviteSchema,
    NationsSchema,
    NationLeadVoteSchema,
    QuestEntriesSchema,
};
