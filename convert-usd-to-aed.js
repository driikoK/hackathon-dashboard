import fs from 'fs';

// Read the transactions file
const transactionsData = JSON.parse(fs.readFileSync('./src/db/transactions-real.json', 'utf8'));

// Conversion rate: 1 USD = 3.6725 AED (1 AED = 0.27 USD)
const USD_TO_AED = 3.6725;

let convertedCount = 0;

// Convert USD transactions to AED
transactionsData.data = transactionsData.data.map(transaction => {
  // Check if currency is USD
  if (transaction.currency && transaction.currency.code === 'USD') {
    // Convert amount from USD to AED
    const usdAmount = parseFloat(transaction.amount);
    const aedAmount = usdAmount * USD_TO_AED;
    
    convertedCount++;
    if (convertedCount <= 5) {
      console.log(`Converting transaction ${transaction.id}: ${transaction.amount} USD -> ${aedAmount.toFixed(2)} AED`);
    }
    
    return {
      ...transaction,
      amount: aedAmount.toFixed(2),
      currency: {
        ...transaction.currency,
        code: 'AED',
        name: 'United Arab Emirates dirham',
        id: 6
      }
    };
  }
  
  return transaction;
});

// Write back to file
fs.writeFileSync('./src/db/transactions-real.json', JSON.stringify(transactionsData, null, 2), 'utf8');

console.log(`\n✅ Conversion complete! Converted ${convertedCount} USD transactions to AED.`);
