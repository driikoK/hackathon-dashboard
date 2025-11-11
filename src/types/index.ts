export interface Account {
  AccountId: string;
  bankId: number;
  AccountHolderName: string;
  AccountHolderShortName: string;
  Status: string;
  Currency: string;
  Nickname?: string;
  AccountType: string;
  AccountSubType: string;
  StatusUpdateDateTime: string;
  AccountIdentifiers: AccountIdentifier[];
  Servicer: {
    SchemeName: string;
    Identification: string;
  };
  Description: string;
  OpeningDate: string;
}

export interface AccountIdentifier {
  SchemeName: string;
  Identification: string;
  Name: string;
}

export interface Transaction {
  TransactionId: string;
  TransactionDateTime: string;
  TransactionReference: string;
  TransactionType: string;
  SubTransactionType: string;
  PaymentModes: string;
  StatementReference: string;
  CreditDebitIndicator: 'Credit' | 'Debit';
  Status: string;
  BookingDateTime: string;
  ValueDateTime?: string;
  Amount: {
    Amount: string;
    Currency: string;
  };
  Balance: {
    CreditDebitIndicator: 'Credit' | 'Debit';
    Type: string;
    Amount: {
      Amount: string;
      Currency: string;
    };
  };
  LocalTimeZone: string;
  TerminalId: string | null;
  AccountId: string;
  MerchantDetails?: {
    MerchantName?: string;
    MerchantCategoryCode?: string;
  };
  ProprietaryBankTransactionCode?: {
    Code?: string;
    Issuer?: string;
  };
}

export interface Balance {
  Amount: {
    Amount: string;
    Currency: string;
  };
  CreditDebitIndicator: 'Credit' | 'Debit';
  Type: string;
  DateTime: string;
  AccountId: string;
  CreditLine?: {
    Included: boolean;
    Type: string;
    Amount: {
      Amount: string;
      Currency: string;
    };
  }[];
}

export interface Bank {
  bankId: number;
  name: string;
  shortName: string;
  logo: string;
  color: string;
}
