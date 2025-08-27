<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Room;
use App\Models\Service;
use App\Models\CartDetail;
use App\Models\RoomSlot;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VnpayController extends Controller
{
    private $vnp_TmnCode;
    private $vnp_HashSecret;
    private $vnp_Url;
    private $vnp_ReturnUrl;

    public function __construct()
    {
        $this->vnp_TmnCode = env('VNPAY_TMN_CODE', 'CT5RKPL8');
        $this->vnp_HashSecret = env('VNPAY_SECRET_KEY', '8RS5POKC6ZDODPDB17YOWXLV8HKJOA8L');
        $this->vnp_Url = env('VNPAY_URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html');
        $this->vnp_ReturnUrl = env('VNPAY_RETURN_URL', 'http://localhost:8000/api/vnpay/return');
    }

    private function convertTimeSlot($timeSlot)
    {
        switch ($timeSlot) {
            case 'morning':
                return '08:00:00';
            case 'afternoon':
                return '13:00:00';
            default:
                if (preg_match('/^\d{2}:\d{2}:\d{2}$/', $timeSlot)) return $timeSlot;
                if (preg_match('/^\d{2}:\d{2}$/', $timeSlot)) return $timeSlot . ':00';
                return '08:00:00';
        }
    }

    private function updateRoomSlotAvailability($orderId)
    {
        try {
            $details = OrderDetail::where('order_id', $orderId)
                ->whereNotNull('room_slot_id')
                ->get();

            foreach ($details as $detail) {
                $slot = RoomSlot::find($detail->room_slot_id);
                if ($slot) {
                    if (!$slot->book()) {
                        Log::warning('Room slot already booked or cannot update', [
                            'room_slot_id' => $slot->id,
                            'order_id' => $orderId,
                        ]);
                    } else {
                        Log::info('Room slot updated to unavailable', [
                            'room_slot_id' => $slot->id,
                            'order_id' => $orderId,
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::error('Error updating room slot availability', [
                'order_id' => $orderId,
                'message' => $e->getMessage()
            ]);
        }
    }

    private function hasUserUsedVoucherSuccessful(?int $userId, ?int $voucherId): bool
    {
        if (!$userId || !$voucherId) return false;

        return Order::where('user_id', $userId)
            ->where('voucher_id', $voucherId)
            ->whereIn('status', ['pending', 'paid', 'success'])
            ->exists();
    }

    /** Bấm thanh toán: KHÔNG tạo Order. Lưu payload vào Cache + trả URL VNPay */
    public function redirectToGateway(Request $request)
    {
        try {
            Log::info('VNPay payment request received:', $request->all());

            $request->validate([
                'method' => 'required|string|in:vnpay',
                'amount' => 'required|numeric|min:1000',
                'orderItems' => 'required|array|min:1',
                'orderItems.*.menu_id' => 'required|integer|exists:menus,id',
                'orderItems.*.room_id' => 'required|integer|exists:rooms,id',
                'orderItems.*.room_slot_id' => 'required|integer|exists:room_slots,id',
                'orderItems.*.quantity' => 'required|integer|min:1',
                'orderItems.*.price' => 'required|numeric|min:0',
                'orderItems.*.service_id' => 'nullable|integer|exists:services,id',
                'user_id' => 'nullable|integer|exists:users,id',
                'voucher_id' => 'nullable|integer|exists:vouchers,id',
                'selectedDate' => 'required|date',
                'selectedTime' => 'required|string',
//                'tableCount' => 'nullable|integer|min:1',
                'roomInfo' => 'nullable|array',
                'serviceInfo' => 'nullable|array',
            ]);

            $method      = $request->input('method');
            $orderItems  = $request->input('orderItems');
            $userId      = $request->input('user_id');
            $voucherId   = $request->input('voucher_id');
            $selectedDate= $request->input('selectedDate');
            $selectedTime= $this->convertTimeSlot($request->input('selectedTime'));
//            $tableCount  = (int)$request->input('tableCount', 1);
            $roomInfo    = $request->input('roomInfo');
            $serviceInfo = $request->input('serviceInfo');
            $validated = $this->validateOrderItems($orderItems);

            if (!$validated['success']) {
                Log::error('Order items validation failed:', $validated['errors']);
                return response()->json([
                    'success' => false,
                    'error' => 'Danh sách món ăn không hợp lệ',
                    'errors' => $validated['errors']
                ], 422);
            }

            // 1) Tổng gốc
            $baseTotal = $this->calculateBaseTotal($validated['items'], $roomInfo);

            // 2) Áp dụng voucher
            $voucherResult = $this->applyVoucher($voucherId, $baseTotal);
            if (!$voucherResult['ok']) {
                return response()->json([
                    'success' => false,
                    'error' => $voucherResult['reason'] ?? 'Voucher không hợp lệ'
                ], 422);
            }

            if ($this->hasUserUsedVoucherSuccessful($userId, $voucherId)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Voucher này bạn đã sử dụng ở một đơn đã thanh toán trước đó.'
                ], 422);
            }

            $discount = $voucherResult['discount'];
            $finalTotal = max(0, $baseTotal - $discount);

            // 3) Thu 30% (đặt cọc)
            $depositPercent = 30;
            $depositAmount = (int)round($finalTotal * $depositPercent / 100);
            $balanceAmount = (int)max(0, $finalTotal - $depositAmount); // NEW

            // 4) Không tạo order — lưu payload vào Cache
            $vnp_TxnRef = 'ORD' . time() . rand(100, 999);
            $payload = [
                'user_id' => $userId,
                'voucher_id' => $voucherId,
                'method' => $method,
                'selected_date' => $selectedDate,
                'selected_time' => $selectedTime,
               // 'table_count' => $tableCount,
                'service_id' => $serviceInfo['id'] ?? null,
                'room_id' => $roomInfo['id'] ?? null,
                'items' => $validated['items'],
                'calc' => [
                    'base_total'      => $baseTotal,
                    'discount'        => $discount,
                    'final_total'     => $finalTotal,
                    'deposit_percent' => $depositPercent,
                    'deposit_amount'  => $depositAmount,
                ],
            ];
            Cache::put("pay:$vnp_TxnRef", $payload, now()->addHours(2));

            // 5) Tạo link VNPay với số tiền = đặt cọc
            if (!$this->vnp_TmnCode || !$this->vnp_HashSecret || !$this->vnp_Url || !$this->vnp_ReturnUrl) {
                throw new \Exception('Cấu hình VNPay không đầy đủ');
            }

            $vnp_OrderInfo = "Thanh toan dat coc 30% GD #" . $vnp_TxnRef;
            $vnp_Amount = $depositAmount * 100; // x100 theo chuẩn VNPay
            $vnp_Locale = 'vn';
            $vnp_IpAddr = $this->getClientIP($request);

            date_default_timezone_set('Asia/Ho_Chi_Minh');
            $vnp_CreateDate = date('YmdHis');
            $vnp_ExpireDate = date('YmdHis', strtotime('+30 minutes'));

            $inputData = [
                "vnp_Version" => "2.1.0",
                "vnp_TmnCode" => $this->vnp_TmnCode,
                "vnp_Amount" => $vnp_Amount,
                "vnp_Command" => "pay",
                "vnp_CreateDate" => $vnp_CreateDate,
                "vnp_CurrCode" => "VND",
                "vnp_IpAddr" => $vnp_IpAddr,
                "vnp_Locale" => $vnp_Locale,
                "vnp_OrderInfo" => $vnp_OrderInfo,
                "vnp_OrderType" => 'other',
                "vnp_ReturnUrl" => $this->vnp_ReturnUrl,
                "vnp_TxnRef" => $vnp_TxnRef,
                "vnp_ExpireDate" => $vnp_ExpireDate
            ];

            ksort($inputData);
            $query = "";
            $i = 0;
            $hashdata = "";
            foreach ($inputData as $key => $value) {
                if ($i == 1) {
                    $hashdata .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashdata .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
                $query .= urlencode($key) . "=" . urlencode($value) . '&';
            }

            $vnp_Url = $this->vnp_Url . "?" . $query;
            $vnpSecureHash = hash_hmac('sha512', $hashdata, $this->vnp_HashSecret);
            $vnp_Url .= 'vnp_SecureHash=' . $vnpSecureHash;

            return response()->json([
                'success' => true,
                'url' => $vnp_Url,
                'vnp_TxnRef' => $vnp_TxnRef,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', $e->errors());
            return response()->json([
                'success' => false,
                'error' => 'Dữ liệu không hợp lệ',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('VNPay Payment Error (redirect):', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json([
                'success' => false,
                'error' => 'Lỗi khi xử lý thanh toán VNPay: ' . $e->getMessage()
            ], 500);
        }
    }

    /** VNPay callback: chỉ khi thành công mới tạo Order */
    public function returnFromVnpay(Request $request)
    {
        try {
            Log::info('VNPay return callback received:', $request->all());

            $vnp_SecureHash = $request->vnp_SecureHash;
            $inputData = $request->all();
            unset($inputData['vnp_SecureHash'], $inputData['vnp_SecureHashType']);

            ksort($inputData);
            $i = 0;
            $hashData = "";
            foreach ($inputData as $key => $value) {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
            }
            $secureHash = hash_hmac('sha512', $hashData, $this->vnp_HashSecret);
            $vnp_TxnRef = $request->vnp_TxnRef;

            if ($secureHash !== $vnp_SecureHash) {
                Log::error('Invalid VNPay signature', [
                    'vnp_TxnRef' => $vnp_TxnRef,
                    'expected' => $secureHash,
                    'received' => $vnp_SecureHash
                ]);
                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                    . '/payment?status=failed&order_id=0&message=' . urlencode('Chữ ký không hợp lệ'));
            }

            // Thành công
            if ($request->vnp_ResponseCode == '00') {
                $payload = Cache::get("pay:$vnp_TxnRef");
                if (!$payload) {
                    Log::error('Missing cached payload for successful VNPay', ['vnp_TxnRef' => $vnp_TxnRef]);
                    return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                        . '/payment?status=failed&order_id=0&message=' . urlencode('Thiếu dữ liệu phiên thanh toán'));
                }

                // Idempotent
                $existing = Order::where('vnpay_order_id', $vnp_TxnRef)->first();
                if ($existing && in_array($existing->status, ['pending', 'paid', 'success'])) {
                    Cache::forget("pay:$vnp_TxnRef");
                    return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                        . '/payment?status=success&order_id=' . $existing->id . '&message=' . urlencode('Thanh toán thành công'));
                }

                DB::beginTransaction();

                $deposit = (int)($payload['calc']['deposit_amount'] ?? 0);
                $final   = (int)($payload['calc']['final_total'] ?? 0);
                $order = Order::create([
                    'user_id'        => $payload['user_id'],
                    'total_amount'   => $final,
                    'deposit_amount' => $deposit,                 // NEW
                    'balance_amount' => max(0, $final - $deposit),// NEW
                    'voucher_id'     => $payload['voucher_id'],
                    'status'         => 'pending',
                    'date'           => $payload['selected_date'],
                    'time'           => $payload['selected_time'],
                    'method'         => $payload['method'],
                    // Lưu cả dữ liệu calc để FE đọc được discount
                    'payment_data'   => json_encode([
                        'gateway' => 'vnpay',
                        'vnp'     => $request->all(),
                        'calc'    => $payload['calc'],
                    ]),
//                    'table_count'    => $payload['table_count'],
//                    'guest_count'    => $payload['table_count'] * 10,
                    'service_id'     => $payload['service_id'],
                    'room_id'        => $payload['room_id'],
                    'vnpay_order_id' => $vnp_TxnRef,
                    'trans_id'       => $request->vnp_TransactionNo ?? null,
                ]);


                foreach ($payload['items'] as $it) {
                    OrderDetail::create([
                        'order_id' => $order->id,
                        'menu_id' => $it['menu_id'],
                        'room_id' => $it['room_id'],
                        'room_slot_id' => $it['room_slot_id'],
                        'quantity' => $it['quantity'],
                        'price' => $it['price'],
                        'service_id' => $it['service_id'] ?? null,
                    ]);
                }

                $this->updateRoomSlotAvailability($order->id);

                if ($order->user_id) {
                    $this->clearUserCart($order->user_id);
                }

                DB::commit();

                Cache::forget("pay:$vnp_TxnRef");

                Log::info('VNPay payment successful, order created', ['order_id' => $order->id]);

                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                    . '/payment?status=success&order_id=' . $order->id . '&message=' . urlencode('Thanh toán thành công'));
            }

            // Thất bại
            $errorMessage = $this->getVNPayErrorMessage($request->vnp_ResponseCode);
            Log::warning('VNPay payment failed', [
                'vnp_TxnRef' => $vnp_TxnRef,
                'response_code' => $request->vnp_ResponseCode,
                'error_message' => $errorMessage
            ]);

            Cache::forget("pay:$vnp_TxnRef");

            return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                . '/payment?status=failed&order_id=0&message=' . urlencode($errorMessage));
        } catch (\Exception $e) {
            Log::error('VNPay return error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173')
                . '/payment?status=failed&order_id=0&message=' . urlencode('Lỗi hệ thống'));
        }
    }

    /** Cho các đơn cũ còn pending */
    public function checkStatus(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|integer|exists:orders,id'
            ]);

            $orderId = $request->input('order_id');
            $order = Order::with([
                'details.menu:id,name,price',
                'details.room:id,name,capacity,price',
                'details.service:id,name',
                'room:id,name,capacity,price',
                'service:id,name,description'
            ])->findOrFail($orderId);

            if ($order->status === 'pending' && $order->vnpay_order_id && $order->method === 'vnpay') {
                $vnpayStatus = $this->checkVNPayStatus($order->vnpay_order_id);

                if ($vnpayStatus['success']) {
                    if (($vnpayStatus['data']['vnp_ResponseCode'] ?? null) == '00') {
                        DB::beginTransaction();

                        $order->update([
                            'status' => 'pending',
                            'payment_data' => json_encode($vnpayStatus['data']),
                            'trans_id' => $vnpayStatus['data']['vnp_TransactionNo'] ?? null
                        ]);

                        $this->updateRoomSlotAvailability($order->id);

                        if ($order->user_id) {
                            $this->clearUserCart($order->user_id);
                            Log::info('Cart cleared after successful VNPay payment status check for user: ' . $order->user_id);
                        }

                        DB::commit();
                    } else {
                        $order->update([
                            'status' => 'failed',
                            'payment_data' => json_encode($vnpayStatus['data'])
                        ]);
                    }
                }
            }

            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'total_amount' => $order->total_amount,
                    'deposit_amount' => $order->deposit_amount, // NEW
                    'balance_amount' => $order->balance_amount, // NEW
//                    'table_count' => $order->table_count,
//                    'guest_count' => $order->guest_count,
                    'date' => $order->date,
                    'time' => $order->time,
                    'method' => $order->method,
                    'service' => $order->service,
                    'room' => $order->room,
                    'created_at' => $order->created_at,
                    'details' => $order->details
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('VNPay status check error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Lỗi khi kiểm tra trạng thái'], 500);
        }
    }

    private function validateOrderItems($orderItems)
    {
        $errors = [];
        $validatedItems = [];

        foreach ($orderItems as $index => $item) {
            $itemErrors = [];
            $requiredFields = ['menu_id', 'room_id', 'room_slot_id', 'quantity', 'price'];

            foreach ($requiredFields as $field) {
                if (!isset($item[$field]) || !is_numeric($item[$field]) ||
                    ($field === 'quantity' && $item[$field] < 1) ||
                    ($field === 'price' && $item[$field] < 0)) {
                    $itemErrors[] = "{$field} không hợp lệ";
                }
            }

            if (isset($item['service_id']) && (!is_numeric($item['service_id']) || $item['service_id'] < 1)) {
                $itemErrors[] = 'service_id không hợp lệ';
            }

            if (!empty($itemErrors)) {
                $errors["item_$index"] = $itemErrors;
                continue;
            }

            $menu = Menu::where('id', $item['menu_id'])->where('status', 1)->first();
            if (!$menu) {
                $errors["item_$index"] = ['Menu không tồn tại hoặc đã bị vô hiệu hóa'];
                continue;
            }

            $room = Room::where('id', $item['room_id'])->first();
            if (!$room) {
                $errors["item_$index"] = ['Phòng không tồn tại'];
                continue;
            }

            $roomSlot = RoomSlot::where('id', $item['room_slot_id'])->first();
            if (!$roomSlot) {
                $errors["item_$index"] = ['Slot phòng không tồn tại'];
                continue;
            }

            if (isset($item['service_id'])) {
                $service = Service::where('id', $item['service_id'])->first();
                if (!$service) {
                    $errors["item_$index"] = ['Dịch vụ không tồn tại'];
                    continue;
                }
            }

            if (abs($item['price'] - $menu->price) > 0.01) {
                Log::warning('Price mismatch detected:', [
                    'menu_id' => $menu->id,
                    'menu_price' => $menu->price,
                    'submitted_price' => $item['price']
                ]);
                $item['price'] = $menu->price;
            }

            $validatedItems[] = [
                'menu_id' => (int)$item['menu_id'],
                'room_id' => (int)$item['room_id'],
                'room_slot_id' => (int)$item['room_slot_id'],
                'quantity' => (int)$item['quantity'],
                'price' => (float)$item['price'],
                'service_id' => isset($item['service_id']) ? (int)$item['service_id'] : null,
                'menu_name' => $menu->name
            ];
        }

        return [
            'success' => empty($errors),
            'errors' => $errors,
            'items' => $validatedItems
        ];
    }

    private function getClientIP($request)
    {
        $ipKeys = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_CLIENT_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_FORWARDED',
            'HTTP_X_CLUSTER_CLIENT_IP',
            'HTTP_FORWARDED_FOR',
            'HTTP_FORWARDED',
            'REMOTE_ADDR'
        ];

        foreach ($ipKeys as $key) {
            if ($request->server($key)) {
                $ip = $request->server($key);
                if (strpos($ip, ',') !== false) $ip = trim(explode(',', $ip)[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                    return $ip;
                }
            }
        }

        return '203.113.167.1';
    }

    private function getVNPayErrorMessage($responseCode)
    {
        $errorMessages = [
            '01' => 'Giao dịch chưa hoàn tất',
            '02' => 'Giao dịch bị lỗi',
            '04' => 'Giao dịch đảo',
            '05' => 'VNPAY đang xử lý giao dịch này (GD hoàn tiền)',
            '06' => 'VNPAY đã gửi yêu cầu hoàn tiền sang Ngân hàng (GD hoàn tiền)',
            '07' => 'Giao dịch bị nghi ngờ gian lận',
            '09' => 'GD Hoàn trả bị từ chối',
            '10' => 'Đã giao hàng',
            '11' => 'Giao dịch chưa thanh toán được hoàn trả',
            '12' => 'Giao dịch không thể hoàn trả toàn phần',
            '13' => 'Giao dịch chưa được phép hoàn trả một phần',
            '21' => 'Số tiền thanh toán không hợp lệ',
            '22' => 'Thông tin tài khoản không hợp lệ',
            '23' => 'Mã xác thực không hợp lệ',
            '24' => 'Thông tin khách hàng không chính xác',
            '25' => 'Giao dịch chưa được phép thực hiện',
            '64' => 'Số tiền GD vượt quá hạn mức thanh toán',
            '75' => 'Ngân hàng thanh toán đang bảo trì',
            '79' => 'Sai mật khẩu thanh toán quá số lần quy định',
            '99' => 'Lỗi không xác định'
        ];
        return $errorMessages[$responseCode] ?? 'Giao dịch thất bại với mã lỗi: ' . $responseCode;
    }

    private function checkVNPayStatus($vnp_TxnRef)
    {
        try {
            $vnp_RequestId = time() . '_' . Str::random(8);
            $vnp_Command = 'querydr';
            $vnp_CreateDate = date('YmdHis');
            $vnp_IpAddr = request()->ip() ?: '127.0.0.1';

            $data = [
                'vnp_Version' => '2.1.0',
                'vnp_Command' => $vnp_Command,
                'vnp_TmnCode' => $this->vnp_TmnCode,
                'vnp_TxnRef' => $vnp_TxnRef,
                'vnp_OrderInfo' => 'Kiem tra trang thai giao dich ' . $vnp_TxnRef,
                'vnp_TransDate' => date('YmdHis'),
                'vnp_CreateDate' => $vnp_CreateDate,
                'vnp_IpAddr' => $vnp_IpAddr,
                'vnp_RequestId' => $vnp_RequestId
            ];

            ksort($data);
            $i = 0;
            $hashData = "";
            foreach ($data as $key => $value) {
                if ($i == 1) {
                    $hashData .= '&' . urlencode($key) . "=" . urlencode($value);
                } else {
                    $hashData .= urlencode($key) . "=" . urlencode($value);
                    $i = 1;
                }
            }

            $vnp_SecureHash = hash_hmac('sha512', $hashData, $this->vnp_HashSecret);
            $data['vnp_SecureHash'] = $vnp_SecureHash;

            $response = Http::timeout(30)
                ->asForm()
                ->post('https://sandbox.vnpayment.vn/merchant_webapi/api/transaction', $data);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }
            return ['success' => false, 'message' => 'Lỗi khi kiểm tra trạng thái VNPay: ' . $response->status()];
        } catch (\Exception $e) {
            Log::error('VNPay status check error: ' . $e->getMessage(), ['exception' => $e]);
            return ['success' => false, 'message' => 'Lỗi kết nối đến dịch vụ VNPay'];
        }
    }

    private function clearUserCart($userId)
    {
        try {
            if ($userId) {
                $deletedCount = CartDetail::where('user_id', $userId)->delete();
                Log::info("Cart cleared for user {$userId}: {$deletedCount} items deleted");
                return $deletedCount > 0;
            }
            return false;
        } catch (\Exception $e) {
            Log::error("Error clearing cart for user {$userId}: " . $e->getMessage());
            return false;
        }
    }

    // Hàm mới: cộng tiền món + phòng + bàn
    private function calculateBaseTotal(array $validatedItems, ?array $roomInfo): int
    {
        $food = 0;
        foreach ($validatedItems as $it) {
            $food += (int) round($it['price'] * $it['quantity']);
        }

        $roomPrice = 0;
        if ($roomInfo && isset($roomInfo['id'])) {
            $room = Room::find($roomInfo['id']);
            if ($room && isset($room->price)) $roomPrice = (int) $room->price;
        }

//        $tableFeePerTable = 0;
//        if ($roomInfo && isset($roomInfo['table_fee_per_table'])) {
//            $tableFeePerTable = (int) $roomInfo['table_fee_per_table'];
//        }
       // $tableFeeTotal = max(0, $tableCount) * $tableFeePerTable;

        return (int) ($food + $roomPrice);
    }


    private function applyVoucher(?int $voucherId, int $baseTotal): array
    {
        if (!$voucherId) {
            return ['ok' => true, 'discount' => 0, 'voucher' => null, 'reason' => null];
        }

        $v = Voucher::find($voucherId);
        if (!$v) {
            return ['ok' => false, 'discount' => 0, 'voucher' => null, 'reason' => 'Voucher không tồn tại'];
        }

        $today = Carbon::today();
        if (!$v->status) {
            return ['ok' => false, 'discount' => 0, 'voucher' => null, 'reason' => 'Voucher đã bị vô hiệu hóa'];
        }
        if ($v->start_date && $today->lt($v->start_date)) {
            return ['ok' => false, 'discount' => 0, 'voucher' => null, 'reason' => 'Voucher chưa đến thời gian áp dụng'];
        }
        if ($v->end_date && $today->gt($v->end_date)) {
            return ['ok' => false, 'discount' => 0, 'voucher' => null, 'reason' => 'Voucher đã hết hạn'];
        }

        $min = (int)($v->min_order_total ?? 0);
        if ($baseTotal < $min) {
            return [
                'ok' => false,
                'discount' => 0,
                'voucher' => null,
                'reason' => "Đơn tối thiểu phải từ " . number_format($min) . "đ mới dùng được voucher"
            ];
        }

        $discount = 0;
        $type = strtolower($v->type ?? 'fixed');
        $val = (float)$v->value;

        if ($type === 'percent') {
            $discount = (int)round($baseTotal * ($val / 100));
        } else {
            $discount = (int)round($val);
        }

        $discount = max(0, min($discount, $baseTotal));

        return ['ok' => true, 'discount' => $discount, 'voucher' => $v, 'reason' => null];
    }
}
