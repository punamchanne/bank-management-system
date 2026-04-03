// Test script to verify handwritten cheque OCR improvements
// This simulates the parsing logic for handwritten text recognition

// Sample OCR text from handwritten cheques (simulated)
const sampleHandwrittenOCR = `
GANGAPUR RD. BRANCH,NASHIK -422013
RTGS / NEFT IFSC CODE: BARB0GANNAS
Pay JAYESH GORAKH KANDE
Rupees FIFTEEN THOUSANDS ONLY
A/c No. 278501000151114
JAYESH GORAKH KANDE
₹ 15,000/-
28/02/2013
SB/2023/SE
GANNAS
`;

const usStyleChequeOCR = `
Jane Doe
123 Main St
Anywhere US 10111
Date 07/01/2018
PAY TO THE ORDER OF ACME Grocery Shop
EIGHT AND 15/100 DOLLARS
Your Bank
456 Main St
MEMO Lunch w/Friends
Jane Doe
$8159
`;

const enhancedParseOcrText = (text) => {
    console.log('=== TESTING ENHANCED OCR PARSING ===');
    console.log('Input text:', text);
    console.log('=====================================');

    const fullText = text.replace(/\r/g, '');
    const upperText = fullText.toUpperCase();
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);

    let data = {
        chequeNumber: '',
        chequeBank: '',
        chequeBranch: '',
        chequeDate: '',
        amount: '',
        payee: '',
        accountNumber: '',
        ifsc: ''
    };

    // Enhanced Cheque Number Detection
    let chequeNum = null;
    const chequeNumberPatterns = [
        /No\.?\s*(\d{5,8})/i,
        /Cheque\s*(?:No\.?|Number|#)\s*:?\s*(\d{5,8})/i,
        /N0\.?\s*(\d{5,8})/i,
        /Mo\.?\s*(\d{5,8})/i,
        /(\d{6,8})\s*$/m,
        /CBS\s*(\d{6,8})/i,
    ];

    for (const pat of chequeNumberPatterns) {
        const m = fullText.match(pat);
        if (m) {
            chequeNum = m[1];
            console.log('Found cheque number:', chequeNum);
            break;
        }
    }
    if (chequeNum) data.chequeNumber = chequeNum;

    // Enhanced Bank Detection
    const bankPatterns = [
        { pattern: /BARODA|BOB|BARB0/i, name: 'Bank Of Baroda' },  // Added BARB0 for IFSC
        { pattern: /STATE\s*BANK|SBI/i, name: 'State Bank Of India' },
        { pattern: /HDFC/i, name: 'HDFC Bank' },
        { pattern: /(\w+)\s+BANK/i, name: null }
    ];

    for (const { pattern, name } of bankPatterns) {
        const match = upperText.match(pattern);
        if (match) {
            if (name) {
                data.chequeBank = name;
                console.log('Found bank:', name);
            } else if (match[1]) {
                data.chequeBank = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() + ' Bank';
                console.log('Found bank (generic):', data.chequeBank);
            }
            break;
        }
    }

    // Enhanced IFSC Detection
    const ifscPatterns = [
        /IFSC\s*CODE\s*:?\s*([A-Z]{4}[0O][A-Z0-9]{6})/i,  // Fixed for BARB0GANNAS
        /IFSC\s*:?\s*([A-Z]{4}[0O]\d{6})/i,
        /([A-Z]{4}0[A-Z0-9]{6})/i,  // More flexible for mixed alphanumeric
        /([A-Z]{4}[0O]\d{6})/i,
        /BARB0[A-Z0-9]{6}/i,  // Specific for Bank of Baroda
    ];

    for (const pat of ifscPatterns) {
        const m = fullText.match(pat);
        if (m) {
            let ifsc = m[1] ? m[1] : m[0];
            ifsc = ifsc.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (ifsc.length === 11 && /[A-Z]{4}[O]\d{6}/.test(ifsc)) {
                ifsc = ifsc.substring(0, 4) + '0' + ifsc.substring(5);
            }
            data.ifsc = ifsc;
            console.log('Found IFSC:', ifsc);
            break;
        }
    }

    // Enhanced Date Detection
    const datePatterns = [
        /Date\s*:?\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{4})/i,
        /(\d{1,2})\s*[\/\-.\\]\s*(\d{1,2})\s*[\/\-.\\]\s*(\d{4})/,
        /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/,
    ];

    for (const pat of datePatterns) {
        const m = fullText.match(pat);
        if (m) {
            let [, day, month, year] = m;
            day = day.padStart(2, '0');
            month = month.padStart(2, '0');
            if (parseInt(month) <= 12 && parseInt(day) <= 31) {
                data.chequeDate = `${year}-${month}-${day}`;
                console.log('Found date:', data.chequeDate);
                break;
            }
        }
    }

    // Enhanced Amount Detection
    const amountPatterns = [
        /Rs\.?\s*([\d,]+)\s*\/?-?/i,
        /₹\s*([\d,]+)/i,
        /\$\s*([\d,]+)/i,
        /(\d+(?:,\d{2,3})*)\s*[\/\-]/,
        /\b(\d{3,8})\b/,
    ];

    for (const pat of amountPatterns) {
        const m = fullText.match(pat);
        if (m) {
            const cleaned = m[1].replace(/,/g, '');
            if (parseInt(cleaned) >= 100) {
                data.amount = cleaned;
                console.log('Found amount:', cleaned);
                break;
            }
        }
    }

    // Enhanced amount words
    const amountWords = {
        'FIFTEEN THOUSAND': '15000',
        'FIFTEEN THOUSANDS': '15000',
        'EIGHT AND 15': '815',
        'FIFTY THOUSAND': '50000',
    };

    for (const [word, val] of Object.entries(amountWords)) {
        if (upperText.includes(word)) {
            if (!data.amount) data.amount = val;
            console.log('Found amount from words:', val);
            break;
        }
    }

    // Enhanced Payee Detection
    const payeePatterns = [
        /(?:Pay|PAY)\s*(?:to|TO)?\s*(?:THE\s+ORDER\s+OF\s+)?([A-Za-z][A-Za-z0-9 \t.,&()'\-]{2,50}?)(?:\s*or\s*Bearer|Bearer|Rupees|₹|\n|$)/i,
        /([A-Z][A-Z\s]{3,50})\s+(?:or\s+Bearer|Bearer)/i,
        /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,4})\b/,
    ];

    for (const pat of payeePatterns) {
        const m = fullText.match(pat);
        if (m && m[1]) {
            let payee = m[1].trim();
            payee = payee.replace(/^(?:pay|to|THE|ORDER|OF)\s+/ig, '');
            payee = payee.replace(/\s*(?:or|bearer|Order|Rupees|₹|Rs\.?|\s+$)/gi, '').trim();
            payee = payee.replace(/\s{2,}/g, ' ');

            if (payee.length >= 3 && payee.length <= 50) {
                data.payee = payee;
                console.log('Found payee:', payee);
                break;
            }
        }
    }

    // Account Number Detection
    const accPatterns = [
        /A\/?c\s*No\.?\s*:?\s*([A-Z0-9][\w\-]+)/i,
        /(ACC[\-\s]?\d{4}[\-\s]?\d{2,4})/i,
        /(\d{10,15})/,
    ];

    for (const pat of accPatterns) {
        const m = fullText.match(pat);
        if (m) {
            data.accountNumber = m[1].trim();
            console.log('Found account number:', data.accountNumber);
            break;
        }
    }

    console.log('\n=== FINAL EXTRACTED DATA ===');
    console.log(data);
    console.log('============================\n');

    return data;
};

// Test with different handwritten samples
console.log('Testing Bank of Baroda handwritten cheque:');
enhancedParseOcrText(sampleHandwrittenOCR);

console.log('\n' + '='.repeat(60) + '\n');

console.log('Testing US-style handwritten cheque:');
enhancedParseOcrText(usStyleChequeOCR);