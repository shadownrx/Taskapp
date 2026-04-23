const mongoose = require('mongoose');

const tpSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    status: { 
        type: String, 
        enum: ['Presentar', 'Entregar', 'Finalizado'], 
        default: 'Presentar' 
    },
    dueDate: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('TP', tpSchema);
