'use client';
import { useState, useRef, useCallback } from 'react';
import { HiOutlineUpload, HiOutlineCamera, HiOutlineDocumentSearch, HiOutlineCheckCircle, HiOutlineX, HiOutlineRefresh, HiOutlineSparkles } from 'react-icons/hi';

// Demo cheque data for testing
const DEMO_CHEQUE_DATA = {
    chequeNumber: '456789',
    chequeBank: 'State Bank of India',
    chequeBranch: 'Koramangala, Bangalore',
    chequeDate: '2026-02-25',
    amount: '50000',
    payee: 'Rahul Sharma',
    accountNumber: 'ACC-2026-001',
    ifsc: 'SBIN0001234'
};

export default function ChequeScanner({ onExtracted, onClose }) {
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [scanStatus, setScanStatus] = useState('');
    const [extractedData, setExtractedData] = useState(null);
    const [rawOcrText, setRawOcrText] = useState('');
    const [showRawText, setShowRawText] = useState(false);
    const [error, setError] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const processCanvasRef = useRef(null);

    // Generate a high-quality, OCR-friendly dummy cheque
    const generateDummyCheque = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;

        // High resolution for better OCR
        const W = 1200;
        const H = 540;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // --- White background (best for OCR) ---
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        // Very subtle background tint
        ctx.fillStyle = 'rgba(230, 245, 255, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // --- Outer border ---
        ctx.strokeStyle = '#1a3a5c';
        ctx.lineWidth = 3;
        ctx.strokeRect(12, 12, W - 24, H - 24);

        // ============================================================
        //  TOP SECTION: Bank Name + Cheque Number
        // ============================================================

        // Bank logo box
        ctx.fillStyle = '#1a3a5c';
        ctx.roundRect(35, 30, 60, 60, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('SBI', 65, 68);
        ctx.textAlign = 'left';

        // Bank name — big and clear for OCR
        ctx.fillStyle = '#1a3a5c';
        ctx.font = 'bold 28px Arial, sans-serif';
        ctx.fillText('STATE BANK OF INDIA', 115, 58);

        // Branch line
        ctx.fillStyle = '#333333';
        ctx.font = '15px Arial, sans-serif';
        ctx.fillText('Branch: KORAMANGALA, BANGALORE', 115, 82);

        // IFSC on same line but spaced
        ctx.fillText('IFSC: SBIN0001234', 500, 82);

        // Cheque Number top right
        ctx.fillStyle = '#cc0000';
        ctx.font = 'bold 18px Courier New, monospace';
        ctx.textAlign = 'right';
        ctx.fillText('No. 456789', W - 40, 55);
        ctx.textAlign = 'left';

        // Separator line
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(35, 100);
        ctx.lineTo(W - 35, 100);
        ctx.stroke();

        // ============================================================
        //  DATE (top right area, well separated)
        // ============================================================
        ctx.fillStyle = '#555555';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('Date:', 880, 135);

        // Date value in box
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.strokeRect(925, 118, 230, 28);
        ctx.fillStyle = '#111111';
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('25 / 02 / 2026', 935, 140);

        // ============================================================
        //  PAY TO line
        // ============================================================
        ctx.fillStyle = '#555555';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('Pay', 45, 185);

        // Underline for payee
        ctx.strokeStyle = '#bbbbbb';
        ctx.beginPath();
        ctx.moveTo(80, 190);
        ctx.lineTo(850, 190);
        ctx.stroke();

        // Payee name
        ctx.fillStyle = '#111111';
        ctx.font = '22px Arial, sans-serif';
        ctx.fillText('RAHUL SHARMA', 90, 185);

        // "or Bearer" text
        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial, sans-serif';
        ctx.fillText('or Bearer', 860, 185);

        // ============================================================
        //  RUPEES (amount in words)
        // ============================================================
        ctx.fillStyle = '#555555';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('Rupees', 45, 235);

        // Underline
        ctx.strokeStyle = '#bbbbbb';
        ctx.beginPath();
        ctx.moveTo(105, 240);
        ctx.lineTo(850, 240);
        ctx.stroke();

        // Amount in words
        ctx.fillStyle = '#111111';
        ctx.font = '20px Arial, sans-serif';
        ctx.fillText('FIFTY THOUSAND ONLY', 115, 235);

        // ============================================================
        //  AMOUNT BOX (right side, clearly separated from date)
        // ============================================================
        ctx.strokeStyle = '#1a3a5c';
        ctx.lineWidth = 2;
        ctx.strokeRect(920, 200, 235, 50);

        // Rupee symbol
        ctx.fillStyle = '#1a3a5c';
        ctx.font = 'bold 18px Arial, sans-serif';
        ctx.fillText('Rs.', 930, 232);

        // Amount in figures
        ctx.fillStyle = '#111111';
        ctx.font = 'bold 26px Arial, sans-serif';
        ctx.fillText('50,000/-', 975, 235);

        // ============================================================
        //  ACCOUNT NUMBER
        // ============================================================
        ctx.fillStyle = '#555555';
        ctx.font = '14px Arial, sans-serif';
        ctx.fillText('A/c No:', 45, 295);

        ctx.fillStyle = '#111111';
        ctx.font = '18px Arial, sans-serif';
        ctx.fillText('ACC-2026-001', 115, 295);

        // ============================================================
        //  SIGNATURE AREA
        // ============================================================
        ctx.strokeStyle = '#999999';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(850, 420);
        ctx.lineTo(W - 40, 420);
        ctx.stroke();

        ctx.fillStyle = '#888888';
        ctx.font = '12px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Authorized Signatory', 985, 440);
        ctx.textAlign = 'left';

        // ============================================================
        //  MICR CODE BAND (bottom)
        // ============================================================
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(25, 465, W - 50, 55);

        ctx.fillStyle = '#222222';
        ctx.font = '22px Courier New, monospace';
        ctx.fillText('456789    SBIN0001234    ACC2026001', 80, 500);

        return canvas.toDataURL('image/png');
    }, []);

    // Pre-process image for better OCR — increase contrast & convert to grayscale
    const preprocessImage = useCallback((imageSrc) => {
        return new Promise((resolve) => {
            const canvas = processCanvasRef.current;
            if (!canvas) { resolve(imageSrc); return; }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Scale up small images
                const scale = Math.max(1, 1500 / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');

                // Draw scaled image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Get pixel data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Convert to high-contrast grayscale
                for (let i = 0; i < data.length; i += 4) {
                    // Luminance grayscale
                    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // Increase contrast
                    gray = ((gray / 255 - 0.5) * 1.8 + 0.5) * 255;
                    gray = Math.max(0, Math.min(255, gray));

                    // Mild thresholding — push light grays to white, dark grays to black
                    if (gray > 180) gray = 255;
                    else if (gray < 80) gray = 0;

                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = () => resolve(imageSrc);
            img.src = imageSrc;
        });
    }, []);

    // Handle drag events
    const handleDrag = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    // Handle file selection
    const handleFile = (file) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file (JPG, PNG, etc.)');
            return;
        }
        setError(null);
        setExtractedData(null);
        setRawOcrText('');
        setImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview(reader.result);
        reader.readAsDataURL(file);
    };

    // =====================================================
    //  ROBUST OCR TEXT PARSER
    // =====================================================
    const parseOcrText = (text) => {
        console.log('=== RAW OCR TEXT ===');
        console.log(text);
        console.log('===================');

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

        // ----- 1. CHEQUE NUMBER -----
        // Look for "No." or "No" followed by digits
        let chequeNum = null;
        // Pattern: "No. 456789" or "No 456789" or "No.456789"
        const noPatterns = [
            /No\.?\s*(\d{5,8})/i,
            /Cheque\s*(?:No\.?|Number|#)\s*:?\s*(\d{5,8})/i,
        ];
        for (const pat of noPatterns) {
            const m = fullText.match(pat);
            if (m) { chequeNum = m[1]; break; }
        }

        // If not found, look in the MICR band (bottom area) — first 6-digit number
        if (!chequeNum) {
            // The MICR band typically has the cheque number as the first group of digits
            const micrLine = lines.slice(-3).join(' '); // last 3 lines
            const micrMatch = micrLine.match(/(\d{6})/);
            if (micrMatch) chequeNum = micrMatch[1];
        }
        if (chequeNum) data.chequeNumber = chequeNum;

        // ----- 2. BANK NAME -----
        const bankNames = [
            'STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'AXIS BANK',
            'PUNJAB NATIONAL BANK', 'BANK OF BARODA', 'CANARA BANK', 'UNION BANK OF INDIA',
            'INDIAN OVERSEAS BANK', 'BANK OF INDIA', 'KOTAK MAHINDRA BANK', 'YES BANK',
            'INDUSIND BANK', 'FEDERAL BANK', 'IDBI BANK', 'UCO BANK', 'CENTRAL BANK OF INDIA',
            'INDIAN BANK', 'BANK OF MAHARASHTRA', 'KARNATAKA BANK', 'SOUTH INDIAN BANK',
        ];

        for (const bank of bankNames) {
            // Allow OCR artifacts — match with some tolerance
            const bankWords = bank.split(' ');
            const bankRegex = new RegExp(bankWords.join('\\s+'), 'i');
            if (bankRegex.test(upperText)) {
                // Title case
                data.chequeBank = bank.split(' ').map(w =>
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                ).join(' ');
                break;
            }
        }

        // Fallback: try partial match
        if (!data.chequeBank) {
            if (/STATE\s*BANK/i.test(upperText)) data.chequeBank = 'State Bank Of India';
            else if (/HDFC/i.test(upperText)) data.chequeBank = 'HDFC Bank';
            else if (/ICICI/i.test(upperText)) data.chequeBank = 'ICICI Bank';
            else if (/AXIS/i.test(upperText)) data.chequeBank = 'Axis Bank';
            else if (/PUNJAB\s*NATIONAL/i.test(upperText)) data.chequeBank = 'Punjab National Bank';
            else if (/KOTAK/i.test(upperText)) data.chequeBank = 'Kotak Mahindra Bank';
        }

        // ----- 3. IFSC CODE -----
        // IFSC is always 4 letters followed by 0 and 6 digits (total 11 chars)
        const ifscPatterns = [
            /IFSC\s*:?\s*([A-Z]{4}[0O]\d{6})/i,
            /([A-Z]{4}0\d{6})/,
            // OCR might read 0 as O
            /([A-Z]{4}[0O]\d{6})/i,
        ];
        for (const pat of ifscPatterns) {
            const m = fullText.match(pat);
            if (m) {
                data.ifsc = m[1].toUpperCase().replace(/O(?=\d{6}$)/, '0');
                break;
            }
        }

        // Also check MICR band for IFSC-like pattern
        if (!data.ifsc) {
            const micrText = lines.slice(-3).join(' ');
            const micrIfsc = micrText.match(/([A-Z]{4}0\d{6})/i);
            if (micrIfsc) data.ifsc = micrIfsc[1].toUpperCase();
        }

        // ----- 4. BRANCH -----
        const branchPatterns = [
            /Branch\s*:?\s*([A-Za-z][A-Za-z\s,.-]+?)(?:\s{2,}|IFSC|$|\n)/im,
            /Branch\s*:?\s*(.+?)(?:\n|IFSC)/im,
        ];
        for (const pat of branchPatterns) {
            const m = fullText.match(pat);
            if (m) {
                let branch = m[1].trim();
                // Clean up trailing punctuation
                branch = branch.replace(/[,.\s]+$/, '');
                if (branch.length > 2 && branch.length < 80) {
                    data.chequeBranch = branch;
                    break;
                }
            }
        }

        // ----- 5. DATE -----
        const datePatterns = [
            // DD / MM / YYYY with various separators
            /Date\s*:?\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{4})/i,
            // Without "Date:" prefix — any DD/MM/YYYY pattern
            /(\d{1,2})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{4})/,
            // DD MM YYYY with spaces
            /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/,
        ];
        for (const pat of datePatterns) {
            const m = fullText.match(pat);
            if (m) {
                let [, day, month, year] = m;
                day = day.padStart(2, '0');
                month = month.padStart(2, '0');
                // Sanity check
                if (parseInt(month) <= 12 && parseInt(day) <= 31 && year.length === 4) {
                    data.chequeDate = `${year}-${month}-${day}`;
                    break;
                }
            }
        }

        // ----- 6. AMOUNT (in figures) -----
        const amountPatterns = [
            // Printed check amounts often use asterisks
            /[\*#]+\s*([\d,]+)\s*[\*#]+/i,
            // Rs. 50,000/- or Rs 50000
            /Rs\.?\s*([\d,]+)\s*\/?-?/i,
            // Amount with "Rupees" or "₹" right before it
            /(?:Rupees|₹)\s*([\d,]+)/i,
            // Inside amount box — just the number, followed by /-
            /([\d]{1,3}(?:,\d{2,3})*)\s*\/?-/,
            // Any standalone large number with commas
            /\b(\d{1,3}(?:,\d{2,3})+)\b/,
            // Number at the end of a line, or by itself
            /(?:^|\s)(\d{3,8})(?:\s*\/?-|$)/m
        ];
        for (const pat of amountPatterns) {
            const m = fullText.match(pat);
            if (m) {
                const cleaned = m[1].replace(/,/g, '');
                // Only accept if it's a reasonable cheque amount (>= 100)
                if (parseInt(cleaned) >= 100) {
                    data.amount = cleaned;
                    break;
                }
            }
        }

        // Fallback: try to parse amount from words
        if (!data.amount) {
            const amountWords = {
                'ONE THOUSAND': '1000', 'TWO THOUSAND': '2000', 'FIVE THOUSAND': '5000',
                'TEN THOUSAND': '10000', 'FIFTEEN THOUSAND': '15000', 'TWENTY THOUSAND': '20000',
                'TWENTY FIVE THOUSAND': '25000', 'THIRTY THOUSAND': '30000',
                'FORTY THOUSAND': '40000', 'FIFTY THOUSAND': '50000',
                'SEVENTY FIVE THOUSAND': '75000', 'ONE LAKH': '100000', 'ONE HUNDRED THOUSAND': '100000',
                'TWO LAKH': '200000', 'FIVE LAKH': '500000', 'TEN LAKH': '1000000',
            };
            for (const [word, val] of Object.entries(amountWords)) {
                if (upperText.includes(word)) {
                    data.amount = val;
                    break;
                }
            }
        }

        // ----- 7. PAYEE NAME -----
        const payeePatterns = [
            // Look for Date followed by the name on the next line (very reliable position, single line only)
            /(?:Date|date)\s*:?\s*[\d]{1,2}[\/\-\.][\d]{1,2}[\/\-\.][\d]{2,4}\s*\n+([A-Za-z \t.,&()'-]{3,60})/i,
            // Extract from "Pay" up to "or Bearer/Order" - handling OCR misread of 'Pay' as 'ss' or '55'
            /(?:Pay|Pey|Poy|Pa|P.y|ss|55|ay)\s*(?:to|t0)?\s*[:\-\|]?\s*([A-Za-z0-9 \t.,&()'-]{3,80}?)\s+(?:or\s+Bearer|Bearer|or\s+Order|Order)/i,
            // Fallback match looking backward from 'or bearer'
            /([A-Za-z0-9 \t.,&()'-]{3,80}?)\s+(?:or\s+Bearer|Bearer|or\s+Order|Order)/i,
            // Extract from "Pay" until Rupees/₹/upees or newline
            /(?:Pay|Pey|Poy|Pa|P.y|ss|55|ay)\s*(?:to|t0)?\s*[:\-\|]?\s*([A-Za-z0-9 \t.,&()'-]{3,80}?)(?:Rupees|upees|pees|₹|\n|$)/i,
            // Strict word after Pay, handling spaces
            /(?:Pay|Pey|Poy|Pa|P.y|ss|55|ay)[ \t]+([A-Za-z0-9]+(?:[ \t]+[A-Za-z0-9.,&()'-]+){1,5})/i,
            // Extremely aggressive: look for anything that looks like a name near "Pay"
            /(?:Pay|Pey|Poy|Pa|P.y|ss|55|ay)\s*:?[ \t]*([A-Za-z \t.,]{3,50})/i
        ];
        for (const pat of payeePatterns) {
            const m = fullText.match(pat);
            if (m && m[1]) {
                let payee = m[1].trim();
                // If it accidentally included 'Pay ', 'to ', remove it
                payee = payee.replace(/^(?:pay|to|t0|pey|poy|pa|ss|55|-)\s+/ig, '');

                // Remove trailing noise
                payee = payee.replace(/\s*(?:or|bearer|Order|only|Pay|Rupees|upees|₹|Rs\.?|\s+$)/gi, '').trim();
                // Additional cleanup to remove double spaces
                payee = payee.replace(/\s{2,}/g, ' ');

                // Check again after cleaning
                if (payee.length >= 3 && payee.length <= 80 && !['rupees', 'upees', 'bearer', 'order', 'only'].includes(payee.toLowerCase())) {
                    data.payee = payee;
                    break;
                }
            }
        }

        // ----- 8. ACCOUNT NUMBER -----
        const accPatterns = [
            /A\/?c\s*No\.?\s*:?\s*([A-Z0-9][\w\-]+)/i,
            /(ACC[\-\s]?\d{4}[\-\s]?\d{2,4})/i,
            /Account\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9][\w\-]+)/i,
        ];
        for (const pat of accPatterns) {
            const m = fullText.match(pat);
            if (m) {
                data.accountNumber = m[1].trim();
                break;
            }
        }

        // Also check MICR for account number pattern like ACC2026001
        if (!data.accountNumber) {
            const micrText = lines.slice(-3).join(' ');
            const accMicr = micrText.match(/(ACC\d+)/i);
            if (accMicr) data.accountNumber = accMicr[1];
        }

        console.log('=== PARSED DATA ===');
        console.log(data);
        console.log('===================');

        return data;
    };

    // Scan cheque using Tesseract.js with preprocessing
    const scanCheque = async (imgSrc) => {
        setScanning(true);
        setScanProgress(0);
        setScanStatus('Pre-processing image...');
        setError(null);
        setRawOcrText('');

        try {
            // Step 1: Pre-process the image
            setScanProgress(5);
            const processedImg = await preprocessImage(imgSrc);

            setScanStatus('Loading OCR engine...');
            setScanProgress(10);

            const Tesseract = (await import('tesseract.js')).default;

            const result = await Tesseract.recognize(
                processedImg,
                'eng',
                {
                    logger: (m) => {
                        if (m.status === 'recognizing text') {
                            setScanProgress(20 + Math.round(m.progress * 70));
                            setScanStatus('Scanning cheque text...');
                        } else if (m.status === 'loading language traineddata') {
                            setScanStatus('Loading language data...');
                            setScanProgress(12);
                        } else if (m.status === 'initializing api') {
                            setScanStatus('Initializing OCR...');
                            setScanProgress(15);
                        }
                    }
                }
            );

            setScanStatus('Analyzing cheque fields...');
            setScanProgress(92);

            setRawOcrText(result.data.text);
            const extracted = parseOcrText(result.data.text);
            setExtractedData(extracted);
            setScanProgress(100);
            setScanStatus('Scan complete!');
        } catch (err) {
            console.error('OCR Error:', err);
            setError('Failed to scan cheque. Please try again or enter details manually.');
        } finally {
            setScanning(false);
        }
    };

    // Handle scan button click
    const handleScan = () => {
        if (imagePreview) {
            scanCheque(imagePreview);
        }
    };

    // Handle demo scan — uses dummy data directly
    const handleDemoScan = () => {
        setScanning(true);
        setScanProgress(0);
        setScanStatus('Generating sample cheque...');

        const dummyUrl = generateDummyCheque();
        setImagePreview(dummyUrl);

        // Simulate scanning with stepped progress
        const steps = [
            { progress: 8, status: 'Pre-processing image...', delay: 200 },
            { progress: 15, status: 'Loading OCR engine...', delay: 500 },
            { progress: 35, status: 'Scanning cheque text...', delay: 800 },
            { progress: 55, status: 'Scanning cheque text...', delay: 1100 },
            { progress: 75, status: 'Scanning cheque text...', delay: 1400 },
            { progress: 92, status: 'Analyzing cheque fields...', delay: 1700 },
            { progress: 100, status: 'Scan complete!', delay: 2000 },
        ];

        steps.forEach(({ progress, status, delay }) => {
            setTimeout(() => {
                setScanProgress(progress);
                setScanStatus(status);
                if (progress === 100) {
                    setExtractedData(DEMO_CHEQUE_DATA);
                    setScanning(false);
                }
            }, delay);
        });
    };

    // Download dummy cheque as PNG
    const downloadDummyCheque = () => {
        const url = generateDummyCheque();
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'sample_cheque_SBI.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };

    // Apply extracted data to parent form
    const applyExtractedData = () => {
        if (extractedData && onExtracted) {
            onExtracted(extractedData);
        }
    };

    // Reset scanner state
    const resetScanner = () => {
        setImage(null);
        setImagePreview(null);
        setScanning(false);
        setScanProgress(0);
        setScanStatus('');
        setExtractedData(null);
        setRawOcrText('');
        setShowRawText(false);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-200">
                            <HiOutlineDocumentSearch className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-800">Cheque Scanner</h2>
                            <p className="text-xs text-gray-400">Upload or scan cheque to auto-fill details</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all">
                        <HiOutlineX className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Quick Actions */}
                    {!imagePreview && !extractedData && (
                        <div className="flex gap-3 mb-2">
                            <button
                                onClick={handleDemoScan}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all shadow-lg shadow-purple-200 text-sm font-medium"
                            >
                                <HiOutlineSparkles className="w-4 h-4" />
                                Demo Scan (Test)
                            </button>
                        </div>
                    )}

                    {/* Upload Area */}
                    {!imagePreview && !extractedData && (
                        <div
                            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${dragActive
                                ? 'border-amber-400 bg-amber-50 scale-[1.02]'
                                : 'border-gray-200 hover:border-amber-300 hover:bg-amber-50/50'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${dragActive ? 'bg-amber-100 scale-110' : 'bg-gray-100'
                                    }`}>
                                    <HiOutlineUpload className={`w-8 h-8 ${dragActive ? 'text-amber-500' : 'text-gray-400'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">
                                        {dragActive ? 'Drop your cheque here!' : 'Drag & drop cheque image here'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">or click to browse • JPG, PNG, WEBP</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Image Preview */}
                    {imagePreview && (
                        <div className="space-y-3">
                            <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                                <img
                                    src={imagePreview}
                                    alt="Cheque preview"
                                    className="w-full h-auto object-contain max-h-64"
                                />
                                {scanning && (
                                    <div className="absolute inset-0 overflow-hidden">
                                        <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent animate-bounce" style={{ animationDuration: '1.2s' }} />
                                        <div className="absolute inset-0 bg-amber-400/5" />
                                    </div>
                                )}
                                {!scanning && !extractedData && (
                                    <button
                                        onClick={resetScanner}
                                        className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-lg shadow text-gray-500 hover:text-red-500 transition-all"
                                    >
                                        <HiOutlineX className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            {/* Scan Progress */}
                            {scanning && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500 flex items-center gap-1.5">
                                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                            {scanStatus}
                                        </span>
                                        <span className="font-mono text-amber-600 font-medium">{scanProgress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500 ease-out"
                                            style={{ width: `${scanProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Scan Button */}
                            {!scanning && !extractedData && (
                                <button
                                    onClick={handleScan}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-orange-200 font-medium"
                                >
                                    <HiOutlineCamera className="w-5 h-5" />
                                    Scan Cheque
                                </button>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    {/* Extracted Data */}
                    {extractedData && (
                        <div className="space-y-3 animate-fade-in">
                            <div className="flex items-center gap-2 text-green-600 mb-1">
                                <HiOutlineCheckCircle className="w-5 h-5" />
                                <span className="text-sm font-medium">Cheque details extracted successfully!</span>
                            </div>

                            <div className="bg-gradient-to-br from-gray-50 to-amber-50/30 rounded-xl border border-gray-200 p-4 space-y-3">
                                {[
                                    { label: 'Cheque Number', value: extractedData.chequeNumber, key: 'chequeNumber' },
                                    { label: 'Bank Name', value: extractedData.chequeBank, key: 'chequeBank' },
                                    { label: 'Branch', value: extractedData.chequeBranch, key: 'chequeBranch' },
                                    { label: 'IFSC Code', value: extractedData.ifsc, key: 'ifsc' },
                                    { label: 'Date', value: extractedData.chequeDate, key: 'chequeDate' },
                                    { label: 'Amount', value: extractedData.amount ? `₹${Number(extractedData.amount).toLocaleString('en-IN')}` : '', key: 'amount' },
                                    { label: 'Payee Name', value: extractedData.payee, key: 'payee' },
                                    { label: 'Account Number', value: extractedData.accountNumber, key: 'accountNumber' },
                                ].map(({ label, value, key }) => (
                                    <div key={key} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0">
                                        <span className="text-xs text-gray-500 font-medium">{label}</span>
                                        <span className={`text-sm font-medium ${value ? 'text-gray-800' : 'text-gray-300 italic'}`}>
                                            {value || 'Not detected'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Toggle Raw OCR Text (debug) */}
                            {rawOcrText && (
                                <div>
                                    <button
                                        onClick={() => setShowRawText(!showRawText)}
                                        className="text-xs text-gray-400 hover:text-gray-600 underline"
                                    >
                                        {showRawText ? 'Hide' : 'Show'} raw OCR text
                                    </button>
                                    {showRawText && (
                                        <pre className="mt-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                                            {rawOcrText}
                                        </pre>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={resetScanner}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all text-sm font-medium"
                                >
                                    <HiOutlineRefresh className="w-4 h-4" />
                                    Scan Again
                                </button>
                                <button
                                    onClick={applyExtractedData}
                                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg shadow-green-200 text-sm font-medium"
                                >
                                    <HiOutlineCheckCircle className="w-4 h-4" />
                                    Auto-Fill Form
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden canvases */}
                <canvas ref={canvasRef} className="hidden" />
                <canvas ref={processCanvasRef} className="hidden" />
            </div>
        </div>
    );
}
