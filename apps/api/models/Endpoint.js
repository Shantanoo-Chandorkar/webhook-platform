import mongoose from "mongoose";
const {Schema} = mongoose;

const endpointSchema = new Schema({
    slug: {type: String, required: true, unique: true},
    defaultReplayUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000 // 24 hours after created date/
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
});

// TTL index: MongoDB auto-deletes documents when expiresAt is reached
// Note: { slug: 1 } unique index is auto-created by unique: true on the field definition
endpointSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const Endpoint = mongoose.model('Endpoint', endpointSchema);

export default Endpoint;