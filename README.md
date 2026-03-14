# 🌿 OurTask

**Community action platform — physical improvement for shared spaces.**

OurTask is where anyone can post a real-world task — picking up trash, planting wildflowers, fixing a broken bench — and the platform helps find people to show up and do it.

**Not a forum. Not a petition. Physical action only.**

## The Core Loop

1. **See it** — Broken bench, littered trail, empty lot
2. **Post it** — Photo + location + what needs doing (30 seconds)
3. **Rally** — Nearby people see it on the map
4. **Do it** — Volunteers show up and get it done
5. **Show it** — Before/after photos on the Impact Wall

## Features

- 🗺️ **Map-first design** — Homepage is an interactive map with task pins
- 📍 **Geolocation** — Find tasks near you automatically
- 📷 **Photo uploads** — Before/after photos for every task
- 👥 **Volunteer system** — Claim spots, see who's going, leave messages
- ✨ **Impact Wall** — Gallery of completed tasks and transformations
- 🔐 **Secure** — JWT auth, CORS, rate limiting, token blacklist

## Categories

| Category | Icon | Description |
|----------|------|-------------|
| Clean | 🧹 | Litter, graffiti, debris, trail clearing |
| Green | 🌱 | Planting, gardens, wildflowers, trees |
| Fix | 🔧 | Broken benches, faded signs, infrastructure |
| Feed | 🍱 | Meal distribution, food banks, kitchens |
| Build | 🏗️ | Little Free Libraries, garden beds, murals |
| Serve | 👐 | Supporting vulnerable communities |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
git clone https://github.com/junoroe/ourtask.git
cd ourtask
npm install
```

```bash
# Create database
sudo -u postgres psql -c "CREATE DATABASE ourtask;"
sudo -u postgres psql -c "CREATE USER ourtask WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ourtask TO ourtask;"

# Run schema + seed data
PGPASSWORD='your_password' psql -h localhost -U ourtask -d ourtask -f schema.sql
PGPASSWORD='your_password' psql -h localhost -U ourtask -d ourtask -f seed.sql
```

```bash
# Configure
cp .env.example .env
# Edit .env with your database credentials + JWT secret

# Run
npm run dev    # Development
npm run build && npm start  # Production
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL
- **Maps:** Leaflet + react-leaflet
- **Auth:** JWT + bcrypt
- **Styling:** Tailwind CSS
- **Deployment:** Self-hosted (Node.js + Nginx)

## The Apolitical Charter

OurTask is for physical improvement of shared spaces. Full stop.

The test: *Would someone on both ends of the political spectrum agree this makes the place better?*

- ✅ Pick up trash on the highway
- ✅ Plant wildflowers in a median
- ✅ Distribute hot meals with the Salvation Army
- ❌ Political rallies or marches
- ❌ Advocacy campaigns

This isn't a limitation — it's the differentiator.

## License

[MIT](LICENSE)
