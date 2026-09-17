/** Curated fraud/scam knowledge corpus for RAG.
 *  25 entries covering UPI fraud patterns, OTP scams, fake payment screenshots,
 *  collect-request scams, and fake customer support.
 *  Source: RBI/NPCI consumer awareness materials + CERT-In advisories.
 */
export interface FraudKnowledgeEntry {
  category: 'fraud';
  source: string;
  chunk_text: string;
}

export const fraudKnowledge: FraudKnowledgeEntry[] = [
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'UPI Collect Request Scam: Fraudsters send a "collect" (payment request) instead of paying you. When you enter your UPI PIN to "confirm receipt", you are actually authorizing a payment FROM your account TO theirs. You should NEVER enter your UPI PIN to receive money — receiving money requires no PIN.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Fake Payment Screenshot Scam: Scammers share a fabricated screenshot or SMS showing that payment was made to you. Always verify payment receipt in your UPI app or bank statement — never release goods or services based solely on a screenshot.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'OTP / PIN Sharing Scam: No bank, UPI app, payment gateway, or government official will ever ask for your OTP or UPI PIN. Sharing your OTP or PIN with anyone — even someone claiming to be from your bank — gives them complete access to your account.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Fake Customer Support Scam: Fraudsters post fake UPI/bank customer care numbers on social media or search results. They ask you to download remote-access apps (like AnyDesk or TeamViewer) to "fix" your issue, then steal from your account. Always use the official number printed on your bank card or the official bank website.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'QR Code Scan Scam: Scammers ask you to "scan this QR code to receive money". Scanning a QR code and entering your PIN initiates a PAYMENT from your account. A legitimate payer does not need you to scan anything — they pay to your UPI ID directly.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Phishing SMS / WhatsApp: Messages claiming your UPI ID is blocked, your KYC is expired, or your account will be closed — with a link — are almost always phishing. Do not click these links. Contact your bank through the official number/app.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'Advance Fee / Business Grant Scam: Fraudsters pose as government officers or NGOs offering business grants, MSME subsidies, or PMEGP loans. They ask for "processing fees" upfront. Legitimate government schemes never require advance payment of fees to secure a loan or grant.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'SIM Swap Fraud: Fraudsters obtain a duplicate SIM of your number by submitting forged documents to your telecom provider. They then receive your OTPs and take over your bank accounts. Warning sign: your SIM suddenly stops working. Immediately contact your telecom provider and bank.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Fake UPI Payment Request with Wrong Amount: A buyer sends a UPI collect request for the correct amount, then calls to say "I accidentally sent double — please return the extra". The initial payment is then reversed (since you have not accepted it yet), but if you "returned" money first, you lose it.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'How to verify a UPI payment is real: (1) Check your bank account balance, (2) Check your UPI app transaction history, (3) Wait for an official bank credit SMS. A transaction is confirmed only when you see the credit in your bank account — not from a screenshot or verbal confirmation.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Vishing (Voice Phishing): Fraudsters call pretending to be bank/UPI officials and use pressure tactics — "your account will be frozen in 2 hours" — to make you act quickly without thinking. Real bank officials never ask for OTP, PIN, card numbers, or CVV over the phone.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Fake Job / Business Offer Scam: Fraudsters offer "commission" for forwarding payments through your account or processing "business transactions". This is money mule fraud — you become legally liable for handling stolen funds.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'Safe UPI practices for small business owners: (1) Display only your UPI ID or static QR code to customers, (2) Verify every payment in your bank app before releasing goods, (3) Never give your QR to anyone to "top up" on your behalf, (4) Set a transaction limit in your UPI app.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Malicious App Scam: Fraudsters ask you to install an app to "claim a prize" or "activate your SIM". These apps can steal OTPs, read SMSes, or gain remote access to your phone. Only install apps from official Play Store or App Store listings.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Excessive Permission Apps: A genuine UPI app only needs SMS permission (to read OTPs) and camera (for QR scanning). If any app requests contacts, call logs, or device administrator access, do not install it.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'What to do if you are defrauded via UPI: (1) Immediately call your bank helpline to block transactions, (2) File a complaint at cybercrime.gov.in or call 1930 (National Cyber Crime Helpline), (3) Report to your UPI app — most have a "Report fraud" option in transaction history.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Fake KYC Update Scam: A message or call claims your UPI/bank KYC is expired and you must update it by clicking a link. This link leads to a fake bank website that steals your credentials. Banks send KYC update requests through registered email/post — never through unsolicited SMS links.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Social Engineering Red Flags: Be suspicious if someone (1) creates urgency ("do it right now"), (2) offers something too good to be true, (3) asks you to keep the transaction secret, (4) insists on an unusual payment method, or (5) changes the payment amount or terms at the last moment.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'Loan App Scams: Fraudulent instant-loan apps offer quick money and then charge hidden fees, threaten borrowers with fake legal notices, and access the borrower\'s contacts to harass them. Only use loans from RBI-registered NBFCs or banks. Check the RBI website for registered entities.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Two-Factor Authentication: Always enable two-factor authentication and transaction PINs on your UPI apps, banking apps, and email. Use a strong, unique UPI PIN (not your birth year, phone number, or 1234) and change it if you suspect compromise.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'Recognize Genuine UPI Payment vs Collect Request: In your UPI app, a genuine inbound payment shows "Credit" or "Received". A collect request shows "Pay" or "Request" — it requires you to authorize a debit. Always check whether you are receiving or sending before entering your PIN.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'Government Scheme Fraud: Real PMEGP, Mudra, or Stand-Up India loans are processed through banks and KVIC/DIC offices — never through WhatsApp agents or unofficial websites. Agents who claim to "get you" a government subsidy for a fee are fraudsters.',
  },
  {
    category: 'fraud',
    source: 'CERT-In Advisory',
    chunk_text: 'Marketplace Payment Fraud: When selling on WhatsApp groups or local marketplaces, a common fraud is the buyer overpaying with a cheque (which bounces) or requesting a refund of the "overpayment" via UPI. Cheque payments are not cleared for several days — wait for full clearance before refunding.',
  },
  {
    category: 'fraud',
    source: 'NPCI Advisory',
    chunk_text: 'UPI ID Verification: Before making any payment, verify the name shown against the UPI ID in your app. The app displays the registered account holder\'s name. If the name does not match the person/business you intend to pay, stop and verify separately before proceeding.',
  },
  {
    category: 'fraud',
    source: 'RBI Consumer Awareness',
    chunk_text: 'Safe Digital Payment Checklist for Small Business Owners: (1) Never share OTP or PIN with anyone, (2) Always verify payments in your own banking app — not from screenshots, (3) Ignore unsolicited calls offering to help with your payment issues, (4) Display a static QR code at your shop — never a dynamic code prepared by someone else, (5) Report fraud immediately to 1930.',
  },
];
