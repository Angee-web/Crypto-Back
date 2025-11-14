import bcrypt from 'bcryptjs';

async function testPassword() {
  // 1. Simulate the password you register with
  const plainPassword = 'Ada1234#';

  // 2. Simulate the hashed password from MongoDB
  // Replace this with the actual hash you see in the DB
  const hashedPasswordFromDB = '$2a$12$XEE3y4wKDpd5cQ60854VMusGqGHh6KEGeNnmeX3egvYk/ZZylOm0q';

  console.log("Plain password:", plainPassword);
  console.log("Hashed password from DB:", hashedPasswordFromDB);

  // 3. Compare manually with bcrypt
  const isMatch = await bcrypt.compare(plainPassword, hashedPasswordFromDB);
  console.log("Does password match?", isMatch);
}

testPassword();
