import mongoose from "mongoose";
const {Schema} = mongoose;

const webhookReplaySchema = new Schema({
    requestId: {
        type: Schema.Types.ObjectId,
        ref: 'WebhookRequest',
        required: true,
    },
    targetUrl: {
        type: String,
        required: true,
    },
    replayedAt: {
        type: Date,
        default: Date.now,
    },
    requestMethod: {
        type: String,
        required: true,
    },
    requestHeaders: {
        type: Map,
        of: String,
        required: true,
    },
    requestBody: {
        type: Schema.Types.Mixed,
        default: null,
    },
    responseStatus: {
        type: Number,
        required: true,
    },
    responseHeaders: {
        type: Map,
        of: String,
        required: true,
    },
    responseBody: {
        type: Schema.Types.Mixed,
        default: null,
    },
    success: {
        type: Boolean,
        required: true,
    },
    errorMessage: {
        type: String,
        default: null,
    },
});

webhookReplaySchema.index({ requestMethod: 1, replayedAt : -1});

const WebhookReplay = mongoose.model('WebhookReplay', webhookReplaySchema);
export default WebhookReplay;