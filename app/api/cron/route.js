import moment from "moment";
import { NextResponse } from "next/server";

import { sql } from "@vercel/postgres";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

export const maxDuration = 60;

export async function POST(req) {
    const { weeks, origin, destination } = await req.json();

    if (!weeks) return NextResponse.json({ error: "Missing field" }, { status: 400 });
    if (!origin) return NextResponse.json({ error: "Missing field" }, { status: 400 });
    if (!destination) return NextResponse.json({ error: "Missing field" }, { status: 400 });

    const { rows } = await sql`SELECT * from flight_tracker_cache where origin=${origin} and destination=${destination} ORDER BY id DESC`;

    let prev = 0;
    if (rows[0]) {
      prev = rows[0].price;
    }

    let results = [];

    const wA = getFridaysAndMondays(parseInt(weeks));

    for (const i in wA) {
      const w = wA[i];

      const data = await fetch(`${process.env.API_URL}/api/cheapest`, {
        method: "POST",
        body: JSON.stringify({
          from: formatDate(w[0]),
          to: formatDate(w[1]),
          origin,
          destination
        })
      });
      const jdata = await data.json();

      results = [{
        from: formatDate(w[0]),
        to: formatDate(w[1]),
        origin,
        destination,
        data: jdata.flight
      }, ...results];
    };

    const cheapest = results.filter((a) => a.data).sort((a, b) => a.data.price.raw - b.data.price.raw)[0];
    console.log(cheapest);

    client.messages.create({
        from: `FLUGREKANDA`,
        to: `+447858284939`,
        body: `${origin}-${destination}: cheapest flight £${cheapest.data.price.raw.toFixed(2)} on ${moment(cheapest.from).format('DD/MM/YY')}. ${prev > cheapest.data.price.raw ? "Down" : "Up"} from £${prev.toFixed(2)}.`
    });

    await sql`INSERT INTO flight_tracker_cache (origin,destination,time,price) VALUES (${origin},${destination},${new Date()},${cheapest.data.price.raw})`;

    return NextResponse.json({ "message": "Success" }, { status: 200 });
}

function getFridaysAndMondays(weeksAhead) {
    const result = [];
    const today = new Date();

    // Adjust the start date if today is Friday
    let startOfWeek;
    if (today.getDay() === 5) { // Check if today is Friday (5 is Friday)
        // Move to next Friday (7 days ahead)
        startOfWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else {
        startOfWeek = today;
    }

    for (let i = 0; i < weeksAhead; i++) {
        const currentWeekStart = new Date(startOfWeek.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        
        const daysUntilFriday = (5 - currentWeekStart.getDay() + 7) % 7; // Friday
        const daysUntilMonday = daysUntilFriday + 2; // Monday
        
        const monday = new Date(currentWeekStart.getTime() + daysUntilMonday * 24 * 60 * 60 * 1000);
        const friday = new Date(currentWeekStart.getTime() + daysUntilFriday * 24 * 60 * 60 * 1000);
        
        result.push([friday, monday]);
    }

    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
