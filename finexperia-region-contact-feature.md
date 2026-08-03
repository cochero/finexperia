# FinExperia — Region-Based Contact Number Feature
### Design Document (v1)

---

## 1. Purpose

Show visitors to **finexperia.com** the correct phone number and WhatsApp contact based on which Indian state they appear to be visiting from, instead of the single fixed number currently shown.

**Regions in scope:**
- Kerala
- Tamil Nadu
- Karnataka
- Andhra Pradesh
- Other (catch-all for everywhere else, including outside India)

---

## 2. Current State (as of this document)

- finexperia.com is a **static site** — plain HTML, CSS, and one `script.js` file, served directly by nginx. There is no backend server or database involved.
- The contact section currently shows **one** hardcoded phone number and **one** WhatsApp click-to-chat link, regardless of visitor location.
- The booking form is handled by a third-party service (Web3Forms) — not by our own server.

**Why this matters:** because there's no backend, all the logic for this feature has to run *in the visitor's browser*, using JavaScript, after the page has already loaded. See Section 4 for what that means in practice.

---

## 3. Why Not Django

This was evaluated and intentionally ruled out for this feature. Summary:

| Reason | Explanation |
|---|---|
| No server-side logic needed elsewhere on the site | The rest of finexperia.com is static; adding Django here means running and maintaining a whole new server process just for a phone number swap |
| Ongoing overhead | A Django app needs hosting, deployment, security patching, and monitoring — none of which this small feature justifies |
| Same result achievable in JavaScript | Region detection and content-swapping can be done client-side with no loss of the actual feature |

**Revisit this decision if**, in future, FinExperia needs: an admin dashboard for non-technical staff to update numbers, storage of form submissions in our own database, or integration with the CELSE Leads system. Those would be a separate, larger project — not a reason to rebuild this specific feature.

---

## 4. How Detection Will Work

### 4.1 Method: Client-side IP geolocation

When the page loads, a small script calls **ipwhois.io** — a free IP geolocation lookup service — which returns the visitor's approximate state/region based on their IP address. The script then shows the matching contact block and hides the others.

**Why ipwhois.io:**

| Requirement | ipwhois.io |
|---|---|
| Free tier | 1,000 lookups/day, no signup or API key needed to start |
| State/region data | Included |
| Commercial use on free tier | Explicitly allowed |
| HTTPS | Yes (required — finexperia.com is HTTPS, and browsers block insecure HTTP calls from a secure page) |

Other options considered and ruled out:
- **ip-api.com** — free tier is non-commercial only, and HTTP-only (would be blocked by the browser on an HTTPS page)
- **ipinfo.io (free "Lite" plan)** — unlimited, but only returns country-level data, not state-level, so it can't tell Kerala from Tamil Nadu

**Scaling note:** if finexperia.com ever exceeds ~1,000 visits/day, we'd add simple caching (remember a visitor's detected region so repeat visits don't re-query) or move to ipwhois.io's paid tier (~$2.50–10/month). Not needed at current traffic levels.

### 4.2 Important implications (please read)

- **No visitor permission popup.** Unlike GPS location, IP-based lookup doesn't require asking the visitor for permission — it happens silently based on the network connection.
- **Not perfectly accurate at state level.** IP-to-state mapping is good at country level, but noticeably less reliable when telling Kerala apart from Tamil Nadu or Karnataka — mobile networks and some ISPs route traffic in ways that don't match the visitor's real location. Expect occasional misses, more so than a simple "India vs not India" check would have.
- **Brief flash of default content.** Because the page has to load first, then run the lookup, then swap the content, visitors may see a default contact block for a fraction of a second before the correct one appears.
- **Manual override is required, not optional.** A visible "Not seeing your local contact? Tap here to change" control lets any visitor correct a wrong guess themselves. This is the safety net for the accuracy issue above.
- **Lookup service request limits.** Free geolocation APIs cap how many lookups per month are free. If site traffic grows, we may need to either upgrade the plan or cache results (e.g., remember the visitor's last detected/selected region for repeat visits) to reduce calls.
- **No sensitive data stored.** This only checks "which state does this IP likely belong to" to render a page — no personal data is collected or stored, so no additional privacy notice is needed for this specific feature.

---

## 5. Data Structure

All contact details live in one simple, editable block inside `script.js` (or a small separate `contacts-data.js` file for easier editing later). Example shape:

```js
const regionContacts = {
  kerala: {
    phone: "+91 8075313751",
    whatsapp: "918075313751",
    label: "Kerala"
  },
  tamil_nadu: {
    phone: "+91 95168 11111",
    whatsapp: "919516811111",
    label: "Tamil Nadu"
  },
  karnataka: {
    phone: "+91 95168 11111",
    whatsapp: "919516811111",
    label: "Karnataka"
  },
  andhra_pradesh: {
    phone: "+91 95168 11111",
    whatsapp: "919516811111",
    label: "Andhra Pradesh"
  },
  other: {
    phone: "+91 95168 11111",
    whatsapp: "919516811111",
    label: "Other"
  }
};
```

> **Numbers confirmed by Christopher.** Assumption made: the WhatsApp number is the same as the listed phone number for each region (only one number was given per region). Flag if any region needs a separate WhatsApp number.
>
> **Design decision:** even though Tamil Nadu, Karnataka, Andhra Pradesh, and Other currently share one number, all 5 regions are tracked as **separate entries**, not collapsed into one. This is intentional — each region can be given its own distinct phone/WhatsApp number later just by editing its entry above, with no change to the detection logic or the rest of the code.

---

## 6. Build Plan — Small Steps

We build and verify this in stages, so nothing large ships untested in one go.

### Step 1 — Manual switcher only (no auto-detection)
A simple set of tabs or a dropdown: Kerala / Tamil Nadu / Karnataka / Andhra Pradesh / Other. Selecting one updates the phone number and WhatsApp button shown. No geolocation involved yet — this proves the content-swapping and WhatsApp links work correctly.

### Step 2 — Add automatic region detection
A script runs on page load, calls the geolocation lookup service, and pre-selects the matching tab. The manual switcher from Step 1 **stays visible** so visitors can always correct it.

### Step 3 — Remember visitor's choice
If a visitor manually switches regions, remember that choice for their next visit (so they're not corrected back to a wrong auto-detected region every time).

### Step 4 — Polish
Visual styling to match the rest of the site; loading state while detection runs.

---

## 7. Open Questions / Decisions Needed — All Resolved

1. ~~Phone + WhatsApp numbers for the 4 named states~~ — **Confirmed** (see Section 5). Currently Tamil Nadu, Karnataka, Andhra Pradesh, and Other share one number, with Kerala distinct — but all 5 are tracked separately in the code so each can move to its own number later without any redesign.
2. ~~Which geolocation lookup service to use~~ — **Decided: ipwhois.io** (see Section 4.1).
3. ~~Default region to show while detection is running / before it completes~~ — **Confirmed: "Other"**, using +91 95168 11111.
4. ~~Should "Other" also cover visitors outside India~~ — **Confirmed: yes.** "Other" is the catch-all for any visitor not detected as Kerala, Tamil Nadu, Karnataka, or Andhra Pradesh — including visitors outside India.

---

## 8. Out of Scope (for this version)

- Any backend/Django component
- An admin panel for editing numbers without touching code
- GPS-based (browser permission) location detection
- Support for regions beyond the 5 listed
