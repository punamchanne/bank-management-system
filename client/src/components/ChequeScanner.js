'use client';
import { useState, useRef, useCallback } from 'react';
import { HiOutlineUpload, HiOutlineCamera, HiOutlineDocumentSearch, HiOutlineCheckCircle, HiOutlineX, HiOutlineRefresh, HiOutlineSparkles, HiOutlineCog } from 'react-icons/hi';
import { extractChequeDataWithAI, getAvailableAPIs } from '../lib/aiOcrAPI';

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

    // Internal AI OCR state (no UI configuration)
    const [aiProcessing, setAiProcessing] = useState(false);

    // Auto-detect available AI APIs from environment
    const hasAIAvailable = () => {
        const apis = getAvailableAPIs();
        console.log('Checking AI availability:', apis);
        return apis.gemini || apis.openai || apis.googleCloud;
    };




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

    // AI OCR scanning (internal - no UI configuration)
    const scanChequeWithAI = async (imgSrc) => {
        setScanning(true);
        setAiProcessing(true);
        setScanProgress(0);
        setScanStatus('🤖 AI OCR - Initializing...');
        setError(null);
        setRawOcrText('Initializing AI OCR...\n');

        try {
            // Log available APIs for debugging
            const availableAPIs = getAvailableAPIs();
            console.log('Available AI APIs:', availableAPIs);

            // Show API status in raw text area for debugging
            let debugLog = '=== AI OCR Debug Log ===\n\n';
            debugLog += `APIs Available:\n`;
            debugLog += `  - Gemini: ${availableAPIs.gemini ? '✅ Yes' : '❌ No'}\n`;
            debugLog += `  - Google Cloud: ${availableAPIs.googleCloud ? '✅ Yes' : '❌ No'}\n`;
            debugLog += `  - OpenAI: ${availableAPIs.openai ? '✅ Yes' : '❌ No'}\n\n`;
            setRawOcrText(debugLog);

            if (!availableAPIs.gemini && !availableAPIs.googleCloud && !availableAPIs.openai) {
                throw new Error('No AI API keys found! Check .env.local file');
            }

            // Step 1: Analyze image
            setScanProgress(10);
            setScanStatus('🤖 Preparing image for AI analysis...');

            // Step 2: Auto-select best available API
            let selectedAPI = 'gemini';
            if (availableAPIs.gemini) {
                selectedAPI = 'gemini';
            } else if (availableAPIs.googleCloud) {
                selectedAPI = 'google-cloud';
            } else if (availableAPIs.openai) {
                selectedAPI = 'openai';
            }

            debugLog += `Selected API: ${selectedAPI.toUpperCase()}\n`;
            debugLog += `Processing...\n\n`;
            setRawOcrText(debugLog);

            setScanStatus(`🤖 Sending image to ${selectedAPI.toUpperCase()} for analysis...`);
            setScanProgress(30);

            // Step 3: Process with AI OCR
            const result = await extractChequeDataWithAI(imgSrc, {
                primaryAPI: selectedAPI,
                enableFallback: true
            });

            console.log('AI OCR Result:', result);
            setScanProgress(80);

            if (result.success) {
                // Convert AI result format to our component format
                const extractedFields = {
                    chequeNumber: result.data.chequeNumber || '',
                    chequeBank: result.data.bankName || '',
                    chequeBranch: result.data.branchName || '',
                    chequeDate: result.data.date || '',
                    amount: result.data.amount || '',
                    payee: result.data.payeeName || '',
                    accountNumber: result.data.accountNumber || '',
                    ifsc: result.data.ifscCode || ''
                };

                console.log('Extracted fields:', extractedFields);

                debugLog += `✅ SUCCESS - Used: ${result.api}\n`;
                debugLog += `Fields extracted: ${result.fieldCount}/8\n\n`;
                debugLog += `--- Extracted Data ---\n`;
                debugLog += JSON.stringify(result.data, null, 2);
                setRawOcrText(debugLog);

                setScanStatus(`✅ AI extraction complete! Used ${result.api}, extracted ${result.fieldCount}/8 fields`);
                setExtractedData(extractedFields);
                setScanProgress(100);
                setScanning(false);

            } else {
                // Fallback to Enhanced Tesseract if AI fails
                console.error('AI OCR failed:', result.error);
                debugLog += `❌ AI OCR FAILED: ${result.error}\n`;
                debugLog += `Falling back to Tesseract OCR...\n`;
                setRawOcrText(debugLog);

                setScanStatus(`⚠️ AI failed: ${result.error}. Using Tesseract...`);
                setScanProgress(85);
                setAiProcessing(false);
                await scanChequeWithTesseract(imgSrc);
            }

        } catch (error) {
            console.error('AI OCR Error:', error);
            setRawOcrText(`❌ ERROR: ${error.message}\n\nFalling back to Tesseract OCR...`);
            setScanStatus(`⚠️ Error: ${error.message}. Using Tesseract...`);
            setScanProgress(85);
            setAiProcessing(false);

            // Fallback to Tesseract
            await scanChequeWithTesseract(imgSrc);
        } finally {
            setAiProcessing(false);
        }
    };



    const preprocessImage = useCallback((imageSrc) => {
        return new Promise((resolve) => {
            const canvas = processCanvasRef.current;
            if (!canvas) { resolve(imageSrc); return; }

            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Higher resolution for handwritten text (min 2000px width)
                const scale = Math.max(1, 2000 / img.width);
                canvas.width = img.width * scale;
                canvas.height = img.height * scale;
                const ctx = canvas.getContext('2d');

                // Draw scaled image
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                // Get pixel data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                // Advanced preprocessing for handwritten text
                for (let i = 0; i < data.length; i += 4) {
                    // Enhanced luminance calculation
                    let gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

                    // Adaptive contrast enhancement for handwritten text
                    // More aggressive enhancement for better pen stroke detection
                    gray = ((gray / 255 - 0.5) * 2.2 + 0.5) * 255;
                    gray = Math.max(0, Math.min(255, gray));

                    // Adaptive thresholding for handwritten text
                    // Lower threshold to capture lighter pen strokes
                    if (gray > 160) gray = 255;       // More sensitive to light backgrounds
                    else if (gray < 95) gray = 0;     // Better capture of light handwriting
                    else {
                        // Intermediate values - enhance based on local context
                        gray = gray < 128 ? 0 : 255;
                    }

                    data[i] = gray;
                    data[i + 1] = gray;
                    data[i + 2] = gray;
                }

                // Apply noise reduction using simple median filter
                const processedData = new Uint8ClampedArray(data);
                const width = canvas.width;
                const height = canvas.height;

                for (let y = 1; y < height - 1; y++) {
                    for (let x = 1; x < width - 1; x++) {
                        const idx = (y * width + x) * 4;

                        // Get 3x3 neighborhood values
                        const neighbors = [];
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                const nIdx = ((y + dy) * width + (x + dx)) * 4;
                                neighbors.push(data[nIdx]);
                            }
                        }

                        // Apply median filter for noise reduction
                        neighbors.sort((a, b) => a - b);
                        const median = neighbors[4]; // middle value of 9 elements

                        processedData[idx] = median;
                        processedData[idx + 1] = median;
                        processedData[idx + 2] = median;
                    }
                }

                // Apply the processed data
                const finalImageData = new ImageData(processedData, width, height);
                ctx.putImageData(finalImageData, 0, 0);

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

        // ----- 1. CHEQUE NUMBER (Enhanced for handwritten variations) -----
        let chequeNum = null;

        // Enhanced patterns for handwritten cheque numbers
        const chequeNumberPatterns = [
            // Standard "No." patterns with variations
            /No\.?\s*(\d{5,8})/i,
            /Cheque\s*(?:No\.?|Number|#)\s*:?\s*(\d{5,8})/i,

            // Handwritten variations (OCR often misreads)
            /N0\.?\s*(\d{5,8})/i, // 0 instead of o
            /Mo\.?\s*(\d{5,8})/i, // M instead of N
            /N[oO]\.?\s*(\d{5,8})/i, // o/O variations

            // Top-right corner number patterns (common placement)
            /(\d{6,8})\s*$/m, // End of line
            /^.*?(\d{6,8})\s*$/m, // Any line ending with 6-8 digits

            // CBS or other prefixes (seen in Bank of Baroda)
            /CBS\s*(\d{6,8})/i,
            /(?:CBS|SBS|DBS)\s*[:\-]?\s*(\d{6,8})/i,
        ];

        for (const pat of chequeNumberPatterns) {
            const m = fullText.match(pat);
            if (m) { chequeNum = m[1]; break; }
        }

        // Enhanced MICR band detection
        if (!chequeNum) {
            const micrLines = lines.slice(-4); // Check last 4 lines
            for (const line of micrLines) {
                // MICR typically has cheque number as first group of 6+ digits
                const micrMatch = line.match(/(\d{6,8})/);
                if (micrMatch) {
                    chequeNum = micrMatch[1];
                    break;
                }
            }
        }

        // Look in top area for any 6-8 digit number (fallback)
        if (!chequeNum) {
            const topLines = lines.slice(0, 5); // First 5 lines
            for (const line of topLines) {
                const topMatch = line.match(/(\d{6,8})/);
                if (topMatch) {
                    chequeNum = topMatch[1];
                    break;
                }
            }
        }

        if (chequeNum) data.chequeNumber = chequeNum;

        // ----- 2. BANK NAME (Enhanced with more banks and OCR variations) -----
        const bankNames = [
            // Major Indian Banks
            'STATE BANK OF INDIA', 'HDFC BANK', 'ICICI BANK', 'AXIS BANK',
            'PUNJAB NATIONAL BANK', 'BANK OF BARODA', 'CANARA BANK', 'UNION BANK OF INDIA',
            'INDIAN OVERSEAS BANK', 'BANK OF INDIA', 'KOTAK MAHINDRA BANK', 'YES BANK',
            'INDUSIND BANK', 'FEDERAL BANK', 'IDBI BANK', 'UCO BANK', 'CENTRAL BANK OF INDIA',
            'INDIAN BANK', 'BANK OF MAHARASHTRA', 'KARNATAKA BANK', 'SOUTH INDIAN BANK',
            'CORPORATION BANK', 'SYNDICATE BANK', 'ORIENTAL BANK OF COMMERCE',
            'ALLAHABAD BANK', 'ANDHRA BANK', 'VIJAYA BANK', 'DENA BANK',

            // International Banks (for sample cheques)
            'CHASE BANK', 'WELLS FARGO', 'BANK OF AMERICA', 'CITIBANK',
            'HSBC', 'STANDARD CHARTERED', 'DEUTSCHE BANK',

            // OCR Variations for common banks
            'STATS BANK OF INDIA', 'STATE BAMK OF INDIA', 'STATR BANK OF INDIA',
            'HDFC BAMK', 'HDPC BANK', 'HDFG BANK',
            'ICIGI BANK', 'IGICI BANK', 'ICIGI BAMK',
            'BAMK OF BARODA', 'BANK OP BARODA', 'BANK OF BABODA'
        ];

        // Try exact and partial matches
        for (const bank of bankNames) {
            const bankWords = bank.split(' ');
            const bankRegex = new RegExp(bankWords.join('\\s+'), 'i');
            if (bankRegex.test(upperText)) {
                // Normalize to proper case
                data.chequeBank = bank.split(' ').map(w =>
                    w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                ).join(' ');
                break;
            }
        }

        // Enhanced fallback with more flexible patterns
        if (!data.chequeBank) {
            const bankPatterns = [
                // State Bank variations
                { pattern: /STATE\s*BANK/i, name: 'State Bank Of India' },
                { pattern: /SBI|S\.B\.I/i, name: 'State Bank Of India' },

                // HDFC variations
                { pattern: /HDFC/i, name: 'HDFC Bank' },

                // ICICI variations
                { pattern: /ICICI/i, name: 'ICICI Bank' },

                // Axis variations
                { pattern: /AXIS/i, name: 'Axis Bank' },

                // PNB variations
                { pattern: /PUNJAB\s*NATIONAL|PNB/i, name: 'Punjab National Bank' },

                // Bank of Baroda variations (Enhanced with IFSC-based detection)
                { pattern: /BARODA|BOB|BARB0/i, name: 'Bank Of Baroda' },

                // Kotak variations
                { pattern: /KOTAK/i, name: 'Kotak Mahindra Bank' },

                // Canara variations
                { pattern: /CANARA/i, name: 'Canara Bank' },

                // Generic "BANK" with preceding word
                { pattern: /(\w+)\s+BANK/i, name: null }, // Will use matched word + Bank
                // Match "SUM BANK"
                { pattern: /SUM\s*BANK/i, name: 'Sum Bank' }
            ];

            for (const { pattern, name } of bankPatterns) {
                const match = upperText.match(pattern);
                if (match) {
                    if (name) {
                        data.chequeBank = name;
                    } else if (match[1]) {
                        // Use matched word + Bank
                        data.chequeBank = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase() + ' Bank';
                    }
                    break;
                }
            }
        }

        // ----- 3. IFSC CODE (Enhanced for OCR variations) -----
        const ifscPatterns = [
            // Standard IFSC patterns
            /IFSC\s*CODE\s*:?\s*([A-Z]{4}[0O][A-Z0-9]{6})/i,  // Enhanced for patterns like BARB0GANNAS
            /IFSC\s*:?\s*([A-Z]{4}[0O]\d{6})/i,
            /IFSC\s*CODE\s*:?\s*([A-Z]{4}[0O]\d{6})/i,

            // OCR variations of "IFSC"
            /(?:IFSC|IPSC|IFSG|IFDC|IRSC)\s*:?\s*([A-Z]{4}[0O]\d{6})/i,

            // Direct IFSC pattern (4 letters + 0 + 6 digits/letters)
            /([A-Z]{4}0[A-Z0-9]{6})/i,  // More flexible for mixed patterns
            /([A-Z]{4}[0O]\d{6})/i, // OCR might read 0 as O

            // IFSC with spaces or dashes
            /([A-Z]{4}[0O]\s*\d{6})/i,
            /([A-Z]{4}[0O]\d{2}\s*\d{4})/i,

            // Bank code specific patterns (enhanced)
            /SBIN[0O]\d{6}/i, // State Bank
            /HDFC[0O]\d{6}/i, // HDFC
            /ICIC[0O]\d{6}/i, // ICICI
            /BARB0[A-Z0-9]{6}/i, // Bank of Baroda (can have letters)
            /UTIB[0O]\d{6}/i, // Axis Bank
            /PUNB[0O]\d{6}/i, // Punjab National Bank

            // With surrounding text
            /(?:IFSC|CODE|IPSC)\s*[:\-]?\s*([A-Z]{4}[0O][A-Z0-9]{6})/i,

            // Standalone pattern in lines
            /^.*?([A-Z]{4}[0O][A-Z0-9]{6}).*?$/im,
            
            // Highly messy OCR capturing spaces
            /IFSC\s*[:\-]?\s*([A-Z0-9\s]{10,25})/i
        ];

        for (const pat of ifscPatterns) {
            const m = fullText.match(pat);
            if (m) {
                // Clean up the IFSC code
                let ifsc = m[1].toUpperCase().replace(/[^A-Z0-9]/g, '');
                // Replace O with 0 in 5th position
                if (ifsc.length === 11 && /[A-Z]{4}[O]\d{6}/.test(ifsc)) {
                    ifsc = ifsc.substring(0, 4) + '0' + ifsc.substring(5);
                }
                data.ifsc = ifsc;
                break;
            }
        }

        // Enhanced MICR band search for IFSC
        if (!data.ifsc) {
            const micrText = lines.slice(-4).join(' '); // Check last 4 lines
            const micrIfscPatterns = [
                /([A-Z]{4}0\d{6})/i,
                /([A-Z]{4}[0O]\d{6})/i
            ];

            for (const pat of micrIfscPatterns) {
                const match = micrText.match(pat);
                if (match) {
                    let ifsc = match[1].toUpperCase();
                    // Fix O -> 0 in 5th position
                    if (ifsc.length === 11 && ifsc[4] === 'O') {
                        ifsc = ifsc.substring(0, 4) + '0' + ifsc.substring(5);
                    }
                    data.ifsc = ifsc;
                    break;
                }
            }
        }

        // ----- 4. BRANCH -----
        const branchPatterns = [
            /Branch\s*:?\s*([A-Za-z][A-Za-z\s,.-]+?)(?:\s{2,}|IFSC|$|\n)/im,
            /Branch\s*:?\s*(.+?)(?:\n|IFSC)/im,
            // Fallback for address lines
            /([A-Za-z][A-Za-z\s]+\s*(?:Road|Town|Street|Nagar|Colony|Marg|City)[A-Za-z\s,.-]*)/i
        ];
        for (const pat of branchPatterns) {
            const m = fullText.match(pat);
            if (m) {
                let branch = m[1].trim();
                // Clean up trailing punctuation
                branch = branch.replace(/[,.\s]+$/, '');
                if (branch.length > 4 && branch.length < 80) {
                    data.chequeBranch = branch;
                    break;
                }
            }
        }

        // ----- 5. DATE (Enhanced for handwritten variations) -----
        const datePatterns = [
            // Enhanced date patterns for handwritten text

            // Pattern 1: Traditional DD/MM/YYYY with various separators
            /Date\s*:?\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{4})/i,

            // Pattern 2: Standalone date patterns (common in handwritten)
            /(\d{1,2})\s*[\/\-.\\]\s*(\d{1,2})\s*[\/\-.\\]\s*(\d{4})/,

            // Pattern 3: DD MM YYYY with spaces (handwritten style)
            /(\d{1,2})\s+(\d{1,2})\s+(\d{4})/,

            // Pattern 4: Date circled or in box (common handwriting)
            /(?:\(|\[|círculo)?\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{2,4})\s*(?:\)|\])?/,

            // Pattern 5: Date with written month names (sometimes OCR confuses them)
            /(\d{1,2})\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*(\d{2,4})/i,

            // Pattern 6: Two digit patterns (DD/MM/YY format)
            /(\d{1,2})\s*[\/\-.\s]\s*(\d{1,2})\s*[\/\-.\s]\s*(\d{2})\b/,

            // Pattern 7: Very flexible - any 3 numbers that look like a date
            /\b(\d{1,2})[^\w\d](\d{1,2})[^\w\d](\d{2,4})\b/,

            // Pattern 8: Look for date in specific money order format patterns
            /(\d{2})\s*(\d{2})\s*(\d{2,4})/,
            
            // Pattern 9: Highly distorted OCR like & pate 28/7 02 / 2013
            /(?:Date|Pate|Oate|Dane|Bate|pate).*?(\d{1,2})\s*[\/\-.\\]+(?:\s*\d{1,2}\s*)?\s*(\d{1,2})\s*[\/\-.\\]+\s*(\d{4})/i
        ];
        for (const pat of datePatterns) {
            const m = fullText.match(pat);
            if (m) {
                let [, day, month, year] = m;
                day = day.padStart(2, '0');
                month = month.padStart(2, '0');

                // Handle 2-digit years by converting to 4-digit
                if (year && year.length === 2) {
                    const currentYear = new Date().getFullYear();
                    const currentCentury = Math.floor(currentYear / 100) * 100;
                    const yearNum = parseInt(year);

                    // If year is in the future (relative to current 2-digit), use previous century
                    if (yearNum > (currentYear % 100) + 10) {
                        year = (currentCentury - 100 + yearNum).toString();
                    } else {
                        year = (currentCentury + yearNum).toString();
                    }
                }

                // Sanity check
                if (parseInt(month) <= 12 && parseInt(day) <= 31 && year.length === 4) {
                    data.chequeDate = `${year}-${month}-${day}`;
                    break;
                }
            }
        }

        // ----- 6. AMOUNT (Enhanced to avoid account numbers) -----
        const amountPatterns = [
            // Enhanced patterns for handwritten amounts - prioritize patterns that don't capture account numbers

            // Pattern 1: Amounts with asterisks or in amount box (printed checks)
            /[\*#]+\s*([\d,]+)\s*[\*#]+/i,

            // Pattern 2: Rs. variations with reasonable limits (handles OCR errors with Rs)
            /(?:Rs|RE|RS|Re|Bs|Rs\.|RE\.|RS\.|Re\.)\s*([\d,]{3,7})\s*\/?-?/i,

            // Pattern 3: Rupee symbol variations with reasonable limits
            /(?:Rupees|₹|Rupee|tupees|upees|Bupees)\s*([\d,]{3,7})/i,

            // Pattern 4: Amount in box format (handwritten) - avoid long numbers
            /(?:^|\s)([\d,]{3,7})\s*\/?-\s*(?:$|\s)/m,

            // Pattern 5: Standalone numbers with commas but reasonable length (indian formatting)
            /\b(\d{1,3}(?:,\d{2,3}){1,3})\b/,

            // Pattern 6: Numbers at end of line with dash - avoid account numbers
            /(\d{3,7})\s*\/?-?\s*$/m,

            // Pattern 7: Moderate numbers that could be amounts (avoid 12+ digit account numbers)
            /\b(\d{3,9})\b(?!\d)/,

            // Pattern 8: Handwritten amount with slashes or dashes - reasonable length
            /(\d{1,3}(?:,\d{2,3}){0,3})\s*[\/\-]/,

            // Pattern 9: Amount between spaces (common in handwriting) - reasonable length
            /\s+(\d{3,8}(?:,\d{2,3})*)\s+/
        ];

        for (const pat of amountPatterns) {
            const m = fullText.match(pat);
            if (m) {
                const cleaned = m[1].replace(/,/g, '');
                const amount = parseInt(cleaned);
                // Only accept if it's a reasonable cheque amount (>= 100 and <= 50 crores)
                // Avoid account numbers which are typically 10+ digits
                if (amount >= 100 && amount <= 500000000 && cleaned.length <= 9) {
                    data.amount = cleaned;
                    break;
                }
            }
        }

        // Enhanced amount words parsing for handwritten text
        if (!data.amount) {
            const amountWords = {
                // Standard number words
                'ONE THOUSAND': '1000', 'TWO THOUSAND': '2000', 'THREE THOUSAND': '3000',
                'FOUR THOUSAND': '4000', 'FIVE THOUSAND': '5000', 'SIX THOUSAND': '6000',
                'SEVEN THOUSAND': '7000', 'EIGHT THOUSAND': '8000', 'NINE THOUSAND': '9000',
                'TEN THOUSAND': '10000', 'ELEVEN THOUSAND': '11000', 'TWELVE THOUSAND': '12000',
                'THIRTEEN THOUSAND': '13000', 'FOURTEEN THOUSAND': '14000', 'FIFTEEN THOUSAND': '15000',
                'SIXTEEN THOUSAND': '16000', 'SEVENTEEN THOUSAND': '17000', 'EIGHTEEN THOUSAND': '18000',
                'NINETEEN THOUSAND': '19000', 'TWENTY THOUSAND': '20000', 'TWENTY ONE THOUSAND': '21000',
                'TWENTY TWO THOUSAND': '22000', 'TWENTY THREE THOUSAND': '23000', 'TWENTY FOUR THOUSAND': '24000',
                'TWENTY FIVE THOUSAND': '25000', 'THIRTY THOUSAND': '30000', 'FORTY THOUSAND': '40000',
                'FIFTY THOUSAND': '50000', 'SIXTY THOUSAND': '60000', 'SEVENTY THOUSAND': '70000',
                'SEVENTY FIVE THOUSAND': '75000', 'EIGHTY THOUSAND': '80000', 'NINETY THOUSAND': '90000',
                'ONE LAKH': '100000', 'ONE HUNDRED THOUSAND': '100000', 'TWO LAKH': '200000',
                'THREE LAKH': '300000', 'FOUR LAKH': '400000', 'FIVE LAKH': '500000',
                'TEN LAKH': '1000000', 'ONE CRORE': '10000000',

                // Common handwriting OCR variations
                'PIFTEEN THOUSAND': '15000', 'FIFTEBN THOUSAND': '15000', 'EIFTEEN THOUSAND': '15000',
                'FIFTBEN THOUSAND': '15000', 'FIFTHEN THOUSAND': '15000', 'TIFTEEN THOUSAND': '15000',
                'TWBNTY THOUSAND': '20000', 'TWEMTY THOUSAND': '20000', 'TWENTY THQUSAND': '20000',
                'THIRIY THOUSAND': '30000', 'THIRITY THOUSAND': '30000', 'THIRTY THQUSAND': '30000',
                'POURTEEN THOUSAND': '14000', 'FOURTBEN THOUSAND': '14000',
                'EIGHTBEN THOUSAND': '18000', 'BIGHTBEN THOUSAND': '18000',

                // Shortened versions common in handwriting
                'FIFTEEN': '15000', 'TWENTY': '20000', 'THIRTY': '30000', 'FORTY': '40000',
                'FIFTY': '50000', 'SIXTY': '60000', 'SEVENTY': '70000', 'EIGHTY': '80000',
                'NINETY': '90000', 'TIFTEEN': '15000',

                // With "ONLY" suffix (common in Indian cheques)
                'FIFTEEN THOUSAND ONLY': '15000', 'TWENTY THOUSAND ONLY': '20000',
                'FIFTY THOUSAND ONLY': '50000', 'ONE LAKH ONLY': '100000', 'TIFTEEN THOUSAND ONLY': '15000',

                // Spelled out numbers with OCR variations
                'BIGHT AND 15': '815', 'EIGHT AND 15': '815', 'EIGHT AND 59': '859'
            };

            // Try exact matches first
            for (const [word, val] of Object.entries(amountWords)) {
                if (upperText.includes(word)) {
                    data.amount = val;
                    break;
                }
            }

            // If still no amount, try partial matches with more flexibility
            if (!data.amount) {
                // Look for "THOUSAND" with a number before it
                const thousandMatch = upperText.match(/(\w+)\s+THOUSAND/);
                if (thousandMatch) {
                    const numWord = thousandMatch[1];
                    const numberMap = {
                        'ONE': 1000, 'TWO': 2000, 'THREE': 3000, 'FOUR': 4000, 'FIVE': 5000,
                        'SIX': 6000, 'SEVEN': 7000, 'EIGHT': 8000, 'NINE': 9000, 'TEN': 10000,
                        'ELEVEN': 11000, 'TWELVE': 12000, 'THIRTEEN': 13000, 'FOURTEEN': 14000,
                        'FIFTEEN': 15000, 'SIXTEEN': 16000, 'SEVENTEEN': 17000, 'EIGHTEEN': 18000,
                        'NINETEEN': 19000, 'TWENTY': 20000, 'THIRTY': 30000, 'FORTY': 40000,
                        'FIFTY': 50000, 'SIXTY': 60000, 'SEVENTY': 70000, 'EIGHTY': 80000,
                        'NINETY': 90000,
                        // Common OCR variations
                        'PIFTEEN': 15000, 'FIFTEBN': 15000, 'EIFTEEN': 15000, 'FIFTHEN': 15000
                    };
                    if (numberMap[numWord]) {
                        data.amount = numberMap[numWord].toString();
                    }
                }
            }
        }

        // ----- 7. PAYEE NAME (Enhanced for handwritten text and partial names) -----
        const payeePatterns = [
            // Enhanced patterns for handwritten text recognition

            // Pattern 1: After "Pay" variations (handles handwritten OCR errors)
            /(?:Pay|Pey|Poy|Pa|P\.y|ss|55|ay|Fay|Pay|Pay_)\s*(?:to|t0|TO|To|T0)?\s*[:\-|/\\]?\s*([A-Za-z][A-Za-z0-9 \t.,&-]{2,70}?)(?:\s*or\s*Bearer|Bearer|or\s*Order|Order|Rupees|upees|pees|₹|\n|$)/i,

            // Pattern 2: Between underlines (common in handwritten cheques)
            /_{3,}([A-Za-z][A-Za-z0-9 \t.,&-]{2,70}?)_{3,}/i,

            // Pattern 3: Capital letters indicating names - more flexible
            /(?:Pay|Pey|Poy|Pa|P\.y|ss|55|ay)\s*(?:to|t0|TO)?\s*[:\-|]?\s*([A-Z][A-Z\s]{2,50})/i,

            // Pattern 4: Look for name patterns after Pay field - more flexible
            /(?:Pay|Pey|Poy|Pa|P\.y|ss|55|ay|Fay)\s*(?:to|t0|TO|To)?\s*[:\-|/\\]?\s*([A-Za-z]+(?:\s+[A-Za-z]+){0,5})/i,

            // Pattern 5: Name near "or Bearer" (working backwards)
            /([A-Za-z][A-Za-z0-9 \t.,&-]{2,60}?)\s+(?:or\s+Bearer|Bearer|or\s+Order|Order)/i,

            // Pattern 6: Standalone name patterns (1-5 words) - include partial names
            /\b([A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*){0,4})\b/,

            // Pattern 7: Very flexible pattern for any reasonable name
            /(?:Pay|Pey|Poy|Pa|P\.y)\s*[:\-]?\s*([A-Za-z \t.,&-]{3,50})/i,

            // Pattern 8: Capture partial names that might be incomplete due to OCR errors
            /\b([A-Z][A-Za-z]{2,15}(?:\s+[A-Z][A-Za-z]{2,15}){0,3})\b/,

            // Pattern 9: Names that might have OCR errors but still recognizable
            /([A-Z][A-Z\s]{4,30})/
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

                // Check again after cleaning - more lenient for partial names
                if (payee.length >= 3 && payee.length <= 80 &&
                    !['rupees', 'upees', 'bearer', 'order', 'only', 'bank', 'india', 'state'].includes(payee.toLowerCase()) &&
                    /[A-Za-z]/.test(payee)) { // Must contain at least one letter
                    data.payee = payee;
                    break;
                }
            }
        }

        // ----- 8. ACCOUNT NUMBER (Enhanced for long numeric accounts) -----
        const accPatterns = [
            // Traditional account patterns
            /A\/?c\s*No\.?\s*:?\s*([A-Z0-9][\w\-]+)/i,
            /(ACC[\-\s]?\d{4}[\-\s]?\d{2,4})/i,
            /Account\s*(?:No\.?|Number|#)\s*:?\s*([A-Z0-9][\w\-]+)/i,

            // Long numeric account numbers (10-16 digits)
            /\b(\d{10,16})\b/,

            // Account numbers with specific numeric patterns
            /(\d{3,4}\d{3,4}\d{3,6})/,

            // Account numbers near "Account" or "A/c" words
            /(?:Account|A\/c)\s*(?:No\.?|Number)?\s*:?\s*(\d{10,16})/i,
        ];

        for (const pat of accPatterns) {
            const m = fullText.match(pat);
            if (m) {
                const accNum = m[1].trim();
                // Avoid capturing amounts (typically < 10 digits) or very short numbers
                if (accNum.length >= 6 && accNum.length <= 18) {
                    data.accountNumber = accNum;
                    break;
                }
            }
        }

        // Also check MICR for account number pattern like ACC2026001
        if (!data.accountNumber) {
            const micrText = lines.slice(-3).join(' ');
            const accMicr = micrText.match(/(ACC\d+)/i);
            if (accMicr) data.accountNumber = accMicr[1];

            // Check for long numbers in MICR band (could be account numbers)
            const longNumMicr = micrText.match(/(\d{10,16})/);
            if (longNumMicr) data.accountNumber = longNumMicr[1];
        }

        // Apply backup extraction to fill missing fields
        const backupData = performBackupExtraction(fullText);
        Object.keys(data).forEach(key => {
            if (!data[key] && backupData[key]) {
                data[key] = backupData[key];
            }
        });

        console.log('=== PARSED DATA ===');
        console.log(data);
        console.log('===================');

        return data;
    };

    // Backup extraction function for missed fields
    const performBackupExtraction = (text) => {
        const backupData = {
            chequeNumber: '',
            chequeBank: '',
            chequeBranch: '',
            chequeDate: '',
            amount: '',
            payee: '',
            accountNumber: '',
            ifsc: ''
        };

        // Simple fallback patterns
        const lines = text.split('\n').filter(Boolean);

        // Look for any 6+ digit numbers for cheque number
        if (!backupData.chequeNumber) {
            const numMatch = text.match(/\b(\d{6,8})\b/);
            if (numMatch) backupData.chequeNumber = numMatch[1];
        }

        // Look for common bank keywords
        if (!backupData.chequeBank) {
            if (/state.*bank|sbi/i.test(text)) backupData.chequeBank = 'State Bank Of India';
            else if (/hdfc/i.test(text)) backupData.chequeBank = 'HDFC Bank';
            else if (/icici/i.test(text)) backupData.chequeBank = 'ICICI Bank';
            else if (/axis/i.test(text)) backupData.chequeBank = 'Axis Bank';
        }

        // Look for any date-like patterns
        if (!backupData.chequeDate) {
            const dateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/);
            if (dateMatch) {
                const [, day, month, year] = dateMatch;
                if (parseInt(month) <= 12 && parseInt(day) <= 31) {
                    backupData.chequeDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                }
            }
        }

        return backupData;
    };

    // Enhanced Tesseract OCR with advanced preprocessing
    const scanChequeWithTesseract = async (imgSrc) => {
        if (!scanning) {
            setScanning(true);
            setScanProgress(0);
        }
        setScanStatus('🔄 Enhanced Tesseract OCR - Processing image...');
        setError(null);
        if (!rawOcrText) setRawOcrText('');

        try {
            // Step 1: Pre-process the image for handwritten text
            setScanProgress(5);
            const processedImg = await preprocessImage(imgSrc);

            setScanStatus('🔄 Loading Enhanced OCR engine...');
            setScanProgress(10);

            const Tesseract = (await import('tesseract.js')).default;

            // Configuration optimized for handwritten text
            const handwrittenConfig = {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setScanProgress(15 + Math.round(m.progress * 35)); // 15-50%
                        setScanStatus('🔍 Scanning handwritten text...');
                    } else if (m.status === 'loading language traineddata') {
                        setScanStatus('📚 Loading language data...');
                        setScanProgress(12);
                    } else if (m.status === 'initializing api') {
                        setScanStatus('⚙️ Initializing Enhanced OCR...');
                        setScanProgress(13);
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.AUTO,
                tessedit_ocr_engine_mode: Tesseract.OEM.LSTM_ONLY,
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-: ',
                preserve_interword_spaces: '1'
            };

            setScanStatus('🔍 First scan - handwritten optimized...');
            const result1 = await Tesseract.recognize(processedImg, 'eng', handwrittenConfig);

            // Second scan with different configuration for better accuracy
            setScanStatus('🔍 Second scan - print optimized...');
            setScanProgress(50);

            const printConfig = {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setScanProgress(50 + Math.round(m.progress * 35)); // 50-85%
                        setScanStatus('📄 Scanning printed text...');
                    }
                },
                tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
                tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
                tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,/-:() '
            };

            const result2 = await Tesseract.recognize(processedImg, 'eng', printConfig);

            setScanStatus('🔄 Combining results and analyzing...');
            setScanProgress(85);

            // Combine both OCR results for better accuracy
            const combinedText = result1.data.text + '\n\n--- SECOND SCAN ---\n\n' + result2.data.text;

            // If this is a fallback (we already have raw text), append to it
            if (rawOcrText) {
                setRawOcrText(rawOcrText + '\n\n--- ENHANCED TESSERACT FALLBACK ---\n\n' + combinedText);
            } else {
                setRawOcrText(combinedText);
            }

            // Try parsing with both results and use the one with more extracted fields
            const extracted1 = parseOcrText(result1.data.text);
            const extracted2 = parseOcrText(result2.data.text);

            // Count non-empty fields in each result
            const countFields = (data) => Object.values(data).filter(val => val && val.trim()).length;
            const count1 = countFields(extracted1);
            const count2 = countFields(extracted2);

            // Also try parsing the combined text
            const extractedCombined = parseOcrText(combinedText);
            const countCombined = countFields(extractedCombined);

            // Use the result with the most extracted fields
            let bestResult = extractedCombined;
            if (count1 > countCombined && count1 > count2) {
                bestResult = extracted1;
            } else if (count2 > countCombined && count2 > count1) {
                bestResult = extracted2;
            }

            // Merge results - take best field from any scan
            const mergedResult = { ...bestResult };

            // Override with better values if available
            Object.keys(mergedResult).forEach(key => {
                if (!mergedResult[key] && extracted1[key]) mergedResult[key] = extracted1[key];
                if (!mergedResult[key] && extracted2[key]) mergedResult[key] = extracted2[key];
                if (!mergedResult[key] && extractedCombined[key]) mergedResult[key] = extractedCombined[key];
            });

            const finalFieldCount = countFields(mergedResult);
            setExtractedData(mergedResult);
            setScanProgress(100);
            setScanStatus(`✅ Enhanced Tesseract complete! Extracted ${finalFieldCount}/8 fields`);

        } catch (err) {
            console.error('Enhanced Tesseract OCR Error:', err);
            setError('Enhanced Tesseract OCR failed. This might be due to handwriting complexity. Please try again or enter details manually.');
        } finally {
            setScanning(false);
        }
    };

    // Main scan handler - uses AI OCR if available, otherwise Tesseract
    const scanCheque = async (imgSrc) => {
        if (hasAIAvailable()) {
            await scanChequeWithAI(imgSrc);
        } else {
            await scanChequeWithTesseract(imgSrc);
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
                            <h2 className="text-lg font-bold text-gray-800">Enhanced Cheque Scanner</h2>
                            <p className="text-xs text-gray-400">Now optimized for handwritten cheques! Upload or scan to auto-fill details</p>
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
                                            className={`h-full rounded-full transition-all duration-500 ease-out ${
                                                aiProcessing
                                                    ? 'bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500'
                                                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                                            }`}
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
                                    {hasAIAvailable() ? 'Scan with AI OCR' : 'Scan Cheque (OCR)'}
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
                                <span className="text-sm font-medium">
                                    {rawOcrText.includes('AI OCR Results')
                                        ? `🤖 AI extraction successful! ${rawOcrText.match(/\(([^)]+)\)/)?.[1] || 'AI'} processed`
                                        : 'Cheque details extracted successfully!'
                                    }
                                </span>
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
