const fs = require('fs');
let c = fs.readFileSync('app/page.tsx', 'utf8');

c = c.replaceAll('c.corroborations.some(corr => corr.contributorName === "You (Original Reporter)")', 'c.createdByUid === citizen.uid');
c = c.replaceAll('c.corroborations.some(corr => corr.contributorName === "You" || corr.contributorName === "You (Original Reporter)")', 'c.createdByUid === citizen.uid');
c = c.replaceAll('c.corroborations.some(co => co.contributorName === "You" || co.contributorName === "You (Original Reporter)")', 'c.createdByUid === citizen.uid');
c = c.replaceAll('item.corroborations.some(co => co.contributorName === "You" || co.contributorName === "You (Original Reporter)")', 'item.createdByUid === citizen.uid');
c = c.replaceAll('c.corroborations.some(corr => corr.contributorName.startsWith("You"))', 'c.createdByUid === citizen.uid');

c = c.replaceAll('{selectedCase.corroborations.length} citizens verified', '{supporterCount(selectedCase)} citizens verified');
c = c.replaceAll('{selectedCase.corroborations?.length} citizens verified', '{supporterCount(selectedCase)} citizens verified');

c = c.replaceAll('{selectedCase.corroborations.length + 1}', '{supporterCount(selectedCase)}');
c = c.replaceAll('{selectedCase.corroborations?.length + 1}', '{supporterCount(selectedCase)}');

const helper = `const supporterCount = (c: CivicCase) => 1 + new Set(c.corroborations.filter(x => x.contributorUid && x.contributorUid !== c.createdByUid).map(x => x.contributorUid)).size;

export default function CivicProofApp`;

c = c.replace(/export default function CivicProofApp/, helper);

c = c.replaceAll('{selectedCase.corroborations.map((c, i) => (', '{selectedCase.corroborations.filter(co => co.contributorUid !== selectedCase.createdByUid).map((c, i) => (');

fs.writeFileSync('app/page.tsx', c);
console.log('Done');
