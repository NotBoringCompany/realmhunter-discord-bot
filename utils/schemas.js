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
        user: String,
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
        doubleTagEligibility: Boolean,
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
        stakedTags: Array,
        tagsEarned: Number,
        pendingTagsEarned: Number,
        union: String,
        challengesCompleted: Array,
        challengesCompletedToday: Array,
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

const NBMonSchema = new mongoose.Schema(
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
        bought: Boolean,
        disowned: Boolean,
        nbmonId: Number,
        genus: String,
        customName: String,
        xp: Number,
        maxHp: Number,
        currentHp: Number,
        atk: Number,
        rarity: String,
        appearanceTimestamp: Number,
        capturedTimestamp: Number,
        capturedBy: String,
        lastFaintedTimestamp: Number,
    },
    {
        versionKey: false,
    },
);

const BossNBMonSchema = new mongoose.Schema(
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
        nbmonId: Number,
        appearanceTimestamp: Number,
        totalHp: Number,
        hpLeft: Number,
        damagedBy: Array,
        defeatedBy: String,
        defeatedTimestamp: Number,
        bossAppearanceMsgId: String,
        bossStatsMsgId: String,
    },
    {
        versionKey: false,
    },
);

const HunterGamesParticipantsSchema = new mongoose.Schema(
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
    }, {
        versionKey: false,
    },
);

const HunterGamesDataSchema = new mongoose.Schema(
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
        gameId: Number,
        participantsCount: Number,
        isComplete: Boolean,
    }, {
        versionKey: false,
    },
);

const TrialsShopSchema = new mongoose.Schema(
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
        itemName: String,
        stock: Number,
        tagCost: Number,
    }, {
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
    NBMonSchema,
    BossNBMonSchema,
    HunterGamesParticipantsSchema,
    HunterGamesDataSchema,
    TrialsShopSchema,
};
