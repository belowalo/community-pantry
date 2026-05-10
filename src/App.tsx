import {
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  HeartHandshake,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { needOptions, Resource, resources } from "./data";

type UserLocation = {
  label: string;
  lat: number;
  lng: number;
};

const examples = [
  "I need food today and I do not have ID",
  "Student looking for halal groceries near Sheridan",
  "Family needs baby formula and delivery",
];

function distanceKm(from: UserLocation, to: Resource["geo"]) {
  const earthRadiusKm = 6371;
  const latDelta = ((to.lat - from.lat) * Math.PI) / 180;
  const lngDelta = ((to.lng - from.lng) * Math.PI) / 180;
  const fromLat = (from.lat * Math.PI) / 180;
  const toLat = (to.lat * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeLocation(searchText: string): Promise<UserLocation> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ca&q=${encodeURIComponent(
      searchText,
    )}`,
  );

  if (!response.ok) {
    throw new Error("Location lookup failed. Try a postal code or a more specific address.");
  }

  const results = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  if (!results.length) {
    throw new Error("No location found. Try adding the city or postal code.");
  }

  return {
    label: results[0].display_name.split(",").slice(0, 3).join(","),
    lat: Number(results[0].lat),
    lng: Number(results[0].lon),
  };
}

function scoreResource(
  resource: Resource,
  selectedNeeds: string[],
  query: string,
  calculatedDistanceKm: number,
) {
  const normalizedQuery = query.toLowerCase();
  const searchable = [
    resource.name,
    resource.type,
    resource.neighborhood,
    resource.address,
    ...resource.tags,
    ...resource.requirements,
    ...resource.supplies,
    ...resource.languages,
  ]
    .join(" ")
    .toLowerCase();

  const needScore = selectedNeeds.reduce(
    (score, need) => score + (resource.tags.includes(need) ? 16 : -4),
    0,
  );
  const queryScore = normalizedQuery
    .split(/\s+/)
    .filter((word) => word.length > 2)
    .reduce((score, word) => score + (searchable.includes(word) ? 5 : 0), 0);
  const openScore = resource.openNow ? 10 : 0;
  const distanceScore = Math.max(0, 18 - calculatedDistanceKm * 1.8);

  return Math.round(needScore + queryScore + openScore + distanceScore);
}

function matchExplanation(resource: Resource, selectedNeeds: string[]) {
  const matched = selectedNeeds
    .filter((need) => resource.tags.includes(need))
    .map((need) => needOptions.find((option) => option.id === need)?.label)
    .filter(Boolean);

  if (matched.length === 0) {
    return resource.openNow
      ? "Nearby and open now, with broad walk-in support."
      : "Nearby option with upcoming availability.";
  }

  return `Matches ${matched.slice(0, 3).join(", ")}${matched.length > 3 ? " and more" : ""}.`;
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(["urgent", "groceries", "no-id"]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("Sheridan Davis Campus, Brampton");
  const [userLocation, setUserLocation] = useState<UserLocation>({
    label: "Sheridan Davis Campus, Brampton",
    lat: 43.7302,
    lng: -79.7325,
  });
  const [locationStatus, setLocationStatus] = useState("Distances are calculated from this location.");
  const [isLocating, setIsLocating] = useState(false);

  const rankedResources = useMemo(() => {
    return resources
      .filter((resource) => (onlyOpen ? resource.openNow : true))
      .map((resource) => {
        const calculatedDistanceKm = distanceKm(userLocation, resource.geo);

        return {
          resource,
          calculatedDistanceKm,
          score: scoreResource(resource, selectedNeeds, query, calculatedDistanceKm),
        };
      })
      .sort((a, b) => b.score - a.score || a.calculatedDistanceKm - b.calculatedDistanceKm);
  }, [onlyOpen, query, selectedNeeds, userLocation]);

  const bestMatch = rankedResources[0]?.resource;

  function toggleNeed(id: string) {
    setSelectedNeeds((current) =>
      current.includes(id) ? current.filter((need) => need !== id) : [...current, id],
    );
  }

  async function handleLocationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!locationInput.trim()) {
      setLocationStatus("Enter an address, landmark, or postal code.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Finding that location...");

    try {
      const nextLocation = await geocodeLocation(locationInput);
      setUserLocation(nextLocation);
      setLocationStatus(`Using ${nextLocation.label}.`);
    } catch (error) {
      setLocationStatus(error instanceof Error ? error.message : "Could not find that location.");
    } finally {
      setIsLocating(false);
    }
  }

  function useBrowserLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Browser location is not available here. Type your location instead.");
      return;
    }

    setIsLocating(true);
    setLocationStatus("Waiting for browser location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          label: "your current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        setLocationStatus(
          `Using your current location with ${Math.round(position.coords.accuracy)}m accuracy.`,
        );
        setIsLocating(false);
      },
      () => {
        setLocationStatus("Location permission was blocked. Type an address or postal code instead.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Utensils size={22} aria-hidden="true" />
          </div>
          <div>
            <p>Community Pantry</p>
            <span>IBM x UNSA Hackathon 2026</span>
          </div>
        </div>

        <section className="panel">
          <div className="section-title">
            <Search size={18} aria-hidden="true" />
            <h1>Find food support that fits today.</h1>
          </div>
          <label className="input-label" htmlFor="need-search">
            Situation
          </label>
          <textarea
            id="need-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tell us what you need, where you are, and any requirements."
          />
          <div className="examples" aria-label="Example searches">
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setQuery(example)}>
                {example}
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="section-title compact">
            <MapPin size={18} aria-hidden="true" />
            <h2>Your location</h2>
          </div>
          <form className="location-form" onSubmit={handleLocationSearch}>
            <label className="input-label" htmlFor="location-search">
              Address or postal code
            </label>
            <input
              id="location-search"
              value={locationInput}
              onChange={(event) => setLocationInput(event.target.value)}
              placeholder="Example: L6Y 5H9 or Sheridan Davis Campus"
              type="search"
            />
            <div className="location-actions">
              <button disabled={isLocating} type="submit">
                <Search size={16} aria-hidden="true" />
                Set location
              </button>
              <button disabled={isLocating} onClick={useBrowserLocation} type="button">
                <LocateFixed size={16} aria-hidden="true" />
                Use GPS
              </button>
            </div>
          </form>
          <p className="location-status">{locationStatus}</p>
        </section>

        <section className="panel">
          <div className="section-title compact">
            <Filter size={18} aria-hidden="true" />
            <h2>Needs</h2>
          </div>
          <div className="need-grid">
            {needOptions.map((option) => (
              <button
                className={selectedNeeds.includes(option.id) ? "need active" : "need"}
                key={option.id}
                type="button"
                onClick={() => toggleNeed(option.id)}
              >
                {selectedNeeds.includes(option.id) && <CheckCircle2 size={14} aria-hidden="true" />}
                {option.label}
              </button>
            ))}
          </div>
          <label className="toggle">
            <input
              checked={onlyOpen}
              onChange={(event) => setOnlyOpen(event.target.checked)}
              type="checkbox"
            />
            <span>Show open-now options only</span>
          </label>
        </section>

        <section className="trust-strip" aria-label="Prize track alignment">
          <span>
            <Sparkles size={15} aria-hidden="true" />
            IBM watsonx-ready
          </span>
          <span>
            <HeartHandshake size={15} aria-hidden="true" />
            UN SDG 2
          </span>
          <span>
            <ShieldCheck size={15} aria-hidden="true" />
            Privacy-first
          </span>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">From {userLocation.label}</p>
            <h2>{rankedResources.length} matched support options</h2>
          </div>
          <button className="notify-button" type="button">
            <Bell size={18} aria-hidden="true" />
            Notify me
          </button>
        </header>

        <div className="content-grid">
          <section className="map-panel" aria-label="Resource map">
            <div className="map-header">
              <div>
                <p className="eyebrow">Live match area</p>
                <h3>{bestMatch ? bestMatch.name : "No matches yet"}</h3>
              </div>
              <Navigation size={20} aria-hidden="true" />
            </div>
            <div className="map-canvas">
              <div className="route-line" />
              {rankedResources.map(({ resource }, index) => (
                <button
                  aria-label={resource.name}
                  className={index === 0 ? "map-pin primary" : "map-pin"}
                  key={resource.id}
                  style={{
                    left: `${resource.coordinates.x}%`,
                    top: `${resource.coordinates.y}%`,
                  }}
                  type="button"
                >
                  <MapPin size={index === 0 ? 24 : 18} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div className="ai-note">
              <MessageCircle size={18} aria-hidden="true" />
              <p>
                watsonx can turn plain-language requests into eligibility filters, urgency
                signals, and next-step messages.
              </p>
            </div>
          </section>

          <section className="results" aria-label="Matched resources">
            {rankedResources.map(({ resource, score, calculatedDistanceKm }, index) => (
              <article className={index === 0 ? "resource-card featured" : "resource-card"} key={resource.id}>
                <div className="resource-topline">
                  <span className="type-pill">{resource.type}</span>
                  <span className={resource.openNow ? "status open" : "status"}>
                    <Clock3 size={14} aria-hidden="true" />
                    {resource.openNow ? "Open now" : "Closed"}
                  </span>
                </div>
                <div className="resource-heading">
                  <div>
                    <h3>{resource.name}</h3>
                    <p>
                      {resource.neighborhood} - {calculatedDistanceKm.toFixed(1)} km away
                    </p>
                  </div>
                  <strong>{Math.max(score, 0)}%</strong>
                </div>
                <p className="match-copy">{matchExplanation(resource, selectedNeeds)}</p>
                <div className="detail-row">
                  <MapPin size={16} aria-hidden="true" />
                  <span>{resource.address}</span>
                </div>
                <div className="detail-row">
                  <Clock3 size={16} aria-hidden="true" />
                  <span>{resource.nextWindow}</span>
                </div>
                <div className="tag-row">
                  {resource.supplies.slice(0, 4).map((supply) => (
                    <span key={supply}>{supply}</span>
                  ))}
                </div>
                <div className="requirements">
                  {resource.requirements.map((requirement) => (
                    <p key={requirement}>{requirement}</p>
                  ))}
                </div>
                <div className="card-actions">
                  <a href={`tel:${resource.phone.replace(/\D/g, "")}`}>Call</a>
                  <button type="button">Save</button>
                </div>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
