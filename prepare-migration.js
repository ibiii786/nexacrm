const fs = require('fs');
const env = fs.readFileSync('.env.api.prod.local', 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .map(line => { 
    const [key, ...rest] = line.split('='); 
    return { key, value: rest.join('=').replace(/^\"|\"$/g, '').trim() }; 
  });
const dbUrl = env.find(e => e.key === 'DATABASE_URL')?.value;
const directUrl = env.find(e => e.key === 'DIRECT_URL')?.value;
if (dbUrl) {
  console.log('Found DB URL. Writing migration bat file...');
  fs.writeFileSync('run-migration.bat', `set DATABASE_URL=${dbUrl}\r\nset DIRECT_URL=${directUrl}\r\ncd apps/api\r\nnpx prisma migrate deploy\r\n`);
} else {
  console.log('Missing DB URL in .env.api.prod.local');
}
