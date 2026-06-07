const fs = require('fs');
const path = require('path');

function run(database, SQL) {
  const namesPath = path.join(__dirname, 'names.json');
  const names = JSON.parse(fs.readFileSync(namesPath, 'utf-8'));

  const insert = database.prepare(`
    INSERT INTO names (given_name, gender, name_length, styles, zodiac_suits, zodiac_avoids, pronunciation, char_meaning, overall_meaning, region_tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = database.prepare(`
    INSERT INTO names (given_name, gender, name_length, styles, zodiac_suits, zodiac_avoids, pronunciation, char_meaning, overall_meaning, region_tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const name of names) {
    insertMany.run([
      name.given_name,
      name.gender,
      name.name_length,
      JSON.stringify(name.styles),
      JSON.stringify(name.zodiac_suits),
      JSON.stringify(name.zodiac_avoids),
      name.pronunciation,
      name.char_meaning,
      name.overall_meaning,
      JSON.stringify(name.region_tags)
    ]);
  }

  console.log(`[Seed] Inserted ${names.length} name records.`);
}

module.exports = { run };
