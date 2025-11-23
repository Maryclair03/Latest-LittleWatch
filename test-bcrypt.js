const bcrypt = require('bcryptjs');

async function test() {
  const password = 'password';
  const hash = '$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW';
  
  console.log('Password:', password);
  console.log('Password bytes:', Buffer.from(password));
  console.log('Hash:', hash);
  console.log('Hash length:', hash.length);
  
  const match = await bcrypt.compare(password, hash);
  console.log('Match:', match);
  
  // Also test creating a new hash
  const salt = await bcrypt.genSalt(10);
  const newHash = await bcrypt.hash(password, salt);
  console.log('New hash:', newHash);
  
  const match2 = await bcrypt.compare(password, newHash);
  console.log('New hash match:', match2);
}

test();