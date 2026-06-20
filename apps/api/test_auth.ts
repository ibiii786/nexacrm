import jwt from 'jsonwebtoken';

async function run() {
  const token = jwt.sign({ id: 'some-super-admin-id', email: 'admin@nexacrm.com', role: 'SUPER_ADMIN' }, 'dev_secret', { expiresIn: '1h' });
  const res = await fetch('http://localhost:3001/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'Test User', email: 'test_create@nexacrm.com', password: 'Password123!', role: 'USER' })
  });
  const text = await res.text();
  console.log(res.status, text);
}
run();
