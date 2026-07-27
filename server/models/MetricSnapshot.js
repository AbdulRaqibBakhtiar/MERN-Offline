const mongoose = require('mongoose');
const metricSnapshotSchema = new mongoose.Schema(
{
    date: {
        type: Date,
        default: Date.now
    },
    totalItems: {
        type: Number,
        default: 0
    },
    totalInventoryValue: {
        type: Number,
        default: 0
    },
    lowStockCount: {
        type: Number,
        default: 0
    },
    outOfStockCount: {
        type: Number,
        default: 0
    }
},
{
    timestamps: true
});
module.exports = mongoose.model(
    'MetricSnapshot',
    metricSnapshotSchema
);