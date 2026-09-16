/**
 * CLI Helper to update forwarder rates and maintain change history.
 * 
 * Usage:
 *   node scripts/update-rate.js <forwarderId> <newRate> [optional note]
 * 
 * Example:
 *   node scripts/update-rate.js usa2georgia 9.50 "ტარიფის გაძვირება საახალწლოდ"
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'forwarders.json');

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Usage: node scripts/update-rate.js <forwarderId> <newRate> [note]');
    console.error('Example: node scripts/update-rate.js usa2georgia 9.50 "ტარიფის მატება"');
    process.exit(1);
}

const forwarderId = args[0].toLowerCase().trim();
const newRate = parseFloat(args[1]);
const note = args[2] || (newRate > 0 ? 'ტარიფის განახლება' : '');

if (isNaN(newRate) || newRate <= 0) {
    console.error('Error: newRate must be a positive number.');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found at ${filePath}`);
    process.exit(1);
}

const forwarders = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const forwarder = forwarders.find(f => f.id === forwarderId);

if (!forwarder) {
    console.error(`Error: Company "${forwarderId}" not found. Available IDs: ${forwarders.map(f => f.id).join(', ')}`);
    process.exit(1);
}

const prevRate = forwarder.currentRate;
const diff = +(newRate - prevRate).toFixed(2);
const today = new Date().toISOString().split('T')[0];

let direction = 'unchanged';
if (diff > 0) direction = 'up';
else if (diff < 0) direction = 'down';

forwarder.previousRate = prevRate;
forwarder.currentRate = newRate;
forwarder.lastUpdated = today;

if (!forwarder.history) forwarder.history = [];

forwarder.history.unshift({
    date: today,
    rate: newRate,
    change: diff,
    direction: direction,
    note: note || (diff > 0 
        ? `ტარიფი გაიზარდა $${Math.abs(diff).toFixed(2)}-ით ($${prevRate.toFixed(2)} ➔ $${newRate.toFixed(2)})` 
        : diff < 0 
        ? `ტარიფი შემცირდა $${Math.abs(diff).toFixed(2)}-ით ($${prevRate.toFixed(2)} ➔ $${newRate.toFixed(2)})`
        : `ტარიფი დადასტურდა ($${newRate.toFixed(2)})`)
});

fs.writeFileSync(filePath, JSON.stringify(forwarders, null, 2), 'utf-8');

console.log(`✅ Successfully updated ${forwarder.name}:`);
console.log(`   Previous Rate: $${prevRate.toFixed(2)}/kg`);
console.log(`   New Rate:      $${newRate.toFixed(2)}/kg (${diff >= 0 ? '+' : ''}${diff.toFixed(2)})`);
console.log(`   Direction:     ${direction.toUpperCase()}`);
console.log(`   Updated Date:  ${today}`);
