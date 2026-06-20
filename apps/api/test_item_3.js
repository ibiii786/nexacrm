async function test() {
  const login = async (email, password) => {
    const r = await fetch('http://localhost:3001/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    return (await r.json()).data.accessToken;
  };
  
  const userToken = await login('user@nexacrm.com', 'UserPassword123!');
  const adminToken = await login('manager@nexacrm.com', 'AdminPassword123!');
  
  // Create 2 orders as user
  const statusesReq = await fetch('http://localhost:3001/api/statuses', { headers: { 'Authorization': `Bearer ${userToken}` }});
  const statuses = (await statusesReq.json()).data;
  const status1 = statuses[0].id;
  const status2 = statuses[1].id;
  
  console.log('User Token exists:', !!userToken, 'Admin Token exists:', !!adminToken);
  
  const createOrder = async (token) => {
    const r = await fetch('http://localhost:3001/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ statusId: status1, customFields: { "Client Name": "Test Client" } }) });
    return (await r.json()).data;
  };
  
  const order1 = await createOrder(userToken);
  const order2 = await createOrder(userToken);
  console.log('Created orders as user:', order1.id, order2.id);
  
  // 1. As USER, bulk-change status
  let r = await fetch('http://localhost:3001/api/orders/bulk/status', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ ids: [order1.id, order2.id], statusId: status2 })
  });
  console.log('USER bulk status update on own orders:', await r.json());
  
  // 2. Create order as ADMIN, then modify it directly via DB to make it old
  const { execSync } = require('child_process');
  const order3 = await createOrder(adminToken);
  execSync(`npx prisma db execute --stdin "UPDATE orders SET created_at = NOW() - INTERVAL '2 hours' WHERE id = '${order3.id}'"`, { stdio: 'inherit' });
  console.log('Created order 3 as admin and backdated it:', order3.id);
  
  // As USER, try to bulk select order1 and order3
  r = await fetch('http://localhost:3001/api/orders/bulk/status', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${userToken}` },
    body: JSON.stringify({ ids: [order1.id, order3.id], statusId: status1 })
  });
  console.log('USER bulk status update mixing own and admin (expired) orders:', await r.json());
  
  // 3. As ADMIN, bulk-delete order1 and order2
  r = await fetch('http://localhost:3001/api/orders/bulk/delete', {
    method: 'DELETE', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ ids: [order1.id, order2.id, order3.id] })
  });
  console.log('ADMIN bulk delete:', await r.json());
}
test();
