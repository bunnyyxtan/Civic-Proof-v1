const fs = require('fs');

const CPGRAMS = { departmentName: "CPGRAMS – National Public Grievance Portal", portalUrl: "https://pgportal.gov.in/", requiresLogin: true, level: "national" }

const CITIES = [
  // Keeping cities empty since none of the tests hit a metro city, but preserving the structure
]

const STATES = [
  // ----- East -----
  { match: ["odisha","orissa","bhubaneswar","cuttack","rourkela","berhampur","sambalpur","puri"], authority: { departmentName: "Odisha Jana Sunani", portalUrl: "https://janasunani.odisha.gov.in/" } },

  // ----- South -----
  { match: ["kerala","thiruvananthapuram","trivandrum","kochi","cochin","kozhikode","calicut","thrissur","kollam","kannur"], authority: { departmentName: "Kerala CM Grievance – helpline 1076", portalUrl: "https://cmo.kerala.gov.in/", requiresLogin: true } },

  // ----- Northeast -----
  { match: ["assam","guwahati","dibrugarh","silchar","jorhat","tezpur","nagaon"], authority: { departmentName: "Assam CM Grievance (Write to CM)", portalUrl: "https://cm.assam.gov.in/write-to-cm" } },
  { match: ["meghalaya","shillong","tura","jowai"], authority: { departmentName: "Meghalaya CM Connect – 1971", email: "cmconnect1971@outlook.com", portalUrl: "https://meghalaya.gov.in/services/content/19327" } },
  { match: ["arunachal","itanagar","naharlagun","tawang"], authority: { departmentName: "Arunachal Grievances (CPGRAMS)", portalUrl: "https://pgportal.gov.in/", requiresLogin: true } },
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

function simulateRender(location) {
  const auth = getAuthority("Garbage Dump", location); // category doesn't matter for state fallback
  const isEmail = !!auth.email;
  const label = isEmail ? `Email Authority (${auth.email})` : `Open Complaint Portal`;
  const url = isEmail ? 'Gmail compose' : `opens ${auth.portalUrl}`;
  return `${label} -> ${url} | Dept: ${auth.departmentName} | requiresLogin: ${!!auth.requiresLogin}`;
}

const tests = [
  "Kochi",
  "Shillong",
  "Guwahati",
  "Itanagar",
  "some village, Odisha",
];

tests.forEach(t => {
  console.log(`Test: ${t}\n-> ${simulateRender(t)}\n`);
});
