const http = require('http');

function postData(path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
      }
    };
    
    const req = http.request(options, (res) => {
      let result = '';
      res.on('data', (chunk) => { result += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${result}`));
        else resolve(JSON.parse(result));
      });
    });
    
    req.on('error', (e) => reject(e));
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  try {
    const report1 = {
      photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      userNotes: "Huge pothole",
      gps: { latitude: 28.6625, longitude: 77.129, address: "Patel Nagar", accuracyMeters: 5, confirmedByUser: true },
      manualCategory: "Pothole & Road Damage",
      citizenUid: "test-user-1"
    };

    console.log("Submitting report 1 to /api/run-report-pipeline...");
    const res1 = await postData('/api/run-report-pipeline', report1);
    console.log("Report 1 Result:", res1.success ? "Success" : "Failed", res1.case.id);

    const report2 = {
      photoUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
      userNotes: "This pothole is destroying my suspension!",
      gps: { latitude: 28.6625, longitude: 77.1291, address: "Patel Nagar", accuracyMeters: 5, confirmedByUser: true },
      manualCategory: "Pothole & Road Damage",
      citizenUid: "test-user-2"
    };

    console.log("Submitting report 2 (corroboration) to /api/run-report-pipeline...");
    const res2 = await postData('/api/run-report-pipeline', report2);
    console.log("Report 2 Result:", res2.success ? "Success" : "Failed", res2.case.id);
    console.log("Merged?", res2.mergedWithExisting);
    console.log("Harm score:", res2.case.harmScore);

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();
