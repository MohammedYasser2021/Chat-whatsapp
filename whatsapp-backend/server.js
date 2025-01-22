const express = require('express');
const cors = require('cors');
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();

// Setup multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

let client;
let connectionStatus = 'disconnected';
let qrCodeData = null;

async function destroyClient() {
    connectionStatus = 'disconnecting'; // Add transitional state
    if (client) {
        try {
            await client.destroy();
            client = null;
        } catch (error) {
            console.error('Error destroying client:', error);
        }
    }
    connectionStatus = 'disconnected';
    qrCodeData = null;
}

async function clearAuthData() {
    try {
        const authDir = path.join(process.cwd(), '.wwebjs_auth');
        if (fs.existsSync(authDir)) {
            fs.rmSync(authDir, { recursive: true, force: true });
        }
    } catch (error) {
        console.error('Error clearing auth data:', error);
    }
}

function initializeWhatsApp() {
    connectionStatus = 'initializing'; // Add transitional state
    client = new Client({
        authStrategy: new LocalAuth(),
        puppeteer: {
            args: ['--no-sandbox']
        }
    });

    client.on('qr', (qr) => {
        connectionStatus = 'waiting-for-qr';
        qrCodeData = qr;
        qrcode.generate(qr, { small: true });
        console.log('QR Code generated! Scan with WhatsApp');
    });

    client.on('loading_screen', (percent, message) => {
        connectionStatus = `connecting:${percent}`; // Add loading state with percentage
        console.log('Loading:', percent, '%', message);
    });

    client.on('ready', () => {
        connectionStatus = 'connected';
        qrCodeData = null;
        console.log('WhatsApp client is ready!');
    });

    client.on('authenticated', () => {
        connectionStatus = 'authenticating'; // Add transitional state
        console.log('WhatsApp authenticated successfully!');
    });

    client.on('disconnected', async () => {
        console.log('WhatsApp disconnected!');
        await destroyClient();
        await clearAuthData();
        initializeWhatsApp();
    });

    try {
        client.initialize().catch(error => {
            console.error('Error during initialization:', error);
            connectionStatus = 'disconnected';
        });
    } catch (error) {
        console.error('Error initializing client:', error);
        connectionStatus = 'disconnected';
    }
}

// Initialize WhatsApp client
initializeWhatsApp();

// Routes
app.get('/status', (req, res) => {
    res.json({ 
        status: connectionStatus,
        qrCode: qrCodeData
    });
});

app.post('/disconnect', async (req, res) => {
    try {
        await destroyClient();
        await clearAuthData();
        
        // Set status to initializing immediately
        connectionStatus = 'initializing';
        
        // Initialize new client immediately
        initializeWhatsApp();
        
        res.json({ 
            success: true, 
            message: 'Disconnected successfully',
            status: connectionStatus
        });
    } catch (error) {
        console.error('Error during disconnect:', error);
        // Even if there's an error, we want to ensure we're in a clean state
        connectionStatus = 'initializing';
        qrCodeData = null;
        
        // Initialize new client
        initializeWhatsApp();
        
        res.json({ 
            success: true, 
            message: 'Disconnected with recovery',
            status: connectionStatus
        });
    }
});

app.post('/send-bulk-messages', async (req, res) => {
    try {
        const { numbers, message, mediaPaths } = req.body;
        console.log('Received request:', { numbers, message, mediaPaths });

        if (!client) {
            return res.status(400).json({ error: 'WhatsApp client not initialized' });
        }

        // Validate request data
        if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
            return res.status(400).json({ error: 'يجب توفير قائمة صالحة من الأرقام' });
        }

        const results = { success: [], failed: [] };

        for (const number of numbers) {
            try {
                // Format number
                let formattedNumber = number.toString().replace(/\D/g, '');
                if (!formattedNumber.startsWith('20')) {
                    formattedNumber = '20' + formattedNumber;
                }
                const chatId = `${formattedNumber}@c.us`;

                // Check if number is registered
                const isRegistered = await client.isRegisteredUser(chatId);
                if (!isRegistered) {
                    throw new Error('رقم غير مسجل في واتساب');
                }

                // Send media if exists
                if (mediaPaths && mediaPaths.length > 0) {
                    for (const mediaPath of mediaPaths) {
                        try {
                            const fullPath = path.join(process.cwd(), mediaPath);
                            console.log('Attempting to send media from:', fullPath);
                            
                            if (!fs.existsSync(fullPath)) {
                                throw new Error('ملف الوسائط غير موجود');
                            }

                            const mimeType = mime.lookup(fullPath);
                            if (!mimeType) {
                                throw new Error('نوع الملف غير مدعوم');
                            }

                            const base64Data = fs.readFileSync(fullPath, { encoding: 'base64' });
                            const media = new MessageMedia(mimeType, base64Data);

                            await client.sendMessage(chatId, media, {
                                caption: message || undefined
                            });
                        } catch (mediaError) {
                            console.error('Media error:', mediaError);
                            throw new Error('فشل في إرسال الوسائط: ' + mediaError.message);
                        }
                    }
                } else if (message) {
                    // Send text only if there's a message
                    await client.sendMessage(chatId, message);
                } else {
                    throw new Error('يجب توفير رسالة أو ملف وسائط');
                }

                results.success.push(formattedNumber);
                console.log('✅ Message sent to:', formattedNumber);

            } catch (error) {
                results.failed.push({
                    number,
                    reason: error.message
                });
                console.log('❌ Failed for:', number, error.message);
            }
        }

        res.json({ results });

    } catch (error) {
        console.error('Main error:', error);
        res.status(500).json({ error: 'خطأ في معالجة الطلب: ' + error.message });
    }
});

app.post('/upload-media', upload.single('media'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({ 
        success: true,
        filePath: req.file.path
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});