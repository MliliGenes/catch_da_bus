# 🚌 Bus Ticket Auto-Booking Script

This Node.js script automatically books a bus ticket for a specific route at a specified time using the bus-med.1337.ma API.

## 📦 Prerequisites

- Node.js (v16 or later)
- `.env` file with your BUS_TOKEN cookie token

## 🔧 Installation

1. Clone the repository or copy the script into your project directory.

2. Install dependencies:
   ```bash
   npm install axios dotenv
   ```

3. Create a `.env` file in the same directory with the following content:
   ```ini
   BUS_TOKEN=your_le_token_here
   ```

## 🚀 Usage

Run the script with two arguments:

```bash
node bookTicket.mjs "<Route Name>" "<HH:MM>"
```

**Example:**
```bash
node bookTicket.mjs "Tetouan|Martil" "14:30"
```

## 🧠 How It Works

1. Loads your `le_token` from `.env` and sets it in the request headers.
2. Checks current departures every 0.5 seconds from the `/departure/current` API endpoint.
3. Matches your specified route and waits for the specified time (with 1-minute tolerance).
4. Books the ticket automatically as soon as the matching departure becomes available and unlocked.

## ⚙️ Configuration

These constants can be tweaked inside the script:

```js
const CHECK_INTERVAL = 500;   
const MAX_RETRIES = 100;       
const API_BASE = "https://bus-med.1337.ma/api";
```

## ✅ Features

- Auto-retries if booking fails or bus isn't yet available
- Graceful exit on Ctrl+C
- 1-minute tolerance window to catch exact timing
- Console logging to track progress live

## ❗ Important Notes

- Ensure your system clock is accurate (use NTP sync if necessary).
- The `le_token` must be valid and refreshed if expired.
- Booking logic assumes non-campus routes (`to_campus: false`). Modify if needed.

## 🧼 Example .env File

```ini
BUS_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Make sure there are no spaces or quotes around the token.

## 🛠️ Troubleshooting

- **"Please set the BUS_TOKEN"** → Check your `.env` file.
- **"Invalid time format"** → Use 24-hour format like `08:00` or `18:45`.
- **Booking fails** → Ensure the bus exists, is not locked, and the token is valid.

## 📄 License

MIT – Use at your own risk. Not affiliated with 1337 Bus System.
