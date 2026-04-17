import mongoose from 'mongoose';
const { Schema } = mongoose;

const webhookRequestSchema = new Schema({
    endpointId: {
        type: Schema.Types.ObjectId,
        ref: 'Endpoint',
        required: true,
    },
    method: {
        type: String,
        required: true,
    },
    headers: {
        type: Map,
        of: String,
    },
    body: {
        type: String,
        default: null,
    },
    query: {
        type: Map,
        of: String,
    },
    sourceIp: {
        type: String,
        required: true,
    },
    receivedAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000, // 24 Hours after receiving
    },
});

webhookRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
webhookRequestSchema.index({ method: 1, receivedAt: -1 });

const WebhookRequest = mongoose.model('WebhookRequest', webhookRequestSchema);

export default WebhookRequest;
