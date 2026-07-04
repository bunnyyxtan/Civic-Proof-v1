// Location-aware authority routing (city -> state -> national).
// Verified govt grievance channels, researched Jul 2026.
// Tier-1: real grievance-intake email exists -> Gmail compose from user's own email.
// Tier-2: authority accepts complaints only via web portal -> guided "Open Portal".

export type CivicCategory =
  | "Water Overflow" | "Pothole & Road Damage" | "Garbage Dump"
  | "Power Line Danger" | "Traffic & Footpath Obstruction"

export type Authority = {
  departmentName: string
  email?: string           // set ONLY when a real grievance-intake email is confirmed
  portalUrl: string        // direct complaint-form URL wherever possible
  requiresLogin?: boolean  // portal needs registration/login before submitting
  level: "city" | "state" | "national"
}

const CPGRAMS: Authority = {
  departmentName: "CPGRAMS – National Public Grievance Portal",
  portalUrl: "https://pgportal.gov.in/",
  requiresLogin: true,
  level: "national",
}

/* ---------- LEVEL 1: metro cities ---------- */
type CityBlock = { match: string[]; depts: Partial<Record<CivicCategory, Omit<Authority, "level">>> }
const CITIES: CityBlock[] = [
  { match: ["delhi", "new delhi", "ncr", "patel nagar", "dwarka", "rohini", "saket", "karol bagh"], depts: {
    "Water Overflow": { departmentName: "Delhi Jal Board", email: "grievances-djb@delhi.gov.in", portalUrl: "https://djb.gov.in/DJBRMSPortal/portal/grievenceRegister.html" },
    "Pothole & Road Damage": { departmentName: "Municipal Corporation of Delhi (MCD)", portalUrl: "https://mcdonline.nic.in/" },
    "Garbage Dump": { departmentName: "MCD – Solid Waste Management", portalUrl: "https://mcdonline.nic.in/" },
    "Power Line Danger": { departmentName: "BSES Rajdhani Power", email: "brpl.customercare@relianceada.com", portalUrl: "https://www.bsesdelhi.com" },
    "Traffic & Footpath Obstruction": { departmentName: "MCD (Encroachment)", portalUrl: "https://mcdonline.nic.in/" },
  }},
  { match: ["mumbai", "bombay", "andheri", "bandra", "borivali", "dadar", "kurla", "malad"], depts: {
    "Water Overflow": { departmentName: "BMC – Civic Complaint (anonymous)", portalUrl: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg?guest_user=english" },
    "Pothole & Road Damage": { departmentName: "BMC – Civic Complaint (anonymous)", portalUrl: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg?guest_user=english" },
    "Garbage Dump": { departmentName: "BMC – Civic Complaint (anonymous)", portalUrl: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg?guest_user=english" },
    "Power Line Danger": { departmentName: "Adani Electricity Mumbai", portalUrl: "https://www.adanielectricity.com" },
    "Traffic & Footpath Obstruction": { departmentName: "BMC – Civic Complaint (anonymous)", portalUrl: "https://portal.mcgm.gov.in/irj/portal/anonymous/qlcomplaintreg?guest_user=english" },
  }},
  { match: ["bengaluru", "bangalore", "koramangala", "whitefield", "indiranagar", "malleshwaram", "jayanagar"], depts: {
    "Water Overflow": { departmentName: "BWSSB (Water)", portalUrl: "https://bwssb.karnataka.gov.in" },
    "Pothole & Road Damage": { departmentName: "BBMP / Greater Bengaluru Authority", portalUrl: "https://site.bbmp.gov.in" },
    "Garbage Dump": { departmentName: "BBMP – Solid Waste", portalUrl: "https://site.bbmp.gov.in" },
    "Power Line Danger": { departmentName: "BESCOM", email: "helpline@bescom.co.in", portalUrl: "https://bescom.karnataka.gov.in" },
    "Traffic & Footpath Obstruction": { departmentName: "BBMP / Greater Bengaluru Authority", portalUrl: "https://site.bbmp.gov.in" },
  }},
  { match: ["chennai", "madras", "adyar", "velachery", "anna nagar", "tambaram"], depts: {
    "Water Overflow": { departmentName: "Chennai Metrowater (CMWSSB)", portalUrl: "https://cmwssb.tn.gov.in" },
    "Pothole & Road Damage": { departmentName: "Greater Chennai Corporation", portalUrl: "https://chennaicorporation.gov.in" },
    "Garbage Dump": { departmentName: "Greater Chennai Corporation", portalUrl: "https://chennaicorporation.gov.in" },
    "Power Line Danger": { departmentName: "TANGEDCO", portalUrl: "https://www.tnpdcl.org" },
    "Traffic & Footpath Obstruction": { departmentName: "Greater Chennai Corporation", portalUrl: "https://chennaicorporation.gov.in" },
  }},
  { match: ["hyderabad", "secunderabad", "gachibowli", "jubilee hills", "kukatpally", "madhapur"], depts: {
    "Water Overflow": { departmentName: "HMWSSB (Water)", email: "customer-support@hyderabadwater.gov.in", portalUrl: "https://www.hyderabadwater.gov.in" },
    "Pothole & Road Damage": { departmentName: "GHMC", email: "csr-ghmc@telangana.gov.in", portalUrl: "https://csr.ghmc.gov.in" },
    "Garbage Dump": { departmentName: "GHMC – Solid Waste", email: "csr-ghmc@telangana.gov.in", portalUrl: "https://csr.ghmc.gov.in" },
    "Power Line Danger": { departmentName: "TGSPDCL", email: "customerservice@tgsouthernpower.org", portalUrl: "https://tgsouthernpower.org" },
    "Traffic & Footpath Obstruction": { departmentName: "GHMC", email: "csr-ghmc@telangana.gov.in", portalUrl: "https://csr.ghmc.gov.in" },
  }},
  { match: ["kolkata", "calcutta", "howrah", "salt lake", "behala"], depts: {
    "Water Overflow": { departmentName: "Kolkata Municipal Corporation", portalUrl: "https://www.kmcgov.in" },
    "Pothole & Road Damage": { departmentName: "Kolkata Municipal Corporation", portalUrl: "https://www.kmcgov.in" },
    "Garbage Dump": { departmentName: "KMC – Solid Waste", portalUrl: "https://www.kmcgov.in" },
    "Power Line Danger": { departmentName: "CESC Limited", portalUrl: "https://www.cesc.co.in" },
    "Traffic & Footpath Obstruction": { departmentName: "Kolkata Municipal Corporation", portalUrl: "https://www.kmcgov.in" },
  }},
  { match: ["pune", "pimpri", "chinchwad", "kothrud", "hinjewadi", "hadapsar"], depts: {
    "Water Overflow": { departmentName: "Pune Municipal Corporation", portalUrl: "https://complaint.pmc.gov.in" },
    "Pothole & Road Damage": { departmentName: "Pune Municipal Corporation", portalUrl: "https://complaint.pmc.gov.in" },
    "Garbage Dump": { departmentName: "PMC – Solid Waste", portalUrl: "https://complaint.pmc.gov.in" },
    "Power Line Danger": { departmentName: "MSEDCL", portalUrl: "https://www.mahadiscom.in" },
    "Traffic & Footpath Obstruction": { departmentName: "Pune Municipal Corporation", portalUrl: "https://complaint.pmc.gov.in" },
  }},
  { match: ["ahmedabad", "amdavad", "bopal", "maninagar", "satellite"], depts: {
    "Water Overflow": { departmentName: "Ahmedabad Municipal Corporation", email: "complaints@ahmedabadcity.gov.in", portalUrl: "https://ahmedabadcity.gov.in" },
    "Pothole & Road Damage": { departmentName: "Ahmedabad Municipal Corporation", email: "complaints@ahmedabadcity.gov.in", portalUrl: "https://ahmedabadcity.gov.in" },
    "Garbage Dump": { departmentName: "AMC – Solid Waste", email: "complaints@ahmedabadcity.gov.in", portalUrl: "https://ahmedabadcity.gov.in" },
    "Power Line Danger": { departmentName: "Torrent Power", portalUrl: "https://connect.torrentpower.com" },
    "Traffic & Footpath Obstruction": { departmentName: "Ahmedabad Municipal Corporation", email: "complaints@ahmedabadcity.gov.in", portalUrl: "https://ahmedabadcity.gov.in" },
  }},
]

/* ---------- LEVEL 2: state grievance portals ---------- */
const STATES: { match: string[]; authority: Omit<Authority, "level"> }[] = [
  { match: ["uttar pradesh", "lucknow", "kanpur", "noida", "ghaziabad", "varanasi", "agra", "prayagraj", "meerut"], authority: { departmentName: "UP Jansunwai (IGRS) – helpline 1076", portalUrl: "https://jansunwai.up.nic.in", requiresLogin: true } },
  { match: ["maharashtra", "nagpur", "nashik", "aurangabad", "thane"], authority: { departmentName: "Aaple Sarkar (Maharashtra)", portalUrl: "https://grievances.maharashtra.gov.in/en", requiresLogin: true } },
  { match: ["rajasthan", "jaipur", "jodhpur", "udaipur", "kota", "ajmer", "bikaner"], authority: { departmentName: "Rajasthan Sampark – helpline 181", portalUrl: "https://sampark.rajasthan.gov.in", requiresLogin: true } },
  { match: ["madhya pradesh", "bhopal", "indore", "gwalior", "jabalpur", "ujjain"], authority: { departmentName: "MP CM Helpline – 181", portalUrl: "https://cmhelpline.mp.gov.in", requiresLogin: true } },
  { match: ["bihar", "patna", "gaya", "bhagalpur", "muzaffarpur"], authority: { departmentName: "Bihar Lok Shikayat", email: "info-lokshikayat-bih@gov.in", portalUrl: "https://lokshikayat.bihar.gov.in", requiresLogin: true } },
  { match: ["gujarat", "surat", "vadodara", "rajkot", "gandhinagar"], authority: { departmentName: "SWAGAT (Gujarat)", portalUrl: "https://swagat.gujarat.gov.in", requiresLogin: true } },
  { match: ["tamil nadu", "coimbatore", "madurai", "trichy", "salem"], authority: { departmentName: "TN CM Helpline – 1100", email: "cmhelpline@tn.gov.in", portalUrl: "https://cmhelpline.tnega.org" } },
  { match: ["haryana", "gurugram", "gurgaon", "faridabad", "panipat", "karnal"], authority: { departmentName: "Haryana CM Window", portalUrl: "https://cmharyanacell.nic.in", requiresLogin: true } },
  { match: ["telangana", "warangal", "nizamabad"], authority: { departmentName: "Telangana Prajavani", portalUrl: "https://prajavani.telangana.gov.in", requiresLogin: true } },
  { match: ["karnataka", "mysuru", "mysore", "mangaluru", "hubli"], authority: { departmentName: "Karnataka Janaspandana / IPGRS", portalUrl: "https://ipgrs.karnataka.gov.in", requiresLogin: true } },
  { match: ["west bengal", "siliguri", "durgapur", "asansol"], authority: { departmentName: "West Bengal CM Grievance Cell", portalUrl: "https://cmo.wb.gov.in", requiresLogin: true } },
  { match: ["delhi"], authority: { departmentName: "Delhi CM Jan Sunwai", portalUrl: "https://cmjansunwai.delhi.gov.in", requiresLogin: true } },
]

/* ---------- RESOLVER: city -> state -> national ---------- */
export function getAuthority(category: CivicCategory, locationText?: string): Authority {
  const loc = (locationText || "").toLowerCase()
  const city = CITIES.find((c) => c.match.some((k) => loc.includes(k)))
  const cityDept = city?.depts[category as CivicCategory]
  if (cityDept) return { ...cityDept, level: "city" }
  const state = STATES.find((s) => s.match.some((k) => loc.includes(k)))
  if (state) return { ...state.authority, level: "state" }
  return CPGRAMS
}

/* Gmail compose URL — opens in user's logged-in Gmail, new tab */
export function buildGmailComposeUrl(to: string, subject: string, body: string): string {
  const p = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body })
  return `https://mail.google.com/mail/?${p.toString()}`
}

/* Step-by-step guide shown after a portal handoff */
export function getPortalSteps(a: Authority, recordId: string): string[] {
  const steps: string[] = []
  if (a.requiresLogin) steps.push(`Register / log in on the ${a.departmentName} portal (one-time).`)
  steps.push("Start a new complaint and choose the category matching this issue.")
  steps.push("Paste the petition (already copied to your clipboard) into the description box.")
  steps.push(`Mention this reference in the complaint: ${recordId}.`)
  steps.push("Attach the evidence photo if the portal allows, then submit.")
  return steps
}
