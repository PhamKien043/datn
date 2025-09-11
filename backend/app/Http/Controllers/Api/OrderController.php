<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\RoomSlot;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $userId = $request->query('user_id');

            if (!$userId || !is_numeric($userId)) {
                Log::warning('Invalid or missing user_id in orders request', ['user_id' => $userId]);
                return response()->json([
                    'success' => false,
                    'message' => 'User ID không hợp lệ',
                ], 400);
            }

            $userExists = DB::table('users')->where('id', $userId)->exists();
            if (!$userExists) {
                Log::warning('User not found', ['user_id' => $userId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Người dùng không tồn tại',
                ], 404);
            }

            Log::info('Fetching orders for user', ['user_id' => $userId]);

            $orders = Order::with(['details.menu', 'details.service', 'details.room', 'voucher', 'user'])
                ->where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();

            Log::info('Orders fetched successfully', ['user_id' => $userId, 'order_count' => $orders->count()]);

            $orderData = $orders->map(function ($order) {
                try {
                    return [
                        'id' => $order->id,
                        'date' => $order->date,
                        'time' => $order->time,
                        'method' => $this->normalizePaymentMethod($order->method),
                        'status' => $order->status ?? 'pending',
                        'total_amount' => (float) $order->total_amount,
                        'user' => [
                            'name' => $order->user->name ?? 'N/A',
                            'email' => $order->user->email ?? 'N/A',
                        ],
                        'voucher' => $order->voucher ? [
                            'code' => $order->voucher->code,
                            'discount_amount' => (float) $order->voucher->discount_amount,
                        ] : null,
                        'details' => $order->details->map(function ($detail) {
                            return [
                                'id' => $detail->id,
                                'quantity' => (int) $detail->quantity,
                                'price' => (float) $detail->price,
                                'subtotal' => (float) ($detail->quantity * $detail->price),
                                'menu' => $detail->menu ? ['name' => $detail->menu->name] : null,
                                'service' => $detail->service ? ['name' => $detail->service->name] : null,
                                'room' => $detail->room ? ['name' => $detail->room->name] : null,
                            ];
                        }),
                    ];
                } catch (\Exception $e) {
                    Log::error('Error processing order data', [
                        'order_id' => $order->id,
                        'error' => $e->getMessage()
                    ]);
                    return null;
                }
            })->filter();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách đơn hàng thành công',
                'data' => $orderData->values(),
            ], 200);

        } catch (\Illuminate\Database\QueryException $e) {
            Log::error('Database error in orders index', [
                'user_id' => $userId ?? 'unknown',
                'error' => $e->getMessage(),
                'sql' => $e->getSql() ?? 'N/A'
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi cơ sở dữ liệu khi lấy danh sách đơn hàng',
            ], 500);
        } catch (\Exception $e) {
            Log::error('Unexpected error in orders index', [
                'user_id' => $userId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách đơn hàng',
            ], 500);
        }
    }

    public function show(Request $request, $id)
    {
        try {
            $userId = (int) $request->query('user_id');

            $order = Order::with([
                'details.menu',
                'details.service',
                'details.room',
                'voucher',
                'user',
            ])
                ->where('id', $id)
                ->when($userId, fn($q) => $q->where('user_id', $userId))
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                ], 404);
            }

            $total   = (int) ($order->total_amount ?? 0);
            $deposit = (int) ($order->deposit_amount ?? round($total * 0.3));
            $balance = (int) ($order->balance_amount ?? max(0, $total - $deposit));

            $data = [
                'id'             => $order->id,
                'status'         => $order->status,
                'method'         => $order->method,
                'date'           => $order->date,
                'time'           => $order->time,
                'createdAt'      => optional($order->created_at)->toIso8601String(),
                'user'           => $order->user ? [
                    'id'    => $order->user->id,
                    'name'  => $order->user->name,
                    'email' => $order->user->email,
                ] : null,

                'total_amount'   => $total,
                'deposit_amount' => $deposit,
                'balance_amount' => $balance,

                'voucher'        => $order->voucher ? [
                    'id'              => $order->voucher->id,
                    'title'           => $order->voucher->title,
                    'type'            => $order->voucher->type,
                    'value'           => (float) $order->voucher->value,
                    'min_order_total' => (int) ($order->voucher->min_order_total ?? 0),
                    'discount_amount' => (int) ($order->discount_amount ?? 0),
                ] : null,

                'details'        => $order->details->map(function ($d) {
                    $relations = ['menu','service','room'];
                    $product = null;
                    foreach ($relations as $r) {
                        if ($d->$r) { $product = ['name' => $d->$r->name, 'type' => $r]; break; }
                    }
                    return [
                        'id'       => $d->id,
                        'quantity' => (int) $d->quantity,
                        'price'    => (float) $d->price,
                        'subtotal' => (float) ($d->quantity * $d->price),
                        'menu'     => $d->menu,
                        'service'  => $d->service,
                        'room'     => $d->room,
                        'Product'  => $product,
                    ];
                })->values(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết đơn hàng thành công',
                'data'    => $data,
            ], 200);

        } catch (\Throwable $e) {
            Log::error('Order show error', ['id' => $id, 'err' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Lỗi server nội bộ',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = $request->query('user_id');
            if (!$userId || !is_numeric($userId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID không hợp lệ',
                ], 400);
            }

            $validator = Validator::make($request->all(), [
                'date' => 'required|date',
                'time' => 'required|string',
                'method' => 'required|string|in:cash,momo,card,vnpay',
                'details' => 'required|array|min:1',
                'details.*.quantity' => 'required|integer|min:1',
                'details.*.price' => 'required|numeric|min:0',
                'details.*.menu_id' => 'nullable|exists:menus,id',
                'details.*.service_id' => 'nullable|exists:services,id',
                'details.*.room_id' => 'nullable|exists:rooms,id',
                'details.*.room_slot_id' => 'nullable|exists:room_slots,id',
                'voucher_id' => 'nullable|exists:vouchers,id',
            ], [
                'date.required' => 'Ngày đặt hàng không được để trống',
                'time.required' => 'Thời gian không được để trống',
                'method.required' => 'Phương thức thanh toán không được để trống',
                'method.in' => 'Phương thức thanh toán không hợp lệ',
                'details.required' => 'Chi tiết đơn hàng không được để trống',
                'details.*.quantity.required' => 'Số lượng không được để trống',
                'details.*.price.required' => 'Giá không được để trống',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                ], 422);
            }

            $totalAmount = collect($request->details)->sum(function ($detail) {
                return $detail['quantity'] * $detail['price'];
            });

            $voucher = $request->voucher_id ? \App\Models\Voucher::find($request->voucher_id) : null;
            if ($voucher) {
                $totalAmount = max(0, $totalAmount - $voucher->discount_amount);
            }

            $order = Order::create([
                'user_id' => $userId,
                'total_amount' => $totalAmount,
                'voucher_id' => $request->voucher_id,
                'status' => 'pending',
                'date' => $request->date,
                'time' => $request->time,
                'method' => $request->method,
            ]);

            foreach ($request->details as $detail) {
                OrderDetail::create([
                    'order_id'     => $order->id,
                    'menu_id'      => $detail['menu_id'] ?? null,
                    'service_id'   => $detail['service_id'] ?? null,
                    'room_id'      => $detail['room_id'] ?? null,
                    'room_slot_id' => $detail['room_slot_id'] ?? null,
                    'quantity'     => $detail['quantity'],
                    'price'        => $detail['price'],
                ]);
            }

            DB::commit();

            $order->load(['details.menu', 'details.service', 'details.room', 'voucher']);

            return response()->json([
                'success' => true,
                'message' => 'Tạo đơn hàng thành công',
                'data' => [
                    'id' => $order->id,
                    'date' => $order->date,
                    'time' => $order->time,
                    'method' => $this->normalizePaymentMethod($order->method),
                    'status' => $order->status,
                    'total_amount' => (float) $order->total_amount,
                    'voucher' => $order->voucher ? [
                        'code' => $order->voucher->code,
                        'discount_amount' => (float) $order->voucher->discount_amount,
                    ] : null,
                    'details' => $order->details->map(function ($detail) {
                        return [
                            'id' => $detail->id,
                            'quantity' => (int) $detail->quantity,
                            'price' => (float) $detail->price,
                            'subtotal' => (float) ($detail->quantity * $detail->price),
                            'menu' => $detail->menu ? ['name' => $detail->menu->name] : null,
                            'service' => $detail->service ? ['name' => $detail->service->name] : null,
                            'room' => $detail->room ? ['name' => $detail->room->name] : null,
                        ];
                    }),
                ],
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error creating order', [
                'user_id' => $userId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi tạo đơn hàng',
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $userId = $request->query('user_id');
            if (!$userId || !is_numeric($userId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'User ID không hợp lệ',
                ], 400);
            }

            $order = Order::where('user_id', $userId)->find($id);

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'date' => 'sometimes|date',
                'time' => 'sometimes|string',
                'method' => 'sometimes|string|in:cash,momo,card,vnpay',
                'status' => 'sometimes|string|in:pending,confirmed,preparing,ready,delivered,cancelled',
                'voucher_id' => 'nullable|exists:vouchers,id',
                'details' => 'sometimes|array|min:1',
                'details.*.quantity' => 'sometimes|integer|min:1',
                'details.*.price' => 'sometimes|numeric|min:0',
                'details.*.menu_id' => 'nullable|exists:menus,id',
                'details.*.service_id' => 'nullable|exists:services,id',
                'details.*.room_id' => 'nullable|exists:rooms,id',
                'details.*.room_slot_id' => 'nullable|exists:room_slots,id', // ✅ thêm
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Cập nhật đơn hàng
            $order->update($request->only(['date', 'time', 'method', 'status', 'voucher_id']));

            // Giải phóng lịch đặt nếu hủy đơn hàng
            if ($request->status === 'cancelled') {
                foreach ($order->details as $detail) {
                    if ($detail->room_slot_id) {
                        RoomSlot::where('id', $detail->room_slot_id)->update([
                            'status'   => 'available',
                            'order_id' => null
                        ]);
                    }
                }
            }

            // Cập nhật chi tiết đơn hàng nếu có
            if ($request->has('details')) {
                $totalAmount = collect($request->details)->sum(function ($detail) {
                    return $detail['quantity'] * $detail['price'];
                });

                $voucher = $request->voucher_id ? \App\Models\Voucher::find($request->voucher_id) : null;
                if ($voucher) {
                    $totalAmount = max(0, $totalAmount - $voucher->discount_amount);
                }

                $order->update(['total_amount' => $totalAmount]);

                $order->details()->delete();
                foreach ($request->details as $detail) {
                    OrderDetail::create([
                        'order_id' => $order->id,
                        'menu_id' => $detail['menu_id'] ?? null,
                        'service_id' => $detail['service_id'] ?? null,
                        'room_id' => $detail['room_id'] ?? null,
                        'room_slot_id' => $detail['room_slot_id'] ?? null,
                        'quantity' => $detail['quantity'],
                        'price' => $detail['price'],
                    ]);
                }
            }

            DB::commit();

            $order->load(['details.menu', 'details.service', 'details.room', 'voucher', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật đơn hàng thành công',
                'data' => [
                    'id' => $order->id,
                    'date' => $order->date,
                    'time' => $order->time,
                    'method' => $this->normalizePaymentMethod($order->method),
                    'status' => $order->status,
                    'total_amount' => (float) $order->total_amount,
                    'user' => [
                        'name' => $order->user->name ?? 'N/A',
                        'email' => $order->user->email ?? 'N/A',
                    ],
                    'voucher' => $order->voucher ? [
                        'code' => $order->voucher->code,
                        'discount_amount' => (float) $order->voucher->discount_amount,
                    ] : null,
                    'details' => $order->details->map(function ($detail) {
                        return [
                            'id' => $detail->id,
                            'quantity' => (int) $detail->quantity,
                            'price' => (float) $detail->price,
                            'subtotal' => (float) ($detail->quantity * $detail->price),
                            'menu' => $detail->menu ? ['name' => $detail->menu->name] : null,
                            'service' => $detail->service ? ['name' => $detail->service->name] : null,
                            'room' => $detail->room ? ['name' => $detail->room->name] : null,
                        ];
                    }),
                ],
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating order', [
                'order_id' => $id,
                'user_id' => $userId ?? 'unknown',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật đơn hàng',
            ], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Không hỗ trợ xóa đơn hàng, chỉ có thể hủy đơn',
        ], 403);
    }

    private function normalizePaymentMethod($method)
    {
        switch (strtolower($method)) {
            case 'vnpay':
                return 'vnpay';
            case 'momo':
                return 'momo';
            case 'card':
                return 'card';
            case 'cash':
            default:
                return 'cash';
        }
    }
}
