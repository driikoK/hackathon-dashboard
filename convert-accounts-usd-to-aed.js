import fs from 'fs';

// Read the accounts file
const accountsData = JSON.parse(fs.readFileSync('./src/db/accounts-real.json', 'utf8'));

// Conversion rate: 1 USD = 3.6725 AED (1 AED = 0.27 USD)
const USD_TO_AED = 3.6725;

let convertedCount = 0;

// Convert USD accounts to AED
accountsData.data = accountsData.data.map(account => {
  // Check if currency is USD
  if (account.currency && account.currency.code === 'USD') {
    // Convert balances from USD to AED
    const currentBalance = parseFloat(account.current_balance);
    const currentBalanceAED = currentBalance * USD_TO_AED;
    
    convertedCount++;
    console.log(`Converting account "${account.name}": ${account.current_balance} USD -> ${currentBalanceAED.toFixed(2)} AED`);
    
    return {
      ...account,
      current_balance: currentBalanceAED.toFixed(2),
      current_balance_usd: account.current_balance, // Keep original USD value
      currency: {
        ...account.currency,
        code: 'AED',
        name: 'United Arab Emirates dirham',
        id: 6
      }
    };
  }
  
  return account;
});

// Write back to file
fs.writeFileSync('./src/db/accounts-real.json', JSON.stringify(accountsData, null, 2), 'utf8');

console.log(`\n✅ Conversion complete! Converted ${convertedCount} USD account(s) to AED.`);
