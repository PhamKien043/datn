<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

use App\Models\Menu;
use App\Models\Room;
use App\Models\Service;
use App\Models\RoomSlot;
use App\Models\CartDetail;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Voucher;

class PaymentController extends Controller
{
    private $nodeJsUrl;
    private $momoSecretKey;

    public function __construct()
    {
        $this->nodeJsUrl = env('NODEJS_PAYMENT_URL', 'http://localhost:5000');
        $this->momoSecretKey = env('MOMO_SECRET_KEY', 'K951B6PE1waDMi640xX08PD3vg6EkVlz');
    }

    /* ==================== Helper chung ==================== */

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
                $slot = RoomSlot::lockForUpdate()->find($detail->room_slot_id);
                if ($slot && $slot->is_available) {
                    $slot->update(['is_available' => false]);
                    Log::info('Room slot updated to unavailable', [
                        'room_slot_id' => $slot->id,
                        'order_id' => $orderId
                    ]);
                }
            }
        } catch (\Exception $e) {
            Log::error('Error updating room slot availability', [
                'order_id' => $orderId,
                'message' => $e->getMessage()
            ]);
        }
    }

    private function clearUserCart($userId)
    {
        try {
            if ($userId) {
                $deletedCount = CartDetail::where('user_id', $userId)->delete();
                Log::info("Cart cleared for user {$userId}: {$deletedCount} items deleted");
                return true;
            }
            return false;
        } catch (\Exception $e) {
            Log::error("Error clearing cart for user {$userId}: " . $e->getMessage());
            return false;
        }
    }
    private function calculateBaseTotal(array $validatedItems, ?array $roomInfo): int

    {
        // Tiền món
        $food = 0;
        foreach ($validatedItems as $it) {
            $food += (int) round($it['price'] * $it['quantity']);
        }

        // Giá phòng: lấy giá cố định (không nhân theo bàn, không cộng phí dịch vụ)
        $roomPrice = 0;
        if ($roomInfo && isset($roomInfo['id'])) {
            $room = Room::find($roomInfo['id']);
            if ($room && isset($room->price)) {
                $roomPrice = (int) $room->price;
            }
        }

        return (int) ($food + $roomPrice);
    }



    /**
     * Chặn nếu user đã từng có đơn thành công với voucher này.
     * Không đụng DB schema, chỉ check theo Order đã "completed/paid/success".
     */
    private function hasUserUsedVoucherSuccessful(?int $userId, ?int $voucherId): bool
    {
        if (!$userId || !$voucherId) return false;
        return Order::where('user_id', $userId)
            ->where('voucher_id', $voucherId)
            ->whereIn('status', ['pending', 'paid', 'success'])
            ->exists();
    }

    /**
     * Validate + tính giảm giá của voucher theo tổng gốc.
     */
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
                'ok' => false, 'discount' => 0, 'voucher' => null,
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

    private function validateOrderItems($orderItems)
    {
        $errors = [];
        $validatedItems = [];

        foreach ($orderItems as $index => $item) {
            $itemErrors = [];

            $mustNumeric = [
                'menu_id' => 'menu_id',
                'room_id' => 'room_id',
                'room_slot_id' => 'room_slot_id',
                'quantity' => 'quantity',
                'price' => 'price',
            ];

            foreach ($mustNumeric as $key => $label) {
                if (!isset($item[$key]) || !is_numeric($item[$key])) {
                    $itemErrors[] = "$label không hợp lệ";
                }
            }

            if (!isset($item['quantity']) || $item['quantity'] < 1) $itemErrors[] = 'quantity không hợp lệ';
            if (!isset($item['price']) || $item['price'] < 0) $itemErrors[] = 'price không hợp lệ';

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

            $room = Room::find($item['room_id']);
            if (!$room) {
                $errors["item_$index"] = ['Phòng không tồn tại'];
                continue;
            }

            $roomSlot = RoomSlot::find($item['room_slot_id']);
            if (!$roomSlot) {
                $errors["item_$index"] = ['Slot phòng không tồn tại'];
                continue;
            }

            if (isset($item['service_id'])) {
                $service = Service::find($item['service_id']);
                if (!$service) {
                    $errors["item_$index"] = ['Dịch vụ không tồn tại'];
                    continue;
                }
            }

            // chỉnh giá theo DB nếu lệch
            if (abs($item['price'] - $menu->price) > 0.01) {
                Log::warning('Price mismatch detected:', [
                    'menu_id' => $menu->id,
                    'menu_price' => $menu->price,
                    'submitted_price' => $item['price']
                ]);
                $item['price'] = $menu->price;
            }

            $validatedItem = [
                'menu_id' => (int)$item['menu_id'],
                'room_id' => (int)$item['room_id'],
                'room_slot_id' => (int)$item['room_slot_id'],
                'quantity' => (int)$item['quantity'],
                'price' => (float)$item['price'],
                'service_id' => isset($item['service_id']) ? (int)$item['service_id'] : null,
                'menu_name' => $menu->name,
                'room_name' => $room->name,
            ];

            $validatedItems[] = $validatedItem;
        }

        return [
            'success' => empty($errors),
            'errors' => $errors,
            'items' => $validatedItems
        ];
    }

    /* ==================== Public APIs ==================== */

    public function getMenus()
    {
        try {
            $menus = Menu::select('id', 'name', 'price', 'status')->where('status', 1)->get();
            return response()->json(['success' => true, 'data' => $menus]);
        } catch (\Exception $e) {
            Log::error('Error fetching menus: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi lấy danh sách menu'], 500);
        }
    }

    public function getRooms()
    {
        try {
            $rooms = Room::select('id', 'name', 'price', 'capacity')->get();
            return response()->json(['success' => true, 'data' => $rooms]);
        } catch (\Exception $e) {
            Log::error('Error fetching rooms: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi lấy danh sách phòng'], 500);
        }
    }

    public function getRoomSlots(Request $request)
    {
        try {
            $request->validate([
                'room_id' => 'required|integer|exists:rooms,id',
                'slot_date' => 'required|date',
                'time_slot' => 'required|string',
            ]);

            $roomSlots = RoomSlot::where('room_id', $request->room_id)
                ->where('slot_date', $request->slot_date)
                ->where('time_slot', $request->time_slot)
                ->get();

            return response()->json(['success' => true, 'data' => $roomSlots]);
        } catch (\Exception $e) {
            Log::error('Error fetching room slots: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi lấy danh sách slot phòng'], 500);
        }
    }

    public function getCartForPayment(Request $request)
    {
        try {
            $userId = $request->input('user_id');
            if (!$userId) {
                return response()->json(['success' => false, 'error' => 'Không tìm thấy thông tin người dùng'], 400);
            }

            $cartItems = CartDetail::with([
                'menu:id,name,price,image',
                'room:id,name,price,capacity,image',
                'service:id,name,description',
                'locationType:id,name,descriptions',
                'roomSlot:id,slot_date,time_slot,is_available'
            ])->where('user_id', $userId)->get();

            if ($cartItems->isEmpty()) {
                return response()->json(['success' => false, 'error' => 'Giỏ hàng trống'], 400);
            }

            $foodTotal = $cartItems->sum(fn($i) => $i->quantity * $i->price_per_table);
            $tableCount = $cartItems->first()->quantity ?? 1;
            $room = $cartItems->first()->room;
            $roomTotal = $room ? $room->price * $tableCount : 0;
            $total = $foodTotal + $roomTotal;

            $orderItems = $cartItems->map(function ($item) {
                return [
                    'menu_id' => $item->menu_id,
                    'room_id' => $item->room_id,
                    'room_slot_id' => $item->room_slot_id,
                    'quantity' => $item->quantity,
                    'price' => $item->price_per_table,
                    'service_id' => $item->service_id,
                    'name' => $item->menu->name ?? '',
                ];
            });

            $first = $cartItems->first();
            $bookingInfo = [
                'service' => $first->service,
                'location_type' => $first->locationType,
                'room' => $first->room,
                'room_slot' => $first->roomSlot,
                'selected_date' => $first->selected_date,
                'selected_time_slot' => $first->selected_time_slot,
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'cart_items' => $cartItems,
                    'order_items' => $orderItems,
                    'booking_info' => $bookingInfo,
                    'pricing' => [
                        'food_total' => $foodTotal,
                        'room_total' => $roomTotal,
                        'total_amount' => $total,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error getting cart for payment: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi lấy thông tin giỏ hàng'], 500);
        }
    }

    /**
     * Redirect tạo payUrl MoMo:
     * - KHÔNG tạo Order.
     * - Lưu payload vào Cache (TTL 2h).
     * - Số tiền gửi sang MoMo = 30% đặt cọc.
     */
    public function redirectToGateway(Request $request)
    {
        try {
            Log::info('Payment request received (MoMo):', $request->all());

            $request->validate([
                'method' => 'required|string|in:momo',
                'amount' => 'required|numeric|min:1000',
                'orderItems' => 'required|array|min:1',
                'orderItems.*.menu_id' => 'required|integer|exists:menus,id',
                'orderItems.*.room_id' => 'required|integer|exists:rooms,id',
                'orderItems.*.room_slot_id' => 'required|integer|exists:room_slots,id',
                'orderItems.*.quantity' => 'required|integer|min:1',
                'orderItems.*.price' => 'required|numeric|min:0',
                'orderItems.*.service_id' => 'nullable|integer|exists:services,id',
                'user_id' => 'required|integer|exists:users,id',
                'voucher_id' => 'nullable|integer|exists:vouchers,id',
                'selectedDate' => 'required|date',
                'selectedTime' => 'required|string',
                'roomInfo' => 'nullable|array',
                'serviceInfo' => 'nullable|array',
            ]);

            $method        = $request->input('method'); // momo
            $orderItemsReq = $request->input('orderItems');
            $userId        = (int)$request->input('user_id');
            $voucherId     = $request->input('voucher_id');
            $selectedDate  = $request->input('selectedDate');
            $selectedTime  = $this->convertTimeSlot($request->input('selectedTime'));
            $roomInfo      = $request->input('roomInfo');
            $serviceInfo   = $request->input('serviceInfo');

            // Validate items
            $validated = $this->validateOrderItems($orderItemsReq);
            if (!$validated['success']) {
                Log::error('Order items validation failed:', $validated['errors']);
                return response()->json([
                    'success' => false,
                    'error' => 'Danh sách món ăn không hợp lệ',
                    'errors' => $validated['errors']
                ], 422);
            }

            // Tính tổng gốc + voucher (KHÔNG phí bàn/dịch vụ/bàn)
            $baseTotal = $this->calculateBaseTotal($validated['items'], $roomInfo);

            $voucherResult = $this->applyVoucher($voucherId, $baseTotal);
            if (!$voucherResult['ok']) {
                return response()->json(['success' => false, 'error' => $voucherResult['reason'] ?? 'Voucher không hợp lệ'], 422);
            }
            if ($this->hasUserUsedVoucherSuccessful($userId, $voucherId)) {
                return response()->json(['success' => false, 'error' => 'Bạn đã sử dụng voucher này ở một đơn đã thanh toán trước đó.'], 422);
            }

            $discount   = $voucherResult['discount'];
            $finalTotal = max(0, $baseTotal - $discount);

            $depositPercent = 30;
            $depositAmount  = (int)round($finalTotal * $depositPercent / 100);

            $momoOrderId = 'ORDER_' . time() . '_' . Str::random(12);

            Cache::put("momo:$momoOrderId", [
                'user_id' => $userId,
                'voucher_id' => $voucherId,
                'selected_date' => $selectedDate,
                'selected_time' => $selectedTime,
                'service_id' => $serviceInfo['id'] ?? null,
                'room_id' => $roomInfo['id'] ?? null,
                'items' => $validated['items'],
                'calc' => [
                    'base_total'      => $baseTotal,
                    'discount'        => $discount,
                    'final_total'     => $finalTotal,
                    'deposit_percent' => $depositPercent,
                    'deposit_amount'  => $depositAmount
                ],
                // optional hiển thị
                'service_info' => $serviceInfo,
                'room_info' => $roomInfo,
            ], now()->addHours(2));

            // Gọi Node service để lấy payUrl (amount = tiền cọc)
            $orderInfoStr = 'Thanh toán đặt cọc 30%';
            if (!empty($serviceInfo['name'])) $orderInfoStr .= ' - ' . $serviceInfo['name'];
            if (!empty($roomInfo['name'])) $orderInfoStr .= ' - ' . $roomInfo['name'];

            $extraDataArray = [
                'momo_order_id' => $momoOrderId,
                'user_id' => $userId,
                'voucher_id' => $voucherId,
            ];

            $response = Http::timeout(30)->post($this->nodeJsUrl . '/payment', [
                'amount' => $depositAmount,
                'orderId' => $momoOrderId,
                'orderInfo' => $orderInfoStr,
                'extraData' => base64_encode(json_encode($extraDataArray)),
                'returnUrl' => rtrim(env('APP_URL'), '/') . '/api/payment/return',
                'notifyUrl' => rtrim(env('APP_URL'), '/') . '/api/payment/callback'
            ]);

            Log::info('MoMo service response:', ['status' => $response->status(), 'body' => $response->body()]);

            if ($response->successful()) {
                $data = $response->json();
                if (isset($data['data']['payUrl']) && ($data['success'] ?? false)) {
                    return response()->json([
                        'success' => true,
                        'url' => $data['data']['payUrl'],
                        'payment_order_id' => $momoOrderId
                    ]);
                }
                return response()->json(['success' => false, 'error' => $data['message'] ?? 'Không thể tạo giao dịch MoMo'], 500);
            }

            return response()->json(['success' => false, 'error' => 'Lỗi kết nối đến dịch vụ MoMo: ' . $response->status()], 500);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation Error:', $e->errors());
            return response()->json(['success' => false, 'error' => 'Dữ liệu không hợp lệ', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('Payment Error (redirect): ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['success' => false, 'error' => 'Lỗi khi xử lý thanh toán: ' . $e->getMessage()], 500);
        }
    }


    /**
     * Return URL (trình duyệt khách quay về).
     * Nếu thanh toán thành công -> tạo Order (idempotent), ngược lại không tạo.
     */
    public function returnFromMomo(Request $request)
    {
        try {
            Log::info('MoMo return:', $request->all());

            $resultCode = $request->input('resultCode');
            $momoOrderId = $request->input('orderId');
            $message = $request->input('message', 'Unknown');

            if (!$momoOrderId) {
                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=failed&order_id=0&message=' . urlencode('Thiếu orderId'));
            }

            if ((int)$resultCode !== 0) {
                // thất bại: không tạo order
                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=failed&order_id=0&message=' . urlencode($message));
            }

            // Thành công: tạo Order nếu chưa có (idempotent)
            $existing = Order::where('momo_order_id', $momoOrderId)->whereIn('status', ['pending', 'paid', 'success'])->first();
            if ($existing) {
                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=success&order_id=' . $existing->id . '&message=' . urlencode('Thanh toán thành công'));
            }

            $payload = Cache::get("momo:$momoOrderId");
            if (!$payload) {
                Log::error('Return missing payload from cache', ['momo_order_id' => $momoOrderId]);
                return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=failed&order_id=0&message=' . urlencode('Hết hạn phiên thanh toán'));
            }

            $finalTotal    = (int) ($payload['calc']['final_total'] ?? 0);
            $depositAmount = (int) ($payload['calc']['deposit_amount']
                ?? round($finalTotal * (($payload['calc']['deposit_percent'] ?? 30) / 100)));
            $balanceAmount = max(0, $finalTotal - $depositAmount);

            DB::beginTransaction();
            // Trong khối tạo Order:
            $order = Order::create([
                'user_id'        => $payload['user_id'],
                'total_amount'   => $finalTotal,
                'deposit_amount' => $depositAmount,
                'balance_amount' => $balanceAmount,
                'voucher_id'     => $payload['voucher_id'],
                'status'         => 'pending',
                'date'           => $payload['selected_date'],
                'time'           => $payload['selected_time'],
                'method'         => 'momo',
                'payment_url'    => '',
                'payment_data'   => json_encode($request->all()),
                'service_id'     => $payload['service_id'],
                'room_id'        => $payload['room_id'],
                'momo_order_id'  => $momoOrderId,
                'trans_id'       => $request->input('transId')
            ]);


            foreach ($payload['items'] as $it) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'menu_id' => $it['menu_id'],
                    'room_id' => $it['room_id'],
                    'room_slot_id' => $it['room_slot_id'],
                    'quantity' => $it['quantity'],
                    'price' => $it['price'],
                    'service_id' => $it['service_id'] ?? null
                ]);
            }

            $this->updateRoomSlotAvailability($order->id);
            if ($order->user_id) $this->clearUserCart($order->user_id);

            DB::commit();

            Cache::forget("momo:$momoOrderId");

            return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=success&order_id=' . $order->id . '&message=' . urlencode('Thanh toán thành công'));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Return error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return redirect()->to(env('FRONTEND_URL', 'http://localhost:5173') . '/payment?status=failed&order_id=0&message=' . urlencode('Lỗi hệ thống'));
        }
    }

    /**
     * Callback (IPN) từ MoMo: xác minh chữ ký + tạo Order (idempotent).
     */
    public function callback(Request $request)
    {
        Log::info('MoMo Callback received:', $request->all());

        try {
            $data = $request->all();
            $resultCode = $data['resultCode'] ?? null;
            $momoOrderId = $data['orderId'] ?? null;
            $amount = $data['amount'] ?? null;
            $orderInfo = $data['orderInfo'] ?? '';
            $extraData = $data['extraData'] ?? '';
            $requestId = $data['requestId'] ?? '';
            $transId = $data['transId'] ?? '';
            $payType = $data['payType'] ?? '';
            $responseTime = $data['responseTime'] ?? '';
            $message = $data['message'] ?? '';
            $signature = $data['signature'] ?? '';

            if (!$momoOrderId) {
                Log::error('Invalid callback: Missing orderId');
                return response()->json(['message' => 'Missing orderId'], 400);
            }

            // verify signature
            $rawSignature = "accessKey=" . env('MOMO_ACCESS_KEY') .
                "&amount=$amount" .
                "&extraData=$extraData" .
                "&message=$message" .
                "&orderId=$momoOrderId" .
                "&orderInfo=$orderInfo" .
                "&orderType=momo_wallet" .
                "&partnerCode=" . env('MOMO_PARTNER_CODE') .
                "&payType=$payType" .
                "&requestId=$requestId" .
                "&responseTime=$responseTime" .
                "&resultCode=$resultCode" .
                "&transId=$transId";
            $expectedSignature = hash_hmac('sha256', $rawSignature, $this->momoSecretKey);

            if ($signature !== $expectedSignature) {
                Log::error('Invalid signature', ['received' => $signature, 'expected' => $expectedSignature]);
                return response()->json(['message' => 'Invalid signature'], 400);
            }

            // Idempotent: nếu đã có order success -> ok
            $existing = Order::where('momo_order_id', $momoOrderId)->whereIn('status', ['pending', 'paid', 'success'])->first();
            if ($existing) {
                return response()->json(['message' => 'Already processed'], 200);
            }

            if ((int)$resultCode !== 0) {
                // thất bại: không tạo order
                Log::warning('MoMo payment failed', ['momo_order_id' => $momoOrderId, 'resultCode' => $resultCode]);
                return response()->json(['message' => 'Payment failed'], 200);
            }

            // Thành công: tạo Order từ cache
            $payload = Cache::get("momo:$momoOrderId");
            if (!$payload) {
                Log::error('Callback missing payload from cache', ['momo_order_id' => $momoOrderId]);
                return response()->json(['message' => 'Missing session payload'], 404);
            }

            $finalTotal    = (int) ($payload['calc']['final_total'] ?? 0);
            $depositAmount = (int) ($payload['calc']['deposit_amount']
                ?? round($finalTotal * (($payload['calc']['deposit_percent'] ?? 30) / 100)));
            $balanceAmount = max(0, $finalTotal - $depositAmount);

            DB::beginTransaction();
            $order = Order::create([
                'user_id'        => $payload['user_id'],
                'total_amount'   => $finalTotal,
                'deposit_amount' => $depositAmount,
                'balance_amount' => $balanceAmount,
                'voucher_id'     => $payload['voucher_id'],
                'status'         => 'pending',
                'date'           => $payload['selected_date'],
                'time'           => $payload['selected_time'],
                'method'         => 'momo',
                'payment_url'    => '',
                'payment_data'   => json_encode($data),
                'service_id'     => $payload['service_id'],
                'room_id'        => $payload['room_id'],
                'momo_order_id'  => $momoOrderId,
                'trans_id'       => $transId
            ]);

            foreach ($payload['items'] as $it) {
                OrderDetail::create([
                    'order_id' => $order->id,
                    'menu_id' => $it['menu_id'],
                    'room_id' => $it['room_id'],
                    'room_slot_id' => $it['room_slot_id'],
                    'quantity' => $it['quantity'],
                    'price' => $it['price'],
                    'service_id' => $it['service_id'] ?? null
                ]);
            }

            $this->updateRoomSlotAvailability($order->id);
            if ($order->user_id) $this->clearUserCart($order->user_id);

            DB::commit();

            Cache::forget("momo:$momoOrderId");

            return response()->json(['message' => 'Callback processed'], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Callback processing error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Callback processing error'], 500);
        }
    }

    /**
     * Optional: giữ lại để FE có thể hỏi lại trạng thái một order đã được tạo.
     * (Với flow mới, Order chỉ tồn tại khi đã thanh toán thành công.)
     */
    public function checkStatus(Request $request)
    {
        $request->validate(['order_id' => 'required|integer|exists:orders,id']);
        $orderId = $request->input('order_id');

        try {
            $order = Order::with([
                'details.menu:id,name,price',
                'details.room:id,name,capacity,price',
                'details.service:id,name',
                'room:id,name,capacity,price',
                'service:id,name,description'
            ])->findOrFail($orderId);

            // Fallback 30% nếu bản ghi cũ chưa có 2 cột này
            $finalTotal = (int) $order->total_amount;
            $deposit    = (int) ($order->deposit_amount ?? round($finalTotal * 0.3));
            $balance    = (int) ($order->balance_amount ?? max(0, $finalTotal - $deposit));

            return response()->json([
                'success' => true,
                'order' => [
                    'id' => $order->id,
                    'status' => $order->status,
                    'total_amount' => $finalTotal,
                    'deposit_amount' => $deposit,   //  trả ra
                    'balance_amount' => $balance,   //  trả ra
                    'date' => $order->date,
                    'time' => $order->time,
                    'method' => $order->method,
                    'service' => $order->service,
                    'room' => $order->room,
                    'created_at' => $order->created_at,
                    'details' => $order->details,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Status check error: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['error' => 'Lỗi khi kiểm tra trạng thái'], 500);
        }
    }


    private function checkMoMoStatus($momoOrderId)
    {
        try {
            $response = Http::timeout(30)->post($this->nodeJsUrl . '/check-status-transaction', [
                'orderId' => $momoOrderId
            ]);

            if ($response->successful()) {
                return ['success' => true, 'data' => $response->json()];
            }
            return ['success' => false, 'message' => 'Lỗi khi kiểm tra trạng thái MoMo: ' . $response->status()];
        } catch (\Exception $e) {
            Log::error('MoMo status check error: ' . $e->getMessage(), ['exception' => $e]);
            return ['success' => false, 'message' => 'Lỗi kết nối đến dịch vụ MoMo'];
        }
    }

    public function cancelOrder(Request $request)
    {
        try {
            $request->validate([
                'order_id' => 'required|integer|exists:orders,id',
                'reason' => 'nullable|string|max:500',
                'user_id' => 'required|integer|exists:users,id'
            ]);

            $order = Order::findOrFail($request->input('order_id'));
            $userId = (int)$request->input('user_id');
            $reason = $request->input('reason', 'Khách hàng hủy đơn');

            if ($order->user_id !== $userId) {
                return response()->json(['success' => false, 'error' => 'Bạn không có quyền hủy đơn hàng này'], 403);
            }

            if ($order->status !== 'pending') {
                return response()->json(['success' => false, 'error' => 'Không thể hủy đơn hàng này'], 400);
            }

            DB::beginTransaction();
            $order->update([
                'status' => 'cancelled',
                'payment_data' => json_encode([
                    'cancelled_at' => now(),
                    'cancel_reason' => $reason,
                    'cancelled_by' => 'user'
                ])
            ]);
            DB::commit();

            Log::info('Order cancelled', ['order_id' => $order->id, 'reason' => $reason, 'user_id' => $userId]);
            return response()->json(['success' => true, 'message' => 'Đơn hàng đã được hủy thành công']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error cancelling order: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi hủy đơn hàng'], 500);
        }
    }

    public function getUserOrders(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|integer|exists:users,id',
                'status' => 'nullable|string|in:pending,failed,cancelled,pending,paid,success',
                'limit' => 'nullable|integer|min:1|max:100',
                'offset' => 'nullable|integer|min:0'
            ]);

            $userId = (int)$request->input('user_id');
            $status = $request->input('status');
            $limit = (int)$request->input('limit', 10);
            $offset = (int)$request->input('offset', 0);

            $q = Order::with([
                'details.menu:id,name,price',
                'details.room:id,name',
                'service:id,name',
                'room:id,name'
            ])->where('user_id', $userId);

            if ($status) $q->where('status', $status);

            $orders = $q->orderBy('created_at', 'desc')
                ->limit($limit)->offset($offset)->get();

            $data = $orders->map(function ($o) {
                $finalTotal = (int) $o->total_amount;
                $deposit    = (int) ($o->deposit_amount ?? round($finalTotal * 0.3));
                $balance    = (int) ($o->balance_amount ?? max(0, $finalTotal - $deposit));

                return [
                    'id' => $o->id,
                    'status' => $o->status,
                    'total_amount' => $finalTotal,
                    'deposit_amount' => $deposit,     //  thêm
                    'balance_amount' => $balance,     //  thêm
                    'date' => $o->date,
                    'time' => $o->time,
                    'service' => $o->service,
                    'room' => $o->room,
                    'method' => $o->method,
                    'created_at' => $o->created_at,
                    'details_count' => $o->details->count(),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data,
                'pagination' => ['limit' => $limit, 'offset' => $offset, 'count' => $orders->count()]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting user orders: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Lỗi khi lấy danh sách đơn hàng'], 500);
        }
    }
}
