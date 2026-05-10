# Community Pantry

Community Pantry is a hackathon MVP for matching people with nearby food banks,
meal programs, community fridges, and eligibility-aware support.

Built for the IBM x UNSA Hackathon 2026 prize tracks:

- Best UN Hack: aligned with SDG 2 Zero Hunger, SDG 10 Reduced Inequalities, and
  SDG 11 Sustainable Cities.
- Best Startup Potential: designed for schools, municipalities, and nonprofits
  that need smarter intake and referral tools.
- Best Use of IBM Tech: the matching layer is structured so IBM Cloud or watsonx
  services can replace the local parsing and data-ingest pieces later.

## MVP Features

- Plain-language need search.
- Combined Situation and Needs panel where sentence parsing checks matching
  needs like halal, no ID, urgent, student, family, delivery, and baby supplies.
- Real distance calculation from a typed address, landmark, postal code, or
  browser GPS permission.
- Current-time open/closed status calculated from each resource's service
  windows.
- Clickable resource details with contact info, directions, requirements, and
  local saved resources.
- OpenStreetMap-powered Canada map with ranked resource markers.
- Food support filters for urgent needs, dietary needs, no-ID access, students,
  families, baby supplies, and delivery.
- Ranked nearby resources with open-now status, requirements, supplies, and
  contact actions.
- Verified Canadian seed directory across Ontario, Quebec, Western Canada,
  Atlantic Canada, and the territories, merged with live map listings near the
  user's address.
- Installable PWA support with local saves available inside the installed app.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Share Online

The app is configured for GitHub Pages. After changes are pushed to `main`, the
deployment workflow publishes the app at:

```text
https://belowalo.github.io/community-pantry/
```
