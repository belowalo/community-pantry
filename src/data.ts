export type Resource = {
  id: number;
  name: string;
  type: "Food bank" | "Hot meal" | "Community fridge" | "Student support" | "Family support";
  distanceKm: number;
  neighborhood: string;
  address: string;
  openNow: boolean;
  nextWindow: string;
  phone: string;
  tags: string[];
  requirements: string[];
  languages: string[];
  supplies: string[];
  coordinates: {
    x: number;
    y: number;
  };
};

export const resources: Resource[] = [
  {
    id: 1,
    name: "Davis Campus Food Shelf",
    type: "Student support",
    distanceKm: 0.8,
    neighborhood: "Sheridan Davis",
    address: "7899 McLaughlin Rd, Brampton",
    openNow: true,
    nextWindow: "Open until 6:00 PM",
    phone: "(905) 555-0144",
    tags: ["student", "groceries", "no-id", "halal", "vegetarian"],
    requirements: ["Student card preferred", "No proof of income required"],
    languages: ["English", "Punjabi", "Urdu"],
    supplies: ["Pantry staples", "Rice", "Lentils", "Hygiene kits"],
    coordinates: { x: 61, y: 35 },
  },
  {
    id: 2,
    name: "Brampton Community Kitchen",
    type: "Hot meal",
    distanceKm: 2.4,
    neighborhood: "Downtown Brampton",
    address: "42 Queen St E, Brampton",
    openNow: true,
    nextWindow: "Dinner served 4:30 PM - 7:00 PM",
    phone: "(905) 555-0198",
    tags: ["hot-meal", "urgent", "no-id", "wheelchair", "vegetarian"],
    requirements: ["Walk-ins welcome", "No appointment needed"],
    languages: ["English", "Spanish", "Hindi"],
    supplies: ["Hot dinners", "Soup", "Takeaway meals"],
    coordinates: { x: 46, y: 53 },
  },
  {
    id: 3,
    name: "Peel Family Food Bank",
    type: "Food bank",
    distanceKm: 3.1,
    neighborhood: "Steeles",
    address: "210 Steeles Ave W, Brampton",
    openNow: false,
    nextWindow: "Opens tomorrow at 9:00 AM",
    phone: "(905) 555-0108",
    tags: ["groceries", "baby", "family", "delivery", "halal"],
    requirements: ["Postal code", "One visit every 14 days"],
    languages: ["English", "Punjabi", "Arabic"],
    supplies: ["Fresh produce", "Baby formula", "Canned goods", "Diapers"],
    coordinates: { x: 69, y: 64 },
  },
  {
    id: 4,
    name: "Harvest Share Fridge",
    type: "Community fridge",
    distanceKm: 1.6,
    neighborhood: "Ray Lawson",
    address: "18 Ray Lawson Blvd, Brampton",
    openNow: true,
    nextWindow: "Open 24 hours",
    phone: "(905) 555-0172",
    tags: ["urgent", "no-id", "groceries", "24-hour"],
    requirements: ["Take what you need", "No registration"],
    languages: ["English"],
    supplies: ["Bread", "Produce", "Prepared meals", "Snacks"],
    coordinates: { x: 56, y: 70 },
  },
  {
    id: 5,
    name: "Newcomer Welcome Pantry",
    type: "Family support",
    distanceKm: 4.7,
    neighborhood: "Gateway",
    address: "1200 Derry Rd E, Mississauga",
    openNow: false,
    nextWindow: "Opens Monday at 10:00 AM",
    phone: "(905) 555-0116",
    tags: ["newcomer", "family", "groceries", "delivery", "vegetarian"],
    requirements: ["Book by phone", "Newcomer services available"],
    languages: ["English", "French", "Arabic", "Urdu"],
    supplies: ["Settlement referrals", "Groceries", "Transit tokens"],
    coordinates: { x: 31, y: 74 },
  },
  {
    id: 6,
    name: "North Peel Halal Relief",
    type: "Food bank",
    distanceKm: 5.2,
    neighborhood: "Heart Lake",
    address: "72 Sandalwood Pkwy E, Brampton",
    openNow: true,
    nextWindow: "Open until 8:00 PM",
    phone: "(905) 555-0129",
    tags: ["halal", "groceries", "family", "no-id"],
    requirements: ["Call ahead for large families", "No income papers for first visit"],
    languages: ["English", "Urdu", "Arabic", "Somali"],
    supplies: ["Halal meat vouchers", "Rice", "Fresh produce", "Infant items"],
    coordinates: { x: 74, y: 24 },
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
];
