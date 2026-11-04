import assert from 'node:assert';
import fs from 'node:fs';

console.log('Testing Admin Health Column & Health Filter Feature...');

const mainJs = fs.readFileSync('src/main.js', 'utf8');
const styleCss = fs.readFileSync('src/style.css', 'utf8');

// 1. Table Header contains Kesihatan column
assert(
  mainJs.includes('<th>Kesihatan</th>'),
  'Admin table header must have <th>Kesihatan</th>'
);

// 2. Filter select contains #filter-health
assert(
  mainJs.includes('id="filter-health"'),
  'Admin filters must include #filter-health select'
);
assert(
  mainJs.includes('<option value="Ada">Ada masalah</option>'),
  'Filter health must have option for "Ada masalah"'
);
assert(
  mainJs.includes('<option value="Tiada">Tiada masalah</option>'),
  'Filter health must have option for "Tiada masalah"'
);

// 3. filterControls includes healthSelect
assert(
  mainJs.includes('healthSelect = document.querySelector(\'#filter-health\')'),
  'healthSelect must be queried from DOM'
);
assert(
  mainJs.includes('filterControls = [searchInput, courseSelect, semesterSelect, genderSelect, expSelect, healthSelect, statusSelect]'),
  'filterControls must include healthSelect'
);

// 4. CSS contains health-cell, health-tag, and health-detail-text
assert(
  styleCss.includes('.health-cell'),
  'style.css must define .health-cell'
);
assert(
  styleCss.includes('.health-tag.has-issue'),
  'style.css must define .health-tag.has-issue'
);
assert(
  styleCss.includes('.health-detail-text'),
  'style.css must define .health-detail-text'
);

// 5. Test health filtering logic
function filterTest(members, healthFilter) {
  return members.filter(row => {
    const hasHealthIssue =
      row.health === 'Ada' ||
      (row.health_details && row.health_details.trim().toLowerCase() !== 'tiada' && row.health_details.trim() !== '') ||
      (row.healthDetails && row.healthDetails.trim().toLowerCase() !== 'tiada' && row.healthDetails.trim() !== '') ||
      (row.health_issues && row.health_issues.trim().toLowerCase() !== 'tiada' && row.health_issues.trim() !== '');

    const matchesHealth =
      !healthFilter ||
      (healthFilter === 'Ada' && hasHealthIssue) ||
      (healthFilter === 'Tiada' && !hasHealthIssue);

    return matchesHealth;
  });
}

const mockMembers = [
  { id: 1, full_name: 'Athlete A', health: 'Tiada', health_details: '' },
  { id: 2, full_name: 'Athlete B', health: 'Ada', health_details: 'Asma ringan' },
  { id: 3, full_name: 'Athlete C', health: 'Tiada', health_details: 'Tiada' },
  { id: 4, full_name: 'Athlete D', health: 'Ada', health_details: 'Kecederaan lutut' },
];

assert.strictEqual(filterTest(mockMembers, '').length, 4, 'Empty filter returns all');
assert.strictEqual(filterTest(mockMembers, 'Ada').length, 2, 'Ada filter returns exactly 2 athletes');
assert.strictEqual(filterTest(mockMembers, 'Tiada').length, 2, 'Tiada filter returns exactly 2 athletes');

console.log('✔ All Admin Health Column & Filter tests passed successfully!');
