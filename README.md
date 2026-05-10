# Community Pantry

Community Pantry is a hackathon MVP for matching people with nearby food banks,
meal programs, community fridges, and eligibility-aware support.

Built for the IBM x UNSA Hackathon 2026 prize tracks:

- Best UN Hack: aligned with SDG 2 Zero Hunger, SDG 10 Reduced Inequalities, and
  SDG 11 Sustainable Cities.
- Best Startup Potential: designed for schools, municipalities, and nonprofits
  that need smarter intake and referral tools.
- Best Use of IBM Tech: ready for watsonx-powered natural language matching,
  eligibility explanation, and notification copy.

## MVP Features

- Plain-language need search.
- Sentence parsing that detects needs like halal, no ID, urgent, student,
  family, delivery, and baby supplies from the Situation box.
- Real distance calculation from a typed address, landmark, postal code, or
  browser GPS permission.
- OpenStreetMap-powered GTA map with ranked resource markers.
- Food support filters for urgent needs, dietary needs, no-ID access, students,
  families, baby supplies, and delivery.
- Ranked nearby resources with open-now status, requirements, supplies, and
  contact actions.
- Expanded GTA seed directory across Brampton, Mississauga, Toronto, York, and
  Durham.

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
https://simondana.github.io/community-pantry/
```
