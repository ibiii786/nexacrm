async function run() {
  const text = `Name: Adrian kozakiewicz
Contact: 4169967757
ADDRESS: 113 surbray grive mississauga 
Products: 1x Double Size 12" Thick Anna plus mattress 
Total : 250$`;

  const res = await fetch('http://localhost:3001/api/orders/parse-paste', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawText: text })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
