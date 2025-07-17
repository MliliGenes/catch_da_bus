import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();
const TOKEN = process.env.BUS_TOKEN;

if (!TOKEN) {
    console.error("❌ Please set the BUS_TOKEN environment variable in your .env file.");
    process.exit(1);
}

// ✅ Base config
const API_BASE = "https://bus-med.1337.ma/api";
const CHECK_INTERVAL = 10;

// ✅ Headers using the token
const headers = {
    "Content-Type": "application/json",
    "cookie": `le_token=${TOKEN}`
};

// ✅ Parse CLI arguments
const [, , targetRoute, targetTime] = process.argv;

if (!targetRoute || !targetTime) {
    console.error("Usage: node bookTicket.mjs <routeName> <HH:MM>");
    console.error("Example: node bookTicket.mjs 'Casablanca-Rabat' '14:30'");
    process.exit(1);
}

// ✅ Validate time format
function validateTimeFormat(time) {
    const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
    return timeRegex.test(time);
}

// ✅ Convert time string to minutes for comparison
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// ✅ Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5); // HH:MM format
}

// ✅ Check if target time matches current time (within 1 minute tolerance)
function isTargetTime(targetTime) {
    const currentMinutes = timeToMinutes(getCurrentTime());
    const targetMinutes = timeToMinutes(targetTime);
    
    // Allow 1 minute tolerance
    return Math.abs(currentMinutes - targetMinutes) <= 1;
}

// ✅ Find matching departure
async function findMatchingDeparture() {
    try {
        const res = await axios.get(`${API_BASE}/departure/current`, { headers });
        const departures = res.data;

        const matchedDeparture = departures.find(d =>
            d.route?.name === targetRoute &&
            d.locked === false
        );

        return matchedDeparture;
    } catch (err) {
        console.error("❌ Error fetching departures:", err.response?.data || err.message);
        return null;
    }
}

// ✅ Book the ticket
async function bookTicket(departureId) {
    try {
        const payload = {
            departure_id: departureId,
            to_campus: false
        };

        const postRes = await axios.post(`${API_BASE}/tickets/book`, payload, { headers });
        console.log("✅ Booking successful:", postRes.data);
        return true;
    } catch (err) {
        console.error("❌ Booking failed:", err.response?.data || err.message);
        return false;
    }
}

// ✅ Main scheduler function
async function scheduler() {
    console.log(`🚌 Bus Booking Scheduler Started`);
    console.log(`📍 Route: ${targetRoute}`);
    console.log(`⏰ Target Time: ${targetTime}`);
    console.log(`🔍 Checking every ${CHECK_INTERVAL/1000} seconds...`);
    console.log(`⏳ Current Time: ${getCurrentTime()}`);
    console.log('─'.repeat(50));

    let retryCount = 0;
    let bookingAttempted = false;

    const checkInterval = setInterval(async () => {
        const currentTime = getCurrentTime();
        retryCount++;

        console.log(`[${currentTime}] Check #${retryCount} - Looking for ${targetRoute}...`);

        // Check if we've reached the target time
        if (isTargetTime(targetTime) && !bookingAttempted) {
            console.log(`🎯 Target time reached! Attempting to book...`);
            bookingAttempted = true;

            // Look for the bus
            const departure = await findMatchingDeparture();
            
            if (departure) {
                console.log(`✅ Found departure: ${departure.route.name} (ID: ${departure.id})`);
                
                const success = await bookTicket(departure.id);
                if (success) {
                    console.log(`🎉 Successfully booked ticket for ${targetRoute} at ${targetTime}!`);
                    clearInterval(checkInterval);
                    process.exit(0);
                } else {
                    console.log(`❌ Booking failed, will keep trying...`);
                    bookingAttempted = false; // Reset to try again
                }
            } else {
                console.log(`⚠️ Bus not available yet at target time, will keep checking...`);
                bookingAttempted = false; // Reset to try again
            }
        } else if (isTargetTime(targetTime)) {
            // We're at target time but already attempted booking
            const departure = await findMatchingDeparture();
            if (departure && !bookingAttempted) {
                console.log(`🔄 Retrying booking attempt...`);
                const success = await bookTicket(departure.id);
                if (success) {
                    console.log(`🎉 Successfully booked ticket for ${targetRoute} at ${targetTime}!`);
                    clearInterval(checkInterval);
                    process.exit(0);
                }
            }
        } else {
            // Not target time yet, just monitor
            const departure = await findMatchingDeparture();
            if (departure) {
                console.log(`ℹ️ Found ${targetRoute} but waiting for ${targetTime} (current: ${currentTime})`);
            } else {
                console.log(`⏳ ${targetRoute} not available yet, waiting...`);
            }
        }

    }, CHECK_INTERVAL);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Scheduler stopped by user');
        clearInterval(checkInterval);
        process.exit(0);
    });
}

// ✅ Validate input and start
if (!validateTimeFormat(targetTime)) {
    console.error("❌ Invalid time format. Please use HH:MM format (e.g., 14:30)");
    process.exit(1);
}

// Start the scheduler
scheduler().catch(err => {
    console.error("❌ Scheduler failed:", err);
    process.exit(1);
});