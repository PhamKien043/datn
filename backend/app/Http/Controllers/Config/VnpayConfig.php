<?php

return [
    'vnp_TmnCode' => env('VNPAY_TMN_CODE', 'CT5RKPL8'),
    'vnp_HashSecret' => env('VNPAY_HASH_SECRET', '8RS5POKC6ZDODPDB17YOWXLV8HKJOA8L'),
    'vnp_Url' => env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
    'vnp_ReturnUrl' => env('VNPAY_RETURN_URL', 'http://localhost:5173/'),
];
