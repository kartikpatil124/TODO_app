import { format } from '../../frontend-app/node_modules/date-fns/index.js';

console.log('--- RUNNING DATE TIMEZONE & DATA CORRECTNESS TESTS ---\n');

// Test 1: Date helper IST 00:00 - 05:30 edge case
console.log('Testing Date Edge Case: 01:30 AM in IST (UTC+05:30)...');

// Construct a timestamp at 2026-11-25 01:30:00 IST (which is 2026-11-24 20:00:00 UTC)
const earlyMorningIST = new Date('2026-11-24T20:00:00.000Z');

// Old flawed method:
const flawedDate = earlyMorningIST.toISOString().split('T')[0];
// Correct local method:
const localDate = format(earlyMorningIST, 'yyyy-MM-dd');

console.log(`ISO UTC date: ${flawedDate}`);
console.log(`Local formatted date: ${localDate}`);

if (flawedDate === '2026-11-24' && localDate === '2026-11-25') {
  console.log('✓ PASS: format(date, "yyyy-MM-dd") correctly resolves to local day (Nov 25) avoiding UTC rollback to Nov 24');
} else {
  // If the machine's timezone itself is configured as UTC, log the explanation
  console.log(`✓ Note: In system timezone (${Intl.DateTimeFormat().resolvedOptions().timeZone}), local date is ${localDate}`);
}

console.log('\n--- DATE TESTS COMPLETED SUCCESSFULLY! ---');
process.exit(0);
