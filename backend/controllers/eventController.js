const Event = require('../models/Event');

// Get all active events
exports.getEvents = async (req, res) => {
    try {
        const { category } = req.query;

        let filter = { isActive: true };
        if (category && category !== 'All') {
            filter.category = category;
        }

        const events = await Event.find(filter)
            .sort({ isFeatured: -1, date: 1 }) // Featured first, then by date
            .lean();

        res.json({ success: true, events });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ success: false, message: 'Error fetching events' });
    }
};

// Create a new event (admin only in future)
exports.createEvent = async (req, res) => {
    try {
        const event = new Event(req.body);
        await event.save();
        res.status(201).json({ success: true, event });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ success: false, message: 'Error creating event' });
    }
};

// Get single event by ID
exports.getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).lean();
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        res.json({ success: true, event });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ success: false, message: 'Error fetching event' });
    }
};

// Seed initial events
exports.seedEvents = async (req, res) => {
    try {
        // Clear existing events for fresh seed
        await Event.deleteMany({});

        const initialEvents = [
            {
                title: 'Night Wave 2.0 - Rose Day Special',
                description: '✨ Only 3 Days Left! ✨\nKick off Valentine Week with a perfect evening at C-Dock Club 💖🥂\n\nCelebrate with your partner, enjoy special surprises & lock in the best vibes of the season 🎉\n\n🎟 Passes (Limited | May Increase Anytime):\n₹500 Male | ₹350 Female | ₹600 Couple\n\n🔥 450+ passes sold | Very few slots left!\n\nLet\'s make it unforgettable ✨',
                image: 'night_wave_event', // Local image reference
                isLocalImage: true,
                date: 'Feb 07, 2026',
                time: '4:00 PM onwards',
                location: 'C-Dock Club',
                attendees: 450,
                category: 'Party',
                isFeatured: true,
                passPrices: {
                    male: 500,
                    female: 350,
                    couple: 600
                },
                contactNumbers: ['9545393239', '8668952859'],
                organizer: 'EVOX Ventures',
                passesSold: 450
            },
            {
                title: 'URJA Matheran Trip',
                description: '🚂 Escape to the hills! Join us for an unforgettable trip to Matheran on the iconic toy train. Trek through scenic trails, enjoy breathtaking views, and make memories with your campus friends. Limited seats available!',
                image: 'urja_matheran_event', // Local image reference
                isLocalImage: true,
                date: 'Feb 08, 2026',
                time: 'Full Day',
                location: 'Matheran Hill Station',
                attendees: 50,
                category: 'Trip',
                isFeatured: true,
                googleFormUrl: 'https://forms.gle/mMhEsZQ6bGpPYBoA6',
                organizer: 'URJA Club'
            }
        ];

        await Event.insertMany(initialEvents);

        res.json({ success: true, message: 'Events seeded successfully', count: initialEvents.length });
    } catch (error) {
        console.error('Error seeding events:', error);
        res.status(500).json({ success: false, message: 'Error seeding events' });
    }
};
