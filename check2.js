const https = require('https');
https.get('https://nexacrm-web.vercel.app/assets/index-Bz2LWtl2.js', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/const\s+[a-z]\s*=\s*(.*?);.*?baseURL:([a-z])/);
    console.log("Variable definition:", match ? match[0] : 'No match');
  });
});
