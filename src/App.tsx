import {
  Bookmark,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  HeartHandshake,
  Info,
  List,
  LocateFixed,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { needOptions, Resource, resources, ServiceWindow } from "./data";

type UserLocation = {
  label: string;
  lat: number;
  lng: number;
  approximate?: boolean;
};

type RankedResource = {
  resource: Resource;
  calculatedDistanceKm: number;
  status: ReturnType<typeof serviceStatus>;
  score: number;
};

type RouteInfo = {
  resourceId: number;
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][];
};

type OverpassElement = {
  id: number;
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
  type: "node" | "way" | "relation";
};

type AppView = "match" | "all";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const examples = [
  "I need food today and I do not have ID",
  "Student looking for halal groceries near Sheridan",
  "Family needs baby formula and delivery",
];

type LocalGeocodeEntry = UserLocation & {
  cityKeywords: string[];
  postalPrefixes?: string[];
  preciseKeywords?: string[];
};

const localGeocodeEntries: LocalGeocodeEntry[] = [
  {
    label: "Laking Terrace, Milton, Halton Region",
    lat: 43.5229676,
    lng: -79.8441609,
    approximate: true,
    postalPrefixes: ["L9T"],
    preciseKeywords: ["laking terrace"],
    cityKeywords: ["milton"],
  },
  {
    label: "Sheridan Davis Campus, Brampton",
    lat: 43.7302,
    lng: -79.7325,
    approximate: true,
    postalPrefixes: ["L6Y"],
    preciseKeywords: ["sheridan davis"],
    cityKeywords: ["brampton"],
  },
  {
    label: "Burnaby, Metro Vancouver",
    lat: 49.2493824,
    lng: -122.9220659,
    approximate: true,
    postalPrefixes: ["V5A"],
    cityKeywords: ["burnaby", "vancouver"],
  },
  {
    label: "Calgary, Alberta",
    lat: 51.0097033,
    lng: -114.035993,
    approximate: true,
    postalPrefixes: ["T2H"],
    cityKeywords: ["calgary"],
  },
  {
    label: "Edmonton, Alberta",
    lat: 53.566535,
    lng: -113.5302222,
    approximate: true,
    postalPrefixes: ["T5G"],
    cityKeywords: ["edmonton"],
  },
  {
    label: "Saskatoon, Saskatchewan",
    lat: 52.1274399,
    lng: -106.6730143,
    approximate: true,
    postalPrefixes: ["S7M"],
    cityKeywords: ["saskatoon"],
  },
  {
    label: "Regina, Saskatchewan",
    lat: 50.4713771,
    lng: -104.5937209,
    approximate: true,
    postalPrefixes: ["S4R"],
    cityKeywords: ["regina"],
  },
  {
    label: "Winnipeg, Manitoba",
    lat: 49.9073135,
    lng: -97.1740053,
    approximate: true,
    postalPrefixes: ["R3E"],
    cityKeywords: ["winnipeg"],
  },
  {
    label: "Ottawa, Ontario",
    lat: 45.4060023,
    lng: -75.6171735,
    approximate: true,
    postalPrefixes: ["K1B"],
    cityKeywords: ["ottawa"],
  },
  {
    label: "Montreal, Quebec",
    lat: 45.4810814,
    lng: -73.6945069,
    approximate: true,
    postalPrefixes: ["H4T"],
    cityKeywords: ["montreal"],
  },
  {
    label: "Quebec City, Quebec",
    lat: 46.7865419,
    lng: -71.3141993,
    approximate: true,
    postalPrefixes: ["G1X"],
    cityKeywords: ["quebec city"],
  },
  {
    label: "Dartmouth, Nova Scotia",
    lat: 44.7037091,
    lng: -63.5997121,
    approximate: true,
    postalPrefixes: ["B3B"],
    cityKeywords: ["dartmouth", "halifax"],
  },
  {
    label: "Fredericton, New Brunswick",
    lat: 45.9356615,
    lng: -66.6094702,
    approximate: true,
    postalPrefixes: ["E3A"],
    cityKeywords: ["fredericton"],
  },
  {
    label: "Charlottetown, Prince Edward Island",
    lat: 46.2448535,
    lng: -63.1215351,
    approximate: true,
    postalPrefixes: ["C1A"],
    cityKeywords: ["charlottetown"],
  },
  {
    label: "St. John's, Newfoundland and Labrador",
    lat: 47.5594079,
    lng: -52.772657,
    approximate: true,
    postalPrefixes: ["A1B"],
    cityKeywords: ["st johns", "st john's"],
  },
  {
    label: "Whitehorse, Yukon",
    lat: 60.7223998,
    lng: -135.0610475,
    approximate: true,
    postalPrefixes: ["Y1A"],
    cityKeywords: ["whitehorse"],
  },
  {
    label: "Yellowknife, Northwest Territories",
    lat: 62.454954,
    lng: -114.3731066,
    approximate: true,
    postalPrefixes: ["X1A"],
    cityKeywords: ["yellowknife"],
  },
  {
    label: "Iqaluit, Nunavut",
    lat: 63.7479425,
    lng: -68.5171677,
    approximate: true,
    postalPrefixes: ["X0A"],
    cityKeywords: ["iqaluit"],
  },
  {
    label: "Kelowna, British Columbia",
    lat: 49.8835858,
    lng: -119.4346914,
    approximate: true,
    postalPrefixes: ["V1X"],
    cityKeywords: ["kelowna"],
  },
  {
    label: "London, Ontario",
    lat: 42.961589,
    lng: -81.2165712,
    approximate: true,
    postalPrefixes: ["N5Z"],
    cityKeywords: ["london"],
  },
  {
    label: "Kitchener, Waterloo Region",
    lat: 43.4243671,
    lng: -80.4781783,
    approximate: true,
    postalPrefixes: ["N2E"],
    cityKeywords: ["kitchener", "waterloo"],
  },
  {
    label: "Guelph, Ontario",
    lat: 43.5368528,
    lng: -80.2625138,
    approximate: true,
    postalPrefixes: ["N1H"],
    cityKeywords: ["guelph"],
  },
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

function normalizeResourceName(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\b(inc|the|food bank|foodbank|pantry|program|centre|center|location|site)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function localGeocodeLocation(searchText: string, allowCityMatch = false): UserLocation | null {
  const normalized = normalizeSearchText(searchText);
  const postalPrefix = searchText.toUpperCase().replace(/\s+/g, "").match(/^([A-Z]\d[A-Z])/)?.[1];

  const postalMatch = localGeocodeEntries.find((entry) => entry.postalPrefixes?.includes(postalPrefix ?? ""));

  if (postalMatch) {
    return postalMatch;
  }

  const preciseMatch = localGeocodeEntries.find((entry) =>
    entry.preciseKeywords?.some((keyword) => normalized.includes(normalizeSearchText(keyword))),
  );

  if (preciseMatch) {
    return preciseMatch;
  }

  if (!allowCityMatch) {
    return null;
  }

  return (
    localGeocodeEntries.find((entry) =>
      entry.cityKeywords.some((keyword) => normalized.includes(normalizeSearchText(keyword))),
    ) ?? null
  );
}

function resourceDedupKey(resource: Resource) {
  const name = normalizeResourceName(resource.name);
  const latBucket = Math.round(resource.geo.lat * 500);
  const lngBucket = Math.round(resource.geo.lng * 500);

  return `${name}|${latBucket}|${lngBucket}`;
}

function curateResourcePool(resourcePool: Resource[]) {
  const seenLocations = new Set<string>();
  const seenNames = new Set<string>();

  return resourcePool.filter((resource) => {
    const normalizedName = normalizeResourceName(resource.name);
    const key = resourceDedupKey(resource);
    const isGenericName = normalizedName.includes("food support in") || normalizedName.includes("hot meal in");

    if (!normalizedName || seenLocations.has(key) || (!isGenericName && seenNames.has(normalizedName))) {
      return false;
    }

    seenLocations.add(key);
    if (!isGenericName) {
      seenNames.add(normalizedName);
    }

    return true;
  });
}

function detectedNeedIds(query: string) {
  const normalizedQuery = query.toLowerCase().replace(/['\u2019]/g, "");

  return Object.entries(queryPatterns)
    .filter(([, patterns]) => patterns.some((pattern) => normalizedQuery.includes(pattern)))
    .map(([id]) => id);
}

function minutesFromTime(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatTime(time: string) {
  const [rawHours, minutes] = time.split(":").map(Number);
  const period = rawHours >= 12 ? "PM" : "AM";
  const hours = rawHours % 12 || 12;

  return `${hours}:${String(minutes).padStart(2, "0")} ${period}`;
}

function formatClock(date: Date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatPhoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

function directionsUrl(resource: Resource) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${resource.address}, ${resource.city}`,
  )}`;
}

function compactAddress(tags: Record<string, string>) {
  const streetAddress = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ");
  const parts = [streetAddress, tags["addr:city"] || tags["addr:town"] || tags["addr:suburb"]].filter(Boolean);

  return parts.join(", ");
}

function cleanPhone(tags: Record<string, string>) {
  return tags.phone || tags["contact:phone"] || tags["operator:phone"];
}

function cleanWebsite(tags: Record<string, string>) {
  const website = tags.website || tags["contact:website"] || tags.url;

  if (!website) {
    return undefined;
  }

  return website.startsWith("http") ? website : `https://${website}`;
}

function resourceTypeFromTags(tags: Record<string, string>): Resource["type"] {
  if (tags.amenity === "soup_kitchen" || tags.social_facility === "soup_kitchen") {
    return "Hot meal";
  }

  if (tags.amenity === "community_fridge" || tags.social_facility === "community_fridge") {
    return "Community fridge";
  }

  return "Food bank";
}

function tagsFromOsm(type: Resource["type"], tags: Record<string, string>) {
  const derived = new Set<string>();

  if (type === "Hot meal") {
    derived.add("hot-meal");
    derived.add("urgent");
  } else {
    derived.add("groceries");
  }

  const text = Object.values(tags).join(" ").toLowerCase();

  if (text.includes("halal")) derived.add("halal");
  if (text.includes("vegetarian") || text.includes("vegan")) derived.add("vegetarian");
  if (text.includes("deliver")) derived.add("delivery");
  if (text.includes("family") || text.includes("child")) derived.add("family");
  if (text.includes("newcomer") || text.includes("settlement")) derived.add("newcomer");
  if (text.includes("student") || text.includes("campus")) derived.add("student");
  if (text.includes("no id") || text.includes("drop")) derived.add("no-id");
  if (text.includes("salvation army")) derived.add("family");
  if (text.includes("food for life") || text.includes("community fridge")) derived.add("vegetarian");

  return Array.from(derived);
}

function mapOverpassElement(element: OverpassElement): Resource | null {
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  const tags = element.tags ?? {};

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const type = resourceTypeFromTags(tags);
  const derivedTags = tagsFromOsm(type, tags);
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:suburb"] || tags["is_in:city"] || "Canada";
  const address = compactAddress(tags) || city;
  const fallbackName = `${type === "Hot meal" ? "Hot meal" : "Food support"} in ${
    city
  }${address && address !== city ? ` near ${address.split(",")[0]}` : ""}`;
  const name = tags.name || tags.operator || fallbackName;
  const phone = cleanPhone(tags);
  const website = cleanWebsite(tags);
  const email = tags.email || tags["contact:email"];
  const hoursText = tags.opening_hours;
  const idOffset = element.type === "node" ? 1000000 : element.type === "way" ? 2000000 : 3000000;

  return {
    id: idOffset + element.id,
    name,
    type,
    neighborhood: tags["addr:suburb"] || city,
    city,
    address,
    contact: {
      phone,
      website,
      email,
      note: "Live OpenStreetMap listing. Details can be incomplete, so verify contact, eligibility, and hours before visiting.",
    },
    fallbackDistanceKm: 0,
    tags: derivedTags,
    requirements: [
      hoursText ? `Mapped hours: ${hoursText}` : "Hours may not be listed in open map data",
      "Verify current service details before visiting",
    ],
    languages: ["Confirm with provider"],
    supplies: type === "Hot meal" ? ["Hot meals", "Community food support"] : ["Groceries", "Food support"],
    hoursText,
    source: "openstreetmap",
    geo: { lat, lng },
  };
}

function boundingBoxForRadius(center: UserLocation, radiusMeters: number) {
  const latDelta = radiusMeters / 111320;
  const lngDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return [
    center.lat - latDelta,
    center.lng - lngDelta,
    center.lat + latDelta,
    center.lng + lngDelta,
  ]
    .map((value) => value.toFixed(5))
    .join(",");
}

async function fetchCanadianOpenStreetMapResources(center: UserLocation) {
  const searchRadii = [15000, 50000, 150000];

  for (const radius of searchRadii) {
    const boundingBox = boundingBoxForRadius(center, radius);
    const query = `
    [out:json][timeout:25];
    (
      node["amenity"~"food_bank|soup_kitchen|community_fridge"](${boundingBox});
      way["amenity"~"food_bank|soup_kitchen|community_fridge"](${boundingBox});
      relation["amenity"~"food_bank|soup_kitchen|community_fridge"](${boundingBox});
      node["social_facility"~"food_bank|soup_kitchen|food_distribution"](${boundingBox});
      way["social_facility"~"food_bank|soup_kitchen|food_distribution"](${boundingBox});
      relation["social_facility"~"food_bank|soup_kitchen|food_distribution"](${boundingBox});
      node["social_facility:for"~"homeless|underprivileged|newcomer"]["amenity"="social_facility"](${boundingBox});
      way["social_facility:for"~"homeless|underprivileged|newcomer"]["amenity"="social_facility"](${boundingBox});
      relation["social_facility:for"~"homeless|underprivileged|newcomer"]["amenity"="social_facility"](${boundingBox});
      node["name"~"[Ff]ood [Bb]ank|[Ff]ood [Pp]antry|[Cc]ommunity [Ff]ridge|[Ss]oup [Kk]itchen|[Ss]alvation [Aa]rmy|[Ff]ood [Ff]or [Ll]ife|[Nn]o [Oo]ne [Gg]oes [Hh]ungry"](${boundingBox});
      way["name"~"[Ff]ood [Bb]ank|[Ff]ood [Pp]antry|[Cc]ommunity [Ff]ridge|[Ss]oup [Kk]itchen|[Ss]alvation [Aa]rmy|[Ff]ood [Ff]or [Ll]ife|[Nn]o [Oo]ne [Gg]oes [Hh]ungry"](${boundingBox});
      relation["name"~"[Ff]ood [Bb]ank|[Ff]ood [Pp]antry|[Cc]ommunity [Ff]ridge|[Ss]oup [Kk]itchen|[Ss]alvation [Aa]rmy|[Ff]ood [Ff]or [Ll]ife|[Nn]o [Oo]ne [Gg]oes [Hh]ungry"](${boundingBox});
      node["operator"~"[Ff]ood [Bb]ank|[Ff]ood [Ff]or [Ll]ife|[Ss]alvation [Aa]rmy"](${boundingBox});
      way["operator"~"[Ff]ood [Bb]ank|[Ff]ood [Ff]or [Ll]ife|[Ss]alvation [Aa]rmy"](${boundingBox});
      relation["operator"~"[Ff]ood [Bb]ank|[Ff]ood [Ff]or [Ll]ife|[Ss]alvation [Aa]rmy"](${boundingBox});
    );
    out center tags;
  `;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("https://overpass-api.de/api/interpreter", {
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
        },
        method: "POST",
        signal: controller.signal,
      });

      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as { elements?: OverpassElement[] };
      const results = curateResourcePool(
        (payload.elements ?? [])
          .filter((element) => {
            const country = element.tags?.["addr:country"];

            return !country || country.toUpperCase() === "CA";
          })
          .map(mapOverpassElement)
          .filter((resource): resource is Resource => Boolean(resource)),
      );

      if (results.length >= 8 || radius === searchRadii[searchRadii.length - 1]) {
        return { radiusKm: radius / 1000, resources: results };
      }
    } catch {
      continue;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  throw new Error("Could not load live Canadian map data.");
}

function resourceWebsiteLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function fetchRoute(from: UserLocation, to: Resource): Promise<RouteInfo> {
  const response = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.geo.lng},${to.geo.lat}?overview=full&geometries=geojson`,
  );

  if (!response.ok) {
    throw new Error("Route service is unavailable right now.");
  }

  const payload = (await response.json()) as {
    routes?: Array<{
      distance: number;
      duration: number;
      geometry: {
        coordinates: [number, number][];
      };
    }>;
  };
  const route = payload.routes?.[0];

  if (!route) {
    throw new Error("No route found for this destination.");
  }

  return {
    resourceId: to.id,
    distanceKm: route.distance / 1000,
    durationMinutes: route.duration / 60,
    coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
  };
}

function dayLabel(day: number) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day];
}

function windowsForDay(serviceWindows: ServiceWindow[] | undefined, day: number) {
  return (serviceWindows ?? [])
    .filter((window) => window.days.includes(day))
    .sort((a, b) => minutesFromTime(a.start) - minutesFromTime(b.start));
}

function formatWindows(windows: ServiceWindow[]) {
  if (!windows.length) {
    return "No service window today";
  }

  return windows.map((window) => `${formatTime(window.start)}-${formatTime(window.end)}`).join(", ");
}

function serviceStatus(resource: Resource, now: Date) {
  if (!resource.serviceWindows?.length) {
    return {
      isOpen: false,
      label: resource.hoursText ? `Mapped hours: ${resource.hoursText}` : "Hours not listed",
      todayText: "Verify hours before visiting",
    };
  }

  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todaysWindows = windowsForDay(resource.serviceWindows, today);
  const openWindow = todaysWindows.find(
    (window) =>
      currentMinutes >= minutesFromTime(window.start) &&
      currentMinutes < minutesFromTime(window.end),
  );

  if (openWindow) {
    return {
      isOpen: true,
      label: `Open now until ${formatTime(openWindow.end)}`,
      todayText: `Today: ${formatWindows(todaysWindows)}`,
    };
  }

  const laterToday = todaysWindows.find((window) => currentMinutes < minutesFromTime(window.start));

  if (laterToday) {
    return {
      isOpen: false,
      label: `Opens today at ${formatTime(laterToday.start)}`,
      todayText: `Today: ${formatWindows(todaysWindows)}`,
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (today + offset) % 7;
    const nextWindows = windowsForDay(resource.serviceWindows, day);

    if (nextWindows.length) {
      return {
        isOpen: false,
        label: `Opens ${dayLabel(day)} at ${formatTime(nextWindows[0].start)}`,
        todayText: `Today: ${formatWindows(todaysWindows)}`,
      };
    }
  }

  return {
    isOpen: false,
    label: "Hours unavailable",
    todayText: "No published service windows",
  };
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
  const cleanedSearch = searchText.trim().replace(/\s+/g, " ");
  const localPreciseMatch = localGeocodeLocation(cleanedSearch);

  if (localPreciseMatch) {
    return localPreciseMatch;
  }

  const postalCodeMatch = cleanedSearch.toUpperCase().match(/^([A-Z]\d[A-Z])\s?(\d[A-Z]\d)$/);
  const normalizedPostalCode = postalCodeMatch ? `${postalCodeMatch[1]} ${postalCodeMatch[2]}` : null;
  const streetWithoutNumber = cleanedSearch.replace(/^\d+\s+/, "");
  const queries = Array.from(
    new Set([
      ...(normalizedPostalCode ? [normalizedPostalCode, `${normalizedPostalCode}, Canada`] : []),
      cleanedSearch,
      `${cleanedSearch}, Canada`,
      ...(streetWithoutNumber !== cleanedSearch
        ? [streetWithoutNumber, `${streetWithoutNumber}, Canada`]
        : []),
    ]),
  );

  type NominatimResult = {
    display_name: string;
    lat: string;
    lon: string;
    addresstype?: string;
    class?: string;
    type?: string;
  };

  for (const query of queries) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=3&countrycodes=ca&addressdetails=1&q=${encodeURIComponent(
          query,
        )}`,
        { signal: controller.signal },
      );

      if (!response.ok) {
        continue;
      }

      const results = (await response.json()) as NominatimResult[];
      const result = results.find((candidate) => {
        const lat = Number(candidate.lat);
        const lng = Number(candidate.lon);

        return Number.isFinite(lat) && Number.isFinite(lng);
      });

      if (result) {
        const approximate =
          result.addresstype === "road" || result.class === "highway" || result.type === "residential";

        return {
          label: result.display_name.split(",").slice(0, 4).join(","),
          lat: Number(result.lat),
          lng: Number(result.lon),
          approximate,
        };
      }
    } catch {
      continue;
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const localBroadMatch = localGeocodeLocation(cleanedSearch, true);

  if (localBroadMatch) {
    return localBroadMatch;
  }

  throw new Error("No Canadian match found. Try adding the city and province, for example: 516 Laking Terrace, Milton, ON.");
}

function scoreResource(
  resource: Resource,
  effectiveNeeds: string[],
  query: string,
  calculatedDistanceKm: number,
  isOpen: boolean,
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

  const matchedNeeds = effectiveNeeds.filter((need) => resource.tags.includes(need)).length;
  const needFitScore = effectiveNeeds.length ? (matchedNeeds / effectiveNeeds.length) * 35 : 25;
  const queryMatchScore = Math.min(
    5,
    normalizedQuery
    .split(/\s+/)
    .filter((word) => word.length > 2)
      .reduce((score, word) => score + (searchable.includes(word) ? 1.5 : 0), 0),
  );
  const openScore = isOpen ? 10 : 4;
  const distanceScore = Math.max(0, 50 * Math.exp(-calculatedDistanceKm / 10));

  return Math.min(100, Math.round(needFitScore + queryMatchScore + openScore + distanceScore));
}

function matchExplanation(resource: Resource, effectiveNeeds: string[]) {
  const matched = effectiveNeeds
    .filter((need) => resource.tags.includes(need))
    .map((need) => needOptions.find((option) => option.id === need)?.label)
    .filter(Boolean);

  if (matched.length === 0) {
    return "Nearby option with relevant food access support.";
  }

  return `Matches ${matched.slice(0, 3).join(", ")}${matched.length > 3 ? " and more" : ""}.`;
}

function isStandaloneDisplay() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.userAgent.includes("wv");
}

function isInstallCapableBrowser() {
  return window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

export default function App() {
  const [query, setQuery] = useState("");
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [locationInput, setLocationInput] = useState("Sheridan Davis Campus, Brampton");
  const [userLocation, setUserLocation] = useState<UserLocation>({
    label: "Sheridan Davis Campus, Brampton",
    lat: 43.7302,
    lng: -79.7325,
  });
  const [locationStatus, setLocationStatus] = useState("Distances are calculated from this location.");
  const [locationStatusTone, setLocationStatusTone] = useState<"neutral" | "error">("neutral");
  const [isLocating, setIsLocating] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [selectedResourceId, setSelectedResourceId] = useState<number | null>(null);
  const [routeResourceId, setRouteResourceId] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [routeStatus, setRouteStatus] = useState("Route shown for the top match.");
  const [liveResources, setLiveResources] = useState<Resource[]>([]);
  const [sourceStatus, setSourceStatus] = useState("Searching for nearby food support in Canada...");
  const [view, setView] = useState<AppView>("match");
  const [showDistanceInfo, setShowDistanceInfo] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [isInstalledApp, setIsInstalledApp] = useState(() => isStandaloneDisplay());
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [savedResourceIds, setSavedResourceIds] = useState<number[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem("community-pantry-app-saved") ?? "[]") as number[];
    } catch {
      return [];
    }
  });
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const detectedNeeds = useMemo(() => detectedNeedIds(query), [query]);
  const effectiveNeeds = useMemo(
    () => Array.from(new Set([...selectedNeeds, ...detectedNeeds])),
    [detectedNeeds, selectedNeeds],
  );
  const allResources = useMemo(() => {
    const liveKeys = new Set(
      liveResources.map(
        (resource) => `${resource.name.toLowerCase()}|${resource.geo.lat.toFixed(3)}|${resource.geo.lng.toFixed(3)}`,
      ),
    );
    const curatedWithoutDuplicates = resources.filter(
      (resource) => !liveKeys.has(`${resource.name.toLowerCase()}|${resource.geo.lat.toFixed(3)}|${resource.geo.lng.toFixed(3)}`),
    );

    return curateResourcePool([...liveResources, ...curatedWithoutDuplicates]);
  }, [liveResources]);
  const poolSize = Math.min(30, allResources.length);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setIsInstalledApp(true);
      setInstallPrompt(null);
    };
    const handleDisplayChange = () => setIsInstalledApp(isStandaloneDisplay());
    const displayQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    displayQuery.addEventListener("change", handleDisplayChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      displayQuery.removeEventListener("change", handleDisplayChange);
    };
  }, []);

  useEffect(() => {
    if (isInstalledApp) {
      window.localStorage.setItem("community-pantry-app-saved", JSON.stringify(savedResourceIds));
    }
  }, [isInstalledApp, savedResourceIds]);

  useEffect(() => {
    let cancelled = false;

    setSourceStatus(`Searching for nearby food support around ${userLocation.label}...`);
    setLiveResources([]);

    fetchCanadianOpenStreetMapResources(userLocation)
      .then(({ radiusKm, resources: nextResources }) => {
        if (cancelled) {
          return;
        }

        setLiveResources(nextResources);
        setSourceStatus(
          nextResources.length
            ? `Found ${nextResources.length} live map listings within ${radiusKm} km. Showing the closest 30 from live and verified Canada data.`
            : "No nearby live map listings returned, so verified Canada seed entries are shown.",
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setSourceStatus("Live map data is unavailable right now, so verified Canada seed entries are shown.");
      });

    return () => {
      cancelled = true;
    };
  }, [userLocation]);

  const rankedResources = useMemo(() => {
    return allResources
      .map((resource) => {
        const calculatedDistanceKm = distanceKm(userLocation, resource.geo);
        const status = serviceStatus(resource, now);

        return {
          resource,
          calculatedDistanceKm,
          status,
          score: scoreResource(
            resource,
            effectiveNeeds,
            query,
            calculatedDistanceKm,
            status.isOpen,
          ),
        };
      })
      .filter(({ status }) => (onlyOpen ? status.isOpen : true))
      .sort((a, b) => {
        const distanceDelta = a.calculatedDistanceKm - b.calculatedDistanceKm;

        if (Math.abs(distanceDelta) > 0.1) {
          return distanceDelta;
        }

        return b.score - a.score;
      })
      .slice(0, 30);
  }, [allResources, effectiveNeeds, now, onlyOpen, query, userLocation]);
  const topResources = rankedResources.slice(0, 5);
  const listedResources = view === "all" ? rankedResources : topResources;

  const bestMatch = rankedResources[0]?.resource;
  const activeRouteResource = useMemo(
    () =>
      allResources.find((resource) => resource.id === (routeResourceId ?? bestMatch?.id)) ??
      bestMatch,
    [allResources, bestMatch, routeResourceId],
  );
  const selectedMatch = useMemo(
    () =>
      rankedResources.find(({ resource }) => resource.id === selectedResourceId) ??
      (selectedResourceId
        ? allResources
            .map((resource) => {
              const calculatedDistanceKm = distanceKm(userLocation, resource.geo);
              const status = serviceStatus(resource, now);

              return {
                resource,
                calculatedDistanceKm,
                status,
                score: scoreResource(
                  resource,
                  effectiveNeeds,
                  query,
                  calculatedDistanceKm,
                  status.isOpen,
                ),
              };
            })
            .find(({ resource }) => resource.id === selectedResourceId)
        : undefined),
    [allResources, effectiveNeeds, now, query, rankedResources, selectedResourceId, userLocation],
  );

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
      routeLayerRef.current = null;
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

    listedResources.forEach(({ resource, calculatedDistanceKm }, index) => {
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
          )} km away<br>${serviceStatus(resource, now).label}`,
        )
        .on("click", () => setSelectedResourceId(resource.id))
        .addTo(markerLayerRef.current);
    });

    mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 11 });
  }, [listedResources, now, userLocation]);

  useEffect(() => {
    let cancelled = false;

    if (!activeRouteResource) {
      setRouteInfo(null);
      setRouteStatus("No destination selected.");
      return;
    }

    setRouteStatus(`Finding route to ${activeRouteResource.name}...`);

    fetchRoute(userLocation, activeRouteResource)
      .then((route) => {
        if (cancelled) {
          return;
        }

        setRouteInfo(route);
        setRouteStatus(
          `Route to ${activeRouteResource.name}: ${route.distanceKm.toFixed(1)} km, about ${Math.round(
            route.durationMinutes,
          )} min driving.`,
        );
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setRouteInfo(null);
        setRouteStatus(error instanceof Error ? error.message : "Could not load a route.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeRouteResource, userLocation]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }

    if (!routeInfo?.coordinates.length) {
      return;
    }

    routeLayerRef.current = L.polyline(routeInfo.coordinates, {
      color: "#d6503f",
      opacity: 0.9,
      weight: 5,
    }).addTo(mapRef.current);

    mapRef.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [38, 38], maxZoom: 13 });
  }, [routeInfo]);

  function toggleNeed(id: string) {
    setSelectedNeeds((current) =>
      current.includes(id) ? current.filter((need) => need !== id) : [...current, id],
    );
  }

  function openDetails(match: RankedResource) {
    setSelectedResourceId(match.resource.id);
  }

  function showRouteTo(resourceId: number) {
    setRouteResourceId(resourceId);
    setSelectedResourceId(null);
  }

  function toggleSavedResource(resourceId: number) {
    if (!isInstalledApp) {
      return;
    }

    setSavedResourceIds((current) =>
      current.includes(resourceId)
        ? current.filter((savedId) => savedId !== resourceId)
        : [...current, resourceId],
    );
  }

  async function promptInstallApp() {
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      setIsInstalledApp(true);
    }

    setInstallPrompt(null);
  }

  async function handleLocationSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!locationInput.trim()) {
      setLocationStatus("Enter an address, landmark, or postal code.");
      return;
    }

    setIsLocating(true);
    setLocationStatusTone("neutral");
    setLocationStatus("Finding that location...");

    try {
      const nextLocation = await geocodeLocation(locationInput);
      setUserLocation(nextLocation);
      setLocationStatus(
        nextLocation.approximate
          ? `Using approximate street match: ${nextLocation.label}.`
          : `Using ${nextLocation.label}.`,
      );
    } catch (error) {
      setLocationStatusTone("error");
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
    setLocationStatusTone("neutral");
    setLocationStatus("Waiting for browser location permission...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          label: "your current location",
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(nextLocation);
        setLocationStatusTone("neutral");
        setLocationStatus(
          `Using your current location with ${Math.round(position.coords.accuracy)}m accuracy.`,
        );
        setIsLocating(false);
      },
      () => {
        setLocationStatusTone("error");
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
          <div className="examples" aria-label="Example searches">
            {examples.map((example) => (
              <button key={example} type="button" onClick={() => setQuery(example)}>
                {example}
              </button>
            ))}
          </div>
          <div className="need-header">
            <h2>Needs</h2>
            <span>
              {detectedNeeds.length
                ? `${detectedNeeds.length} detected from your sentence`
                : "Type a sentence or choose manually"}
            </span>
          </div>
          <div className="need-grid">
            {needOptions.map((option) => {
              const isDetected = detectedNeeds.includes(option.id);
              const isSelected = selectedNeeds.includes(option.id);
              const isActive = isSelected || isDetected;

              return (
                <button
                  className={isActive ? "need active" : "need"}
                  key={option.id}
                  type="button"
                  onClick={() => toggleNeed(option.id)}
                >
                  {isActive && <CheckCircle2 size={14} aria-hidden="true" />}
                  {option.label}
                  {isDetected && <span>auto</span>}
                </button>
              );
            })}
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
          <p className={locationStatusTone === "error" ? "location-status error" : "location-status"}>
            {locationStatus}
          </p>
        </section>

        <section className="panel">
          <label className="toggle no-margin">
            <input
              checked={onlyOpen}
              onChange={(event) => setOnlyOpen(event.target.checked)}
              type="checkbox"
            />
            <span>Show open-now options only</span>
          </label>
        </section>

        <section className="panel app-panel">
          <div className="section-title compact">
            <Download size={18} aria-hidden="true" />
            <h2>{isInstalledApp ? "Application installed" : "Application install"}</h2>
          </div>
          <p>
            {isInstalledApp
              ? "Local saves are available on this device."
              : "Install Community Pantry to save resources locally on this computer."}
          </p>
          {!isInstalledApp && (
            <button className="sidebar-action" onClick={promptInstallApp} type="button">
              <Download size={16} aria-hidden="true" />
              Install app
            </button>
          )}
        </section>

        <section className="trust-strip" aria-label="Prize track alignment">
          <span>
            <Sparkles size={15} aria-hidden="true" />
            Sentence matching
          </span>
          <span>
            <HeartHandshake size={15} aria-hidden="true" />
            UN SDG 2
          </span>
          <span>
            <ShieldCheck size={15} aria-hidden="true" />
            Canada-wide search
          </span>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">From {userLocation.label}</p>
            <h2>{poolSize} closest choices, top 5 shown</h2>
            <p className="time-readout">Open status checked at {formatClock(now)}</p>
            <p className="time-readout">{sourceStatus}</p>
          </div>
          <div className="view-actions" aria-label="Result views">
            <button onClick={() => setShowDistanceInfo(true)} type="button">
              <Info size={16} aria-hidden="true" />
              How distance works
            </button>
            <button className={view === "match" ? "active" : ""} onClick={() => setView("match")} type="button">
              <Sparkles size={16} aria-hidden="true" />
              Top 5
            </button>
            <button className={view === "all" ? "active" : ""} onClick={() => setView("all")} type="button">
              <List size={16} aria-hidden="true" />
              View closest 30
            </button>
          </div>
        </header>

        <div className="content-grid">
          <section className="map-panel" aria-label="Resource map">
            <div className="map-header">
              <div>
                <p className="eyebrow">Nearby resource map</p>
                <h3>{bestMatch ? bestMatch.name : "No matches yet"}</h3>
              </div>
            </div>
            <div className="map-canvas" ref={mapElementRef} />
            <div className="route-summary">
              <MapPin size={16} aria-hidden="true" />
              <span>{routeStatus}</span>
            </div>
          </section>

          <section className="results" aria-label="Matched resources">
            <div className="results-header">
              <h3>{view === "all" ? "Closest 30 resources" : "Top 5 closest matches"}</h3>
              <span>{listedResources.length} shown from {poolSize}</span>
            </div>
            {!listedResources.length && (
              <article className="empty-state">
                <h3>No matching food support found</h3>
                <p>
                  Try turning off open-now filtering, searching a nearby city, or adding the province to your address.
                </p>
              </article>
            )}
            {listedResources.map((match, index) => {
              const { resource, score, calculatedDistanceKm, status } = match;
              const isSaved = savedResourceIds.includes(resource.id);

              return (
              <article
                className={index === 0 ? "resource-card featured" : "resource-card"}
                key={resource.id}
                onClick={() => openDetails(match)}
              >
                <div className="resource-topline">
                  <span className="type-pill">{resource.type}</span>
                  <span className={status.isOpen ? "status open" : "status"}>
                    <Clock3 size={14} aria-hidden="true" />
                    {status.isOpen ? "Open now" : "Closed"}
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
                  <span>{status.label}</span>
                </div>
                <div className="detail-row service-window">
                  <Clock3 size={16} aria-hidden="true" />
                  <span>{status.todayText}</span>
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
                  <button onClick={(event) => { event.stopPropagation(); openDetails(match); }} type="button">
                    <Info size={16} aria-hidden="true" />
                    Contact info
                  </button>
                  {isInstalledApp && (
                    <button
                      className={isSaved ? "saved" : ""}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleSavedResource(resource.id);
                      }}
                      type="button"
                    >
                      <Bookmark size={16} aria-hidden="true" />
                      {isSaved ? "Saved" : "Save"}
                    </button>
                  )}
                </div>
              </article>
              );
            })}
          </section>
        </div>
      </section>
      {selectedMatch && (
        <section
          aria-label={`${selectedMatch.resource.name} details`}
          className="details-backdrop"
          onClick={() => setSelectedResourceId(null)}
        >
          <article className="details-panel" onClick={(event) => event.stopPropagation()}>
            <div className="details-header">
              <div>
                <span className="type-pill">{selectedMatch.resource.type}</span>
                <h2>{selectedMatch.resource.name}</h2>
                <p>
                  {selectedMatch.resource.city} - {selectedMatch.calculatedDistanceKm.toFixed(1)} km away
                </p>
              </div>
              <button
                aria-label="Close details"
                className="icon-button"
                onClick={() => setSelectedResourceId(null)}
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>

            <div className="details-status">
              <span className={selectedMatch.status.isOpen ? "status open" : "status"}>
                <Clock3 size={14} aria-hidden="true" />
                {selectedMatch.status.label}
              </span>
              <p>{selectedMatch.status.todayText}</p>
            </div>

            <div className="details-section">
              <h3>Contact Info</h3>
              <p>{selectedMatch.resource.contact.note}</p>
              <div className="contact-actions">
                {selectedMatch.resource.contact.phone && (
                  <a href={formatPhoneHref(selectedMatch.resource.contact.phone)}>
                    Call {selectedMatch.resource.contact.phone}
                  </a>
                )}
                {selectedMatch.resource.contact.website && (
                  <a href={selectedMatch.resource.contact.website} rel="noreferrer" target="_blank">
                    <ExternalLink size={16} aria-hidden="true" />
                    {resourceWebsiteLabel(selectedMatch.resource.contact.website)}
                  </a>
                )}
                {selectedMatch.resource.contact.email && (
                  <a href={`mailto:${selectedMatch.resource.contact.email}`}>
                    {selectedMatch.resource.contact.email}
                  </a>
                )}
                <a href={directionsUrl(selectedMatch.resource)} rel="noreferrer" target="_blank">
                  <MapPin size={16} aria-hidden="true" />
                  Open in Google Maps
                </a>
              </div>
            </div>

            <div className="details-section">
              <h3>Service Details</h3>
              <div className="detail-row">
                <MapPin size={16} aria-hidden="true" />
                <span>{selectedMatch.resource.address}</span>
              </div>
              <div className="tag-row">
                {selectedMatch.resource.supplies.map((supply) => (
                  <span key={supply}>{supply}</span>
                ))}
              </div>
            </div>

            <div className="details-section">
              <h3>Before You Go</h3>
              <div className="requirements">
                {selectedMatch.resource.requirements.map((requirement) => (
                  <p key={requirement}>{requirement}</p>
                ))}
              </div>
            </div>

            <button
              className="wide-action secondary"
              onClick={() => showRouteTo(selectedMatch.resource.id)}
              type="button"
            >
              <MapPin size={16} aria-hidden="true" />
              Show route on map
            </button>
            {isInstalledApp && (
              <button
                className={savedResourceIds.includes(selectedMatch.resource.id) ? "wide-action saved" : "wide-action"}
                onClick={() => toggleSavedResource(selectedMatch.resource.id)}
                type="button"
              >
                <Bookmark size={16} aria-hidden="true" />
                {savedResourceIds.includes(selectedMatch.resource.id) ? "Saved locally" : "Save locally"}
              </button>
            )}
          </article>
        </section>
      )}
      {showDistanceInfo && (
        <section
          aria-label="How distance is calculated"
          className="details-backdrop compact-backdrop"
          onClick={() => setShowDistanceInfo(false)}
        >
          <article className="info-panel" onClick={(event) => event.stopPropagation()}>
            <div className="details-header">
              <div>
                <span className="type-pill">Distance</span>
                <h2>How distance works</h2>
              </div>
              <button
                aria-label="Close distance explanation"
                className="icon-button"
                onClick={() => setShowDistanceInfo(false)}
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="details-section">
              <p>
                The app starts from the address you type or the browser location you allow, then compares that point
                with each food support location on the map. It keeps the closest 30 nearby choices and shows the
                closest 5 first.
              </p>
              <p>
                The distance on each card is a straight-line estimate. The route line and Google Maps link can be
                longer because roads, highways, and transit paths are not perfectly straight.
              </p>
            </div>
          </article>
        </section>
      )}
      {showInstallHelp && (
        <section
          aria-label="Application install help"
          className="details-backdrop compact-backdrop"
          onClick={() => setShowInstallHelp(false)}
        >
          <article className="info-panel" onClick={(event) => event.stopPropagation()}>
            <div className="details-header">
              <div>
                <span className="type-pill">App</span>
                <h2>Install Community Pantry</h2>
              </div>
              <button
                aria-label="Close application install help"
                className="icon-button"
                onClick={() => setShowInstallHelp(false)}
                type="button"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <div className="details-section">
              <p>
                If your browser supports app installs, use the install icon in the address bar or choose Install app
                from the browser menu. Once installed, Community Pantry opens in its own app window and local saving is
                enabled on that device.
              </p>
              <p>
                {isInstallCapableBrowser()
                  ? "If the install prompt did not open, the browser may already have the app installed or may require using its menu."
                  : "App install requires the live HTTPS website or a local development server."}
              </p>
            </div>
          </article>
        </section>
      )}
    </main>
  );
}
