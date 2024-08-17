import { NextResponse } from "next/server";

export async function POST(req) {
    const { from, to, origin, destination } = await req.json();

    if (!from) return NextResponse.json({ error: "Missing field" }, { status: 400 });
    if (!to) return NextResponse.json({ error: "Missing field" }, { status: 400 });
    if (!origin) return NextResponse.json({ error: "Missing field" }, { status: 400 });
    if (!destination) return NextResponse.json({ error: "Missing field" }, { status: 400 });

    const flights = await checkFlights(origin, destination, from, to);
    const flight = flights.sort((a, b) => a.price.raw - b.price.raw)[0];

    return NextResponse.json({ flight }, { status: 200 });
}

function checkFlights(fromEntityId, toEntityId, departDate, returnDate) {
    return new Promise(async (resolve) => {
    
        const params = new URLSearchParams();
        params.set('fromEntityId', fromEntityId);
        params.set('toEntityId', toEntityId);
        params.set('departDate', departDate);
        params.set('returnDate', returnDate);
        params.set('currency', 'GBP');
        params.set('market', 'UK');
        params.set('stops', 'direct,1stop');

        console.log(params.toString());

        const request = await fetch('https://sky-scanner3.p.rapidapi.com/flights/search-roundtrip?' + params.toString(), {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY
            },
        });

        const data = (await request.json());
        console.log(data)
        const options = data.data.itineraries.filter((a) => new Date(Date.parse(a.legs[1].departure)).getHours() > 16)

        resolve(options);
    });
}
