const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const envPath = path.resolve(__dirname, '../../.env.vercel.production');
const envContent = fs.readFileSync(envPath, 'utf8');

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    let value = valueParts.join('=').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    process.env[key.trim()] = value;
  }
});

console.log('Running prisma migrate deploy...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('Running prisma db seed...');
execSync('npx prisma db seed', { stdio: 'inherit' });

console.log('Done.');
