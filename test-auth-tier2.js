const fs = require('fs');

// We evaluate the compiled output conceptually since we want to know what the UI will show.
// I'll simulate exactly what happens based on the new logic in page.tsx and authorityDirectory.ts

const CPGRAMS = { departmentName: "CPGRAMS – National Public Grievance Portal", portalUrl: "https://pgportal.gov.in/", requiresLogin: true, level: "national" }

const CITIES = [
  { match: ["delhi"], depts: {
    "Water Overflow": { departmentName: "Delhi Jal Board", email: "grievances-djb@delhi.gov.in", portalUrl: "https://djb.gov.in/DJBRMSPortal/portal/grievenceRegister.html" },
    "Pothole & Road Damage": { departmentName: "Municipal Corporation of Delhi (MCD)", portalUrl: "https://mcdonline.nic.in/" }
  }},
  { match: ["mumbai"], depts: {
    "Garbage Dump": { departmentName: "BMC – Civic Complaint (anonymous)", portalUrl: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg?guest_user=english" }
  }}
]

const STATES = [
  { match: ["rajasthan", "jaipur"], authority: { departmentName: "Rajasthan Sampark – helpline 181", portalUrl: "https://sampark.rajasthan.gov.in", requiresLogin: true } }
]

function getAuthority(category, locationText) {
  const loc = (locationText || "").toLowerCase()
  const city = CITIES.find((c) => c.match.some((k) => loc.includes(k)))
  const cityDept = city?.depts[category]
  if (cityDept) return { ...cityDept, level: "city" }
  const state = STATES.find((s) => s.match.some((k) => loc.includes(k)))
  if (state) return { ...state.authority, level: "state" }
  return CPGRAMS
}

function getPortalSteps(a, recordId) {
  const steps = []
  if (a.requiresLogin) steps.push(`Register / log in on the ${a.departmentName} portal (one-time).`)
  steps.push("Start a new complaint and choose the category matching this issue.")
  steps.push("Paste the petition (already copied to your clipboard) into the description box.")
  steps.push(`Mention this reference in the complaint: ${recordId}.`)
  steps.push("Attach the evidence photo if the portal allows, then submit.")
  return steps
}

function simulateRender(test) {
  const auth = getAuthority(test.category, test.location);
  const isEmail = !!auth.email;
  const label = isEmail ? `Email Authority (${auth.email})` : `Open Complaint Portal`;
  const handoffPanel = isEmail 
    ? `Gmail compose opened for ${auth.departmentName}`
    : `Steps: ${getPortalSteps(auth, test.id).join(' | ')}`;
  
  return {
    label,
    url: isEmail ? 'Gmail compose opens prefilled' : `opens ${auth.portalUrl}`,
    handoffPanel
  };
}

const tests = [
  { location: "Delhi", category: "Water Overflow", id: "REF-1" },
  { location: "Delhi", category: "Pothole & Road Damage", id: "REF-2" },
  { location: "Mumbai", category: "Garbage Dump", id: "REF-3" },
  { location: "Jaipur", category: "Pothole & Road Damage", id: "REF-4" },
  { location: "Unknown City", category: "Garbage Dump", id: "REF-5" },
];

tests.forEach(t => {
  console.log(`\nTest: ${t.location} + ${t.category}`);
  const res = simulateRender(t);
  console.log(`-> button = ${res.label} -> ${res.url}`);
  console.log(`-> green panel: ${res.handoffPanel}`);
});
