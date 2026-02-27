const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String, required: true }, // URL or local path
    isLocalImage: { type: Boolean, default: false },
    date: { type: String, required: true },
    time: { type: String, required: true },
    location: { type: String, required: true },
    attendees: { type: Number, default: 0 },
    category: {
        type: String,
        enum: ['All', 'Tech', 'Gaming', 'Robotics', 'Sports', 'Social', 'Trip', 'Party'],
        default: 'Social'
    },
    prize: { type: String, default: null },
    googleFormUrl: { type: String, default: null },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // For party events with pricing
    passPrices: {
        male: { type: Number, default: null },
        female: { type: Number, default: null },
        couple: { type: Number, default: null }
    },

    // Contact numbers for booking
    contactNumbers: [{ type: String }],

    // Additional info
    organizer: { type: String, default: '' },
    passesAvailable: { type: Number, default: null },
    passesSold: { type: Number, default: 0 },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
eventSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Event', eventSchema);
