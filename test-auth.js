// Standalone node script to test authority matching

const CPGRAMS = { departmentName: "CPGRAMS – National Public Grievance Portal", portalUrl: "https://pgportal.gov.in/", level: "national" };
const CITIES = [
  { match: ["delhi", "new delhi", "ncr", "patel nagar", "dwarka", "rohini", "saket"], depts: {
    "Water Overflow": { departmentName: "Delhi Jal Board", email: "grievances-djb@delhi.gov.in", portalUrl: "https://djb.gov.in" },
    "Pothole & Road Damage": { departmentName: "Municipal Corporation of Delhi", portalUrl: "https://mcdonline.nic.in" },
  }},
];
const STATES = [
  { match: ["rajasthan", "jaipur"], authority: { departmentName: "Rajasthan Sampark (181)", portalUrl: "https://sampark.rajasthan.gov.in" } },
  { match: ["madhya pradesh", "bhopal"], authority: { departmentName: "MP CM Helpline (181)", portalUrl: "https://cmhelpline.mp.gov.in" } },
];

function getAuth(category, locationText) {
  const loc = (locationText || "").toLowerCase()
  const city = CITIES.find((c) => c.match.some((k) => loc.includes(k)))
  const cityDept = city?.depts[category]
  if (cityDept) return { ...cityDept, level: "city" }
  const state = STATES.find((s) => s.match.some((k) => loc.includes(k)))
  if (state) return { ...state.authority, level: "state" }
  return CPGRAMS
}

function buildURL(to, subject, body) {
  const p = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body })
  return `https://mail.google.com/mail/?${p.toString()}`
}

function renderUI(caseData) {
  const authority = getAuth(caseData.category, caseData.location);
  const emailSubject = `Civic Complaint: ${caseData.title} [${caseData.id}]`;
  const emailBody = caseData.petition;
  
  let label = "";
  let url = "";
  let routedTo = authority.departmentName;
  if (authority.level !== "city") routedTo += " (state/national grievance portal)";

  if (authority.email) {
    label = `Email Authority (${authority.email})`;
    url = buildURL(authority.email, emailSubject, emailBody);
  } else {
    label = "Open Complaint Portal";
    url = authority.portalUrl;
  }
  
  return { routedTo, label, url };
}

const tests = [
  { title: "Delhi Pothole", category: "Pothole & Road Damage", location: "New Delhi", id: "123", petition: "Test" },
  { title: "Delhi Water", category: "Water Overflow", location: "Delhi", id: "124", petition: "Test" },
  { title: "Jaipur Case", category: "Water Overflow", location: "Jaipur, Rajasthan", id: "125", petition: "Test" },
  { title: "Unknown Case", category: "Garbage Dump", location: "Unknown City", id: "126", petition: "Test" },
];

tests.forEach(t => {
  console.log(`Test: ${t.title}`);
  console.log(renderUI(t));
});
