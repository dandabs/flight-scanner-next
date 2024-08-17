"use client";

import Image from "next/image";
import { useState } from "react";

import moment from 'moment';

export default function Home() {
  const [weeks, setWeeks] = useState(3);
  const [origin, setOrigin] = useState("DUB");
  const [destination, setDestination] = useState("AEY");

  const [results, setResults] = useState([]);

  console.log(results);

  async function doSearch() {
    console.log(`Performing search`)
    console.log(`Weeks: ${weeks}`)

    const wA = getFridaysAndMondays(weeks);
    console.log(wA);

    let localresults = [];

    for (const i in wA) {
      const w = wA[i];

      localresults = [{
        from: formatDate(w[0]),
        to: formatDate(w[1]),
        origin,
        destination,
        loading: true
      }, ...localresults];

      setResults(localresults);

      const data = await fetch(`/api/cheapest`, {
        method: "POST",
        body: JSON.stringify({
          from: formatDate(w[0]),
          to: formatDate(w[1]),
          origin,
          destination
        })
      });
      const jdata = await data.json();

      localresults = [{
        from: formatDate(w[0]),
        to: formatDate(w[1]),
        origin,
        destination,
        loading: false,
        data: jdata.flight
      }, ...localresults.filter(r => !(r.from == formatDate(w[0])))];

      setResults(localresults);
    };
  }

  return (
    <main className="flex min-h-screen flex-col p-8">
      <h1 className="text-2xl font-medium">Flight information</h1>
      <p className="mb-6">
        Cheapest: {
        results.filter((a) => a.loading == false && a.data).sort((a, b) => a.data.price.raw - b.data.price.raw)[0] &&
        moment(results.filter((a) => a.loading == false && a.data).sort((a, b) => a.data.price.raw - b.data.price.raw)[0].data.legs[0].departure)
        .format('DD/MM/YYYY')
        }
      </p>
      
      <div className="flex flex-row justify-center items-center gap-6">
        <p>Number of weeks:</p>
        <input type="number" placeholder="3" value={weeks + ""} onChange={(e) => setWeeks(parseInt(e.target.value))} className="border-2 p-1" />

        <p>Origin:</p>
        <input type="text" placeholder="DUB" value={origin} onChange={(e) => setOrigin(e.target.value)} className="border-2 p-1" />

        <p>Destination:</p>
        <input type="text" placeholder="AEY" value={destination} onChange={(e) => setDestination(e.target.value)} className="border-2 p-1" />

        <button className="border-2 py-1 px-2 hover:bg-gray-100" onClick={doSearch}>Search</button>
      </div>

      <div className="mt-6">
        <table className="w-full">
          <thead>
          <tr>
            <th className="text-start py-2">Week beginning</th>
            <th className="text-start py-2">Price</th>
            <th className="text-start py-2">Outbound</th>
            <th className="text-start py-2">Inbound</th>
          </tr>
          </thead>
          <tbody>
          { results.filter(r=>r.loading == true).sort((a, b) => a.from.localeCompare(b.from)).map(r => (
          <tr>
            <td className="py-2">{moment(r.from).format('DD/MM/YY')}</td>

            <td className="py-2">Loading...</td>

          </tr>
          ))}
          { results.filter(r=>r.loading == false && r.data).sort((a, b) => a.from.localeCompare(b.from)).map(r => (
          <tr className="text-sm">
            <td className="py-2">{moment(r.data.legs[0].departure).format('DD/MM/YY')}</td>

            <td className="py-2">{r.data.price.formatted}</td>

            <td className="py-2">
              {r.data.legs[0].segments.map(s=>(
                <>
                <p><strong>{s.origin.displayCode}-{s.destination.displayCode}</strong> on <strong>{s.marketingCarrier.name}</strong> ({s.marketingCarrier.alternateId}{s.flightNumber})</p>
                <p>{moment(s.departure).format('DD/MM/YY')} {moment(s.departure).format('HH:mm')} - {moment(s.arrival).format('HH:mm')}</p>
                </>
              ))}
            </td>

            <td className="py-2">
              {r.data.legs[1].segments.map(s=>(
                <>
                <p><strong>{s.origin.displayCode}-{s.destination.displayCode}</strong> on <strong>{s.marketingCarrier.name}</strong> ({s.marketingCarrier.alternateId}{s.flightNumber})</p>
                <p>{moment(s.departure).format('DD/MM/YY')} {moment(s.departure).format('HH:mm')} - {moment(s.arrival).format('HH:mm')}</p>
                </>
              ))}
            </td>
          </tr>
          ))}
          </tbody>
        </table>
      </div>
    </main>
  );
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
