export type ServiceWindow = {
  days: number[];
  start: string;
  end: string;
};

export type Resource = {
  id: number;
  name: string;
  type: "Food bank" | "Hot meal" | "Community fridge" | "Student support" | "Family support";
  neighborhood: string;
  city: string;
  address: string;
  contact: {
    phone?: string;
    website?: string;
    email?: string;
    note: string;
  };
  fallbackDistanceKm: number;
  tags: string[];
  requirements: string[];
  languages: string[];
  supplies: string[];
  serviceWindows: ServiceWindow[];
  geo: {
    lat: number;
    lng: number;
  };
};

const weekday = [1, 2, 3, 4, 5];
const monWedFri = [1, 3, 5];
const tueThu = [2, 4];
const weekend = [6, 0];

export const resources: Resource[] = [
  {
    id: 1,
    name: "Davis Campus Food Shelf",
    type: "Student support",
    neighborhood: "Sheridan Davis",
    city: "Brampton",
    address: "7899 McLaughlin Rd, Brampton",
    contact: {
      website: "https://www.sheridancollege.ca/student-life/student-services",
      note: "Use Sheridan student services or campus support channels for current pantry access.",
    },
    fallbackDistanceKm: 0.8,
    tags: ["student", "groceries", "no-id", "halal", "vegetarian"],
    requirements: ["Student-focused support", "Confirm campus access before visiting"],
    languages: ["English", "Punjabi", "Urdu"],
    supplies: ["Pantry staples", "Rice", "Lentils", "Hygiene kits"],
    serviceWindows: [{ days: weekday, start: "10:00", end: "18:00" }],
    geo: { lat: 43.7302, lng: -79.7325 },
  },
  {
    id: 2,
    name: "Regeneration Outreach",
    type: "Hot meal",
    neighborhood: "Downtown Brampton",
    city: "Brampton",
    address: "156 Main St N, Brampton",
    contact: {
      phone: "905-796-5888",
      website: "https://regenbrampton.com/",
      note: "Call or check the program website before visiting; hours and intake can change.",
    },
    fallbackDistanceKm: 2.4,
    tags: ["hot-meal", "urgent", "no-id", "wheelchair", "vegetarian"],
    requirements: ["Walk-in services may be available", "Confirm service window before visiting"],
    languages: ["English"],
    supplies: ["Hot meals", "Drop-in support", "Community referrals"],
    serviceWindows: [
      { days: weekday, start: "08:30", end: "14:00" },
      { days: [6], start: "10:00", end: "13:00" },
    ],
    geo: { lat: 43.6918, lng: -79.7641 },
  },
  {
    id: 3,
    name: "Food Banks Mississauga",
    type: "Food bank",
    neighborhood: "East Mississauga",
    city: "Mississauga",
    address: "3121 Universal Dr, Mississauga",
    contact: {
      phone: "905-270-5589",
      website: "https://www.foodbanksmississauga.ca/",
      note: "Use their intake and locator tools to confirm the closest pickup option.",
    },
    fallbackDistanceKm: 4.7,
    tags: ["groceries", "family", "delivery", "vegetarian", "newcomer"],
    requirements: ["Use local intake process", "Confirm closest pickup location"],
    languages: ["English"],
    supplies: ["Groceries", "Fresh food referrals", "Family support"],
    serviceWindows: [{ days: weekday, start: "09:00", end: "17:00" }],
    geo: { lat: 43.6379, lng: -79.6416 },
  },
  {
    id: 4,
    name: "Eden Food for Change",
    type: "Food bank",
    neighborhood: "Meadowvale",
    city: "Mississauga",
    address: "3185 Unity Dr, Mississauga",
    contact: {
      phone: "905-785-3651",
      website: "https://edenffc.org/",
      note: "Registration and appointment rules may apply; confirm before visiting.",
    },
    fallbackDistanceKm: 7.8,
    tags: ["groceries", "family", "vegetarian", "newcomer"],
    requirements: ["Registration may be required", "Confirm eligibility before visiting"],
    languages: ["English"],
    supplies: ["Groceries", "Fresh produce", "Community referrals"],
    serviceWindows: [{ days: tueThu, start: "12:00", end: "19:00" }],
    geo: { lat: 43.5787, lng: -79.7575 },
  },
  {
    id: 5,
    name: "Daily Bread Food Bank",
    type: "Food bank",
    neighborhood: "Etobicoke",
    city: "Toronto",
    address: "191 New Toronto St, Toronto",
    contact: {
      phone: "416-203-0050",
      website: "https://www.dailybread.ca/",
      note: "Use Daily Bread's food bank locator for the best current member-agency match.",
    },
    fallbackDistanceKm: 18.1,
    tags: ["groceries", "family", "delivery", "vegetarian", "no-id"],
    requirements: ["Use locator or call ahead", "Bring ID if available, but ask about no-ID options"],
    languages: ["English"],
    supplies: ["Groceries", "Fresh produce", "Member agency referrals"],
    serviceWindows: [{ days: weekday, start: "08:30", end: "16:30" }],
    geo: { lat: 43.6005, lng: -79.5057 },
  },
  {
    id: 6,
    name: "Fort York Food Bank",
    type: "Food bank",
    neighborhood: "Trinity Bellwoods",
    city: "Toronto",
    address: "797 Dundas St W, Toronto",
    contact: {
      phone: "416-203-3011",
      website: "https://fyfb.com/",
      note: "Confirm drop-in and food bank hours before visiting.",
    },
    fallbackDistanceKm: 25.5,
    tags: ["groceries", "hot-meal", "urgent", "no-id", "vegetarian"],
    requirements: ["Walk-in support may be available", "Confirm hours before visiting"],
    languages: ["English"],
    supplies: ["Groceries", "Meals", "Clothing and referrals"],
    serviceWindows: [
      { days: monWedFri, start: "11:00", end: "15:00" },
      { days: [4], start: "16:00", end: "19:00" },
    ],
    geo: { lat: 43.6519, lng: -79.4093 },
  },
  {
    id: 7,
    name: "North York Harvest Food Bank",
    type: "Food bank",
    neighborhood: "Amesbury",
    city: "Toronto",
    address: "116 Industry St, Toronto",
    contact: {
      phone: "416-635-7771",
      website: "https://northyorkharvest.com/",
      note: "Use their network information to confirm the correct agency and catchment area.",
    },
    fallbackDistanceKm: 23.4,
    tags: ["groceries", "family", "newcomer", "vegetarian"],
    requirements: ["Use agency referral or call ahead", "Service area may apply"],
    languages: ["English"],
    supplies: ["Groceries", "Fresh food", "Community referrals"],
    serviceWindows: [{ days: weekday, start: "09:30", end: "16:00" }],
    geo: { lat: 43.7009, lng: -79.4899 },
  },
  {
    id: 8,
    name: "Feed Scarborough",
    type: "Food bank",
    neighborhood: "Scarborough",
    city: "Toronto",
    address: "Scarborough, Toronto",
    contact: {
      website: "https://www.feedscarborough.ca/",
      note: "Feed Scarborough operates multiple programs; check the site for the exact location.",
    },
    fallbackDistanceKm: 42.2,
    tags: ["groceries", "family", "halal", "vegetarian", "newcomer"],
    requirements: ["Confirm nearest program location", "Service times vary by site"],
    languages: ["English"],
    supplies: ["Groceries", "Culturally appropriate food", "Prepared meals"],
    serviceWindows: [
      { days: weekday, start: "10:00", end: "17:00" },
      { days: weekend, start: "11:00", end: "14:00" },
    ],
    geo: { lat: 43.7764, lng: -79.2318 },
  },
  {
    id: 9,
    name: "Richmond Hill Community Food Bank",
    type: "Food bank",
    neighborhood: "Richmond Hill",
    city: "Richmond Hill",
    address: "55 Newkirk Rd, Richmond Hill",
    contact: {
      phone: "905-508-4761",
      website: "https://richmondhillcommunityfoodbank.ca/",
      note: "Confirm registration and pickup details before visiting.",
    },
    fallbackDistanceKm: 36.9,
    tags: ["groceries", "family", "newcomer", "vegetarian"],
    requirements: ["Registration may be required", "Confirm catchment area"],
    languages: ["English"],
    supplies: ["Groceries", "Fresh produce", "Household staples"],
    serviceWindows: [{ days: tueThu, start: "10:00", end: "15:00" }],
    geo: { lat: 43.8752, lng: -79.4232 },
  },
  {
    id: 10,
    name: "Vaughan Food Bank",
    type: "Food bank",
    neighborhood: "Concord",
    city: "Vaughan",
    address: "71 Marycroft Ave, Vaughan",
    contact: {
      phone: "905-851-2333",
      website: "https://vaughanfoodbank.ca/",
      note: "Call ahead for current pickup process and service area details.",
    },
    fallbackDistanceKm: 29.6,
    tags: ["groceries", "family", "vegetarian"],
    requirements: ["Call ahead for current pickup process", "Service area may apply"],
    languages: ["English"],
    supplies: ["Groceries", "Family hampers", "Community referrals"],
    serviceWindows: [{ days: monWedFri, start: "09:00", end: "13:00" }],
    geo: { lat: 43.7856, lng: -79.5617 },
  },
  {
    id: 11,
    name: "The Stop Community Food Centre",
    type: "Hot meal",
    neighborhood: "Davenport",
    city: "Toronto",
    address: "1884 Davenport Rd, Toronto",
    contact: {
      phone: "416-652-7867",
      website: "https://www.thestop.org/",
      note: "Check current drop-in, meal, and food access program schedules.",
    },
    fallbackDistanceKm: 27.5,
    tags: ["hot-meal", "urgent", "no-id", "vegetarian"],
    requirements: ["Drop-in programs may be available", "Confirm schedule before visiting"],
    languages: ["English"],
    supplies: ["Meals", "Community kitchen", "Food access referrals"],
    serviceWindows: [
      { days: weekday, start: "09:00", end: "15:00" },
      { days: [2, 4], start: "16:00", end: "18:30" },
    ],
    geo: { lat: 43.6716, lng: -79.4521 },
  },
  {
    id: 12,
    name: "Feed the Need in Durham",
    type: "Food bank",
    neighborhood: "Oshawa",
    city: "Durham Region",
    address: "371 Marwood Dr, Oshawa",
    contact: {
      phone: "905-571-3863",
      website: "https://feedtheneedindurham.ca/",
      note: "Use partner agency information to confirm the nearest Durham pickup site.",
    },
    fallbackDistanceKm: 71.2,
    tags: ["groceries", "family", "delivery", "vegetarian"],
    requirements: ["Use partner agency intake", "Confirm nearest Durham pickup site"],
    languages: ["English"],
    supplies: ["Groceries", "Regional partner referrals", "Family hampers"],
    serviceWindows: [{ days: weekday, start: "08:00", end: "16:00" }],
    geo: { lat: 43.8792, lng: -78.8795 },
  },
];

export const needOptions = [
  { id: "groceries", label: "Groceries" },
  { id: "hot-meal", label: "Hot meal" },
  { id: "urgent", label: "Need today" },
  { id: "no-id", label: "No ID" },
  { id: "halal", label: "Halal" },
  { id: "vegetarian", label: "Vegetarian" },
  { id: "baby", label: "Baby supplies" },
  { id: "delivery", label: "Delivery" },
  { id: "student", label: "Student" },
  { id: "family", label: "Family" },
  { id: "newcomer", label: "Newcomer" },
];
