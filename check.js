const https = require('https');
https.get('https://nexacrm-web.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="\/assets\/index-([a-zA-Z0-9_-]+)\.js"/);
    console.log(match ? match[0] : 'No match');
  });
});
