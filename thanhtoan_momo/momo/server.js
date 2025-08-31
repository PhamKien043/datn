
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      process.env.LARAVEL_URL || 'http://localhost:8000',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MoMo Configuration
const config = {
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
  partnerCode: 'MOMO',
  redirectUrl: process.env.LARAVEL_URL
    ? `${process.env.LARAVEL_URL}/payment/return`
    : 'http://localhost:8000/payment/return',
  ipnUrl: process.env.LARAVEL_URL
    ? `${process.env.LARAVEL_URL}/api/payment/callback`
    : 'http://localhost:8000/api/payment/callback',
  requestType: 'payWithMethod',
  extraData: '',
  orderGroupId: '',
  autoCapture: true,
  lang: 'vi',
  orderInfo: 'pay with MoMo',
};

// Create MoMo payment
app.post('/payment', async (req, res) => {
  try {
    const { amount, orderId, orderInfo, extraData, returnUrl, notifyUrl } =
      req.body;

    // Validate required fields
    if (!amount || !orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc: amount, orderId',
      });
    }

    // Use provided values or defaults
    const requestId = orderId;
    const finalOrderInfo = orderInfo || config.orderInfo;
    const finalExtraData = extraData || config.extraData;
    const finalReturnUrl = returnUrl || config.redirectUrl;
    const finalNotifyUrl = notifyUrl || config.ipnUrl;

    // Create signature
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${finalExtraData}&ipnUrl=${finalNotifyUrl}&orderId=${orderId}&orderInfo=${finalOrderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${finalReturnUrl}&requestId=${requestId}&requestType=${config.requestType}`;
    const signature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    // Request body for MoMo
    const requestBody = {
      partnerCode: config.partnerCode,
      partnerName: 'Test',
      storeId: 'MomoTestStore',
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: finalOrderInfo,
      redirectUrl: finalReturnUrl,
      ipnUrl: finalNotifyUrl,
      lang: config.lang,
      requestType: config.requestType,
      autoCapture: config.autoCapture,
      extraData: finalExtraData,
      orderGroupId: config.orderGroupId,
      signature: signature,
    };

    console.log('MoMo Request:', requestBody);

    // Send request to MoMo
    const result = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/create',
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    console.log('MoMo Response:', result.data);

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('MoMo Payment Error:', error.message, error.response?.data);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo giao dịch MoMo',
      error: error.response?.data || error.message,
    });
  }
});

// Handle MoMo callback and forward to Laravel
app.post('/callback', async (req, res) => {
  try {
    console.log('MoMo Callback received:', req.body);

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = req.body;

    // Verify signature
    const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error(
        'Invalid signature:',
        signature,
        'Expected:',
        expectedSignature,
      );
      return res.status(400).json({ message: 'Invalid signature' });
    }

    console.log('✅ Signature verified successfully');

    // Forward callback to Laravel
    try {
      const laravelResponse = await axios.post(config.ipnUrl, req.body, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      });

      console.log(
        '✅ Callback forwarded to Laravel successfully:',
        laravelResponse.status,
      );
    } catch (error) {
      console.error('❌ Error forwarding callback to Laravel:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: config.ipnUrl,
      });
    }

    // Always return 204 to MoMo to confirm receipt
    return res.status(204).send();
  } catch (error) {
    console.error('❌ Callback processing error:', error.message);
    return res.status(500).json({ message: 'Callback processing error' });
  }
});

// Check transaction status
app.post('/check-status-transaction', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu orderId',
      });
    }

    // Create signature for status check
    const rawSignature = `accessKey=${config.accessKey}&orderId=${orderId}&partnerCode=${config.partnerCode}&requestId=${orderId}`;
    const signature = crypto
      .createHmac('sha256', config.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: config.partnerCode,
      requestId: orderId,
      orderId: orderId,
      signature: signature,
      lang: config.lang,
    };

    console.log('Status check request:', requestBody);

    // Send request to MoMo
    const result = await axios.post(
      'https://test-payment.momo.vn/v2/gateway/api/query',
      requestBody,
      {
        headers: { 'Content-Type': 'application/json' },
      },
    );

    console.log('Status check response:', result.data);

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('Status check error:', error.message, error.response?.data);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khi kiểm tra trạng thái giao dịch',
      error: error.response?.data || error.message,
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'MoMo Payment Service',
    config: {
      partnerCode: config.partnerCode,
      redirectUrl: config.redirectUrl,
      ipnUrl: config.ipnUrl,
    },
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 MoMo Payment Service is running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Laravel callback URL: ${config.ipnUrl}`);
  console.log(`🔗 Return URL: ${config.redirectUrl}`);
});
