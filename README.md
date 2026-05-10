# Community Pantry

Community Pantry is a hackathon MVP for matching people with nearby food banks,
meal programs, community fridges, and eligibility-aware support.

Built for the IBM x UNSA Hackathon 2026 prize tracks:

- Best UN Hack: aligned with SDG 2 Zero Hunger, SDG 10 Reduced Inequalities, and
  SDG 11 Sustainable Cities.
- Best Startup Potential: designed for schools, municipalities, and nonprofits
  that need smarter intake and referral tools.
- Best Use of IBM Tech: the Situation box can use IBM Granite 3.3 through a
  local Ollama runtime to extract structured needs from plain-language requests,
  with the built-in parser as a reliable fallback.

## MVP Features

- Plain-language need search with optional IBM Granite need extraction.
- Combined Situation and Needs panel where sentence parsing checks matching
  needs like halal, no ID, urgent, student, family, delivery, and baby supplies.
- Real distance calculation from a typed address, landmark, postal code, or
  browser GPS permission.
- Current-time open/closed status calculated from each resource's service
  windows.
- Clickable resource details with contact info, directions, and requirements.
- OpenStreetMap-powered Canada map with ranked resource markers.
- Food support filters for urgent needs, dietary needs, no-ID access, students,
  families, baby supplies, and delivery.
- Ranked nearby resources with open-now status, requirements, supplies, and
  contact actions.
- Verified Canadian seed directory across Ontario, Quebec, Western Canada,
  Atlantic Canada, and the territories, merged with live map listings near the
  user's address.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## IBM Granite Demo

The app can use IBM Granite locally without IBM Cloud billing. Install Ollama,
then run:

```bash
ollama pull granite3.3:2b
```

With Ollama running on `http://127.0.0.1:11434`, the Situation box sends the
user's sentence to IBM Granite and merges the returned needs into ranking. If
Granite is not installed or not running, the app automatically falls back to the
built-in parser so the demo still works.

## Share Online

The app is configured for GitHub Pages. After changes are pushed to `main`, the
deployment workflow publishes the app at:

```text
https://belowalo.github.io/community-pantry/
```
