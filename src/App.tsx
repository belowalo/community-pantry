import {
  Bell,
  CheckCircle2,
  Clock3,
  Filter,
  HeartHandshake,
  LocateFixed,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
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

const queryPatterns: Record<string, string[]> = {
  groceries: ["grocery", "groceries", "food bank", "pantry", "staples", "canned"],
  "hot-meal": ["hot meal", "meal", "dinner", "lunch", "soup", "eat today"],
  urgent: ["today", "tonight", "now", "urgent", "emergency", "asap", "hungry"],
  "no-id": ["no id", "without id", "lost id", "dont have id", "do not have id", "no documents"],
  halal: ["halal", "muslim"],
  vegetarian: ["vegetarian", "vegan", "plant based", "no meat"],
  baby: ["baby", "infant", "formula", "diaper", "diapers"],
  delivery: ["delivery", "deliver", "homebound", "can't travel", "cannot travel"],
  student: ["student", "college", "campus", "sheridan", "university"],
  family: ["family", "kids", "children", "child", "parent"],
  newcomer: ["newcomer", "refugee", "immigrant", "settlement"],
};

function detectedNeedIds(query: string) {
  const normalizedQuery = query.toLowerCase().replace(/[’']/g, "");

  return Object.entries(queryPatterns)
    .filter(([, patterns]) => patterns.some((pattern) => normalizedQuery.includes(pattern)))
    .map(([id]) => id);
}

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
  effectiveNeeds: string[],
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

  const needScore = effectiveNeeds.reduce(
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

function matchExplanation(resource: Resource, effectiveNeeds: string[]) {
  const matched = effectiveNeeds
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
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);

  const detectedNeeds = useMemo(() => detectedNeedIds(query), [query]);
  const effectiveNeeds = useMemo(
    () => Array.from(new Set([...selectedNeeds, ...detectedNeeds])),
    [detectedNeeds, selectedNeeds],
  );

  const rankedResources = useMemo(() => {
    return resources
      .filter((resource) => (onlyOpen ? resource.openNow : true))
      .map((resource) => {
        const calculatedDistanceKm = distanceKm(userLocation, resource.geo);

        return {
          resource,
          calculatedDistanceKm,
          score: scoreResource(resource, effectiveNeeds, query, calculatedDistanceKm),
        };
      })
      .sort((a, b) => b.score - a.score || a.calculatedDistanceKm - b.calculatedDistanceKm);
  }, [effectiveNeeds, onlyOpen, query, userLocation]);

  const bestMatch = rankedResources[0]?.resource;

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    mapRef.current = L.map(mapElementRef.current, {
      center: [43.708, -79.47],
      zoom: 9,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current);

    markerLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !markerLayerRef.current) {
      return;
    }

    markerLayerRef.current.clearLayers();

    const bounds = L.latLngBounds([[userLocation.lat, userLocation.lng]]);
    L.marker([userLocation.lat, userLocation.lng], {
      icon: L.divIcon({
        className: "leaflet-user-marker",
        html: "<span></span>",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      }),
    })
      .bindPopup(`Starting point: ${userLocation.label}`)
      .addTo(markerLayerRef.current);

    rankedResources.forEach(({ resource, calculatedDistanceKm }, index) => {
      bounds.extend([resource.geo.lat, resource.geo.lng]);

      L.marker([resource.geo.lat, resource.geo.lng], {
        icon: L.divIcon({
          className: index === 0 ? "leaflet-resource-marker primary" : "leaflet-resource-marker",
          html: `<span>${index + 1}</span>`,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        }),
      })
        .bindPopup(
          `<strong>${resource.name}</strong><br>${resource.city}<br>${calculatedDistanceKm.toFixed(
            1,
          )} km away`,
        )
        .addTo(markerLayerRef.current);
    });

    mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [rankedResources, userLocation]);

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
            placeholder="Example: I need halal groceries today and I do not have ID."
          />
          <div className="detected-needs" aria-label="Detected needs from situation">
            <span>Detected</span>
            {detectedNeeds.length ? (
              detectedNeeds.map((need) => (
                <strong key={need}>
                  {needOptions.find((option) => option.id === need)?.label ?? need}
                </strong>
              ))
            ) : (
              <em>Type a sentence to auto-detect needs</em>
            )}
          </div>
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
                Use my location
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
                <p className="eyebrow">GTA resource map</p>
                <h3>{bestMatch ? bestMatch.name : "No matches yet"}</h3>
              </div>
            </div>
            <div className="map-canvas" ref={mapElementRef} />
            <div className="ai-note">
              <MessageCircle size={18} aria-hidden="true" />
              <p>
                The sentence box now detects needs and changes ranking. watsonx can replace this
                keyword parser with stronger natural-language eligibility extraction.
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
                <p className="match-copy">{matchExplanation(resource, effectiveNeeds)}</p>
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
