<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminOrderController extends Controller
{
    /**
     * Danh sách trạng thái cho phép (lưu trong cột `status`)
     */
    private const ALLOWED_STATUSES = [
        'pending',          // Chờ xác nhận
        'deposit_paid',     // Đã đặt cọc 30%
        'confirmed',        // Đã xác nhận & chờ thực hiện
        'awaiting_balance', // Chờ thanh toán 70%
        'completed',        // Dịch vụ hoàn tất
        'failed',           // Thanh toán thất bại
        'cancelled',        // Đã hủy
    ];

    /**
     * GET /api/admin/orders?search=...&status=...
     * `status` chấp nhận string (khuyến nghị) hoặc legacy 1|2 (sẽ map: 1->pending, 2->confirmed)
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Order::with(['details.menu', 'details.service', 'details.room', 'voucher', 'user']);

            // ----- Filter theo status -----
            if ($request->filled('status')) {
                $raw = strtolower(trim((string) $request->status));
                $legacyMap = ['1' => 'pending', '2' => 'confirmed'];
                $status = $legacyMap[$raw] ?? $raw;

                if (in_array($status, self::ALLOWED_STATUSES, true)) {
                    $query->where('status', $status);
                }
            }

            // ----- Tìm kiếm an toàn -----
            if ($request->filled('search')) {
                $search = trim((string) $request->search);

                $hasOrderName  = Schema::hasColumn('orders', 'name');
                $hasOrderPhone = Schema::hasColumn('orders', 'phone');
                $hasUserPhone  = Schema::hasColumn('users',  'phone');

                $query->where(function ($q) use ($search, $hasOrderName, $hasOrderPhone, $hasUserPhone) {
                    // ID
                    if (ctype_digit($search)) $q->orWhere('orders.id', (int) $search);
                    else                       $q->orWhere('orders.id', 'like', "%{$search}%");

                    if ($hasOrderName)  $q->orWhere('orders.name',  'like', "%{$search}%");
                    if ($hasOrderPhone) $q->orWhere('orders.phone', 'like', "%{$search}%");

                    $q->orWhereHas('user', function ($u) use ($search, $hasUserPhone) {
                        $u->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                        if ($hasUserPhone) $u->orWhere('phone', 'like', "%{$search}%");
                    });
                });
            }

            $orders = $query->orderBy('created_at', 'desc')->get();

            Log::info('Admin fetched orders', ['order_count' => $orders->count()]);

            $orderData = $orders->map(function ($order) {
                try {
                    $finalTotal = (int) ($order->total_amount ?? 0);
                    $deposit    = (int) ($order->deposit_amount ?? round($finalTotal * 0.3));
                    $balance    = (int) ($order->balance_amount ?? max(0, $finalTotal - $deposit));

                    $voucherInfo = $order->voucher ? [
                        'id'              => $order->voucher->id,
                        'title'           => $order->voucher->title,
                        'type'            => $order->voucher->type,
                        'value'           => (float) $order->voucher->value,
                        'min_order_total' => (int)   ($order->voucher->min_order_total ?? 0),
                        'discount_amount' => (int)   ($order->discount_amount ?? 0),
                    ] : null;

                    $statusStr = $order->status ?: 'pending';
                    $legacyInt = ['pending' => 1, 'confirmed' => 2][$statusStr] ?? null;

                    return [
                        'id'              => $order->id,
                        'name'            => $order->name ?? ($order->user->name ?? 'N/A'),
                        'phone'           => $order->phone ?? ($order->user->phone ?? 'N/A'),
                        'address'         => $order->address ?? 'N/A',
                        'total'           => $finalTotal,
                        'deposit_amount'  => $deposit,
                        'balance_amount'  => $balance,
                        'createdAt'       => optional($order->created_at)->toISOString(),
                        'status'          => $statusStr,   // <-- dùng FE mới
                        'order_status'    => $legacyInt,   // <-- FE cũ (nếu còn)
                        'payment_status'  => (bool) ($order->payment_status ?? false),
                        'method'          => $order->method ?? 'cash',
                        'note'            => $order->note ?? '',
                        'voucher'         => $voucherInfo,
                        'OrderDetails'    => $order->details->map(function ($detail) {
                            $relations = ['menu', 'service', 'room'];
                            $product = null;
                            foreach ($relations as $relation) {
                                if ($detail->$relation) {
                                    $product = ['name' => $detail->$relation->name, 'type' => $relation];
                                    break;
                                }
                            }
                            return [
                                'id'       => $detail->id,
                                'quantity' => (int) $detail->quantity,
                                'price'    => (float) $detail->price,
                                'total'    => (float) ($detail->quantity * $detail->price),
                                'Product'  => $product,
                            ];
                        }),
                    ];
                } catch (\Throwable $e) {
                    Log::error('Error processing order data', ['order_id' => $order->id, 'error' => $e->getMessage()]);
                    return null;
                }
            })->filter();

            return response()->json([
                'success' => true,
                'message' => 'Lấy danh sách đơn hàng thành công',
                'data'    => $orderData->values(),
                'total'   => $orderData->count(),
            ], 200);
        } catch (\Throwable $e) {
            Log::error('Unexpected error in admin orders index', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy danh sách đơn hàng',
            ], 500);
        }
    }

    // GET /api/admin/orders/{id}
    public function show(Request $request, $id): JsonResponse
    {
        try {
            $order = Order::with(['details.menu', 'details.service', 'details.room', 'voucher', 'user'])
                ->where('id', $id)
                ->first();

            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                ], 404);
            }

            $finalTotal = (int) ($order->total_amount ?? 0);
            $deposit    = (int) ($order->deposit_amount ?? round($finalTotal * 0.3));
            $balance    = (int) ($order->balance_amount ?? max(0, $finalTotal - $deposit));

            $voucherInfo = $order->voucher ? [
                'id'              => $order->voucher->id,
                'title'           => $order->voucher->title,
                'type'            => $order->voucher->type,
                'value'           => (float) $order->voucher->value,
                'min_order_total' => (int)   ($order->voucher->min_order_total ?? 0),
                'discount_amount' => (int)   ($order->discount_amount ?? 0),
            ] : null;

            $statusStr = $order->status ?: 'pending';
            $legacyInt = ['pending' => 1, 'confirmed' => 2][$statusStr] ?? null;

            $orderData = [
                'id'              => $order->id,
                'name'            => $order->name ?? ($order->user->name ?? 'N/A'),
                'phone'           => $order->phone ?? ($order->user->phone ?? 'N/A'),
                'address'         => $order->address ?? 'N/A',
                'total'           => $finalTotal,
                'deposit_amount'  => $deposit,
                'balance_amount'  => $balance,
                'createdAt'       => optional($order->created_at)->toISOString(),
                'updatedAt'       => optional($order->updated_at)->toISOString(),
                'status'          => $statusStr,   // <-- FE mới
                'order_status'    => $legacyInt,   // <-- FE cũ (nếu còn)
                'payment_status'  => (bool) ($order->payment_status ?? false),
                'method'          => $order->method ?? 'cash',
                'note'            => $order->note ?? '',
                'date'            => $order->date,
                'time'            => $order->time,
                'voucher'         => $voucherInfo,
                'user'            => $order->user ? [
                    'id'    => $order->user->id,
                    'name'  => $order->user->name,
                    'email' => $order->user->email,
                ] : null,
                'OrderDetails'    => $order->details->map(function ($detail) {
                    $relations = ['menu', 'service', 'room'];
                    $product = null;
                    foreach ($relations as $relation) {
                        if ($detail->$relation) {
                            $product = ['name' => $detail->$relation->name, 'type' => $relation];
                            break;
                        }
                    }
                    return [
                        'id'       => $detail->id,
                        'quantity' => (int) $detail->quantity,
                        'price'    => (float) $detail->price,
                        'total'    => (float) ($detail->quantity * $detail->price),
                        'Product'  => $product,
                    ];
                }),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Lấy chi tiết đơn hàng thành công',
                'data'    => $orderData,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching order', [
                'order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy chi tiết đơn hàng',
            ], 500);
        }
    }

    // PUT /api/admin/orders/{id}
    public function update(Request $request, $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $order = Order::where('id', $id)->first();

            if (!$order) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                ], 404);
            }

            // Hỗ trợ cả status (string) và order_status (legacy 1|2)
            $rules = [
                'status'         => 'sometimes|string|in:' . implode(',', self::ALLOWED_STATUSES),
                'order_status'   => 'sometimes|integer|in:1,2',
                'name'           => 'sometimes|string|max:255',
                'phone'          => 'sometimes|string|max:20',
                'address'        => 'sometimes|string',
                'note'           => 'nullable|string',
                'payment_status' => 'sometimes|boolean',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => $validator->errors()->first(),
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $updateData = $request->only(['name', 'phone', 'address', 'note', 'payment_status']);

            if ($request->has('status')) {
                $updateData['status'] = strtolower($request->status);
            } elseif ($request->has('order_status')) {
                $map = [1 => 'pending', 2 => 'confirmed'];
                $updateData['status'] = $map[(int) $request->order_status] ?? 'pending';
            }

            if (isset($updateData['status'])) {
                Log::info('Order status updated', [
                    'order_id'   => $id,
                    'old_status' => $order->status,
                    'new_status' => $updateData['status'],
                    'updated_by' => optional($request->user())->id ?? 'admin',
                ]);
            }

            $order->update($updateData);

            DB::commit();

            // Reload relationships
            $order->load(['details.menu', 'details.service', 'details.room', 'voucher', 'user']);

            $statusStr = $order->status ?: 'pending';
            $legacyInt = ['pending' => 1, 'confirmed' => 2][$statusStr] ?? null;

            $finalTotal = (int) ($order->total_amount ?? 0);
            $deposit    = (int) ($order->deposit_amount ?? round($finalTotal * 0.3));
            $balance    = (int) ($order->balance_amount ?? max(0, $finalTotal - $deposit));

            return response()->json([
                'success' => true,
                'message' => 'Cập nhật đơn hàng thành công',
                'data' => [
                    'id'             => $order->id,
                    'name'           => $order->name ?? ($order->user->name ?? 'N/A'),
                    'phone'          => $order->phone ?? ($order->user->phone ?? 'N/A'),
                    'address'        => $order->address ?? 'N/A',
                    'total'          => $finalTotal,
                    'deposit_amount' => $deposit,
                    'balance_amount' => $balance,
                    'createdAt'      => optional($order->created_at)->toISOString(),
                    'status'         => $statusStr,     // FE mới
                    'order_status'   => $legacyInt,     // FE cũ (nếu còn)
                    'payment_status' => (bool) ($order->payment_status ?? false),
                    'method'         => $order->method ?? 'cash',
                    'note'           => $order->note ?? '',
                    'voucher'        => $order->voucher ? [
                        'id'              => $order->voucher->id,
                        'title'           => $order->voucher->title,
                        'type'            => $order->voucher->type,
                        'value'           => (float) $order->voucher->value,
                        'min_order_total' => (int)   ($order->voucher->min_order_total ?? 0),
                        'discount_amount' => (int)   ($order->discount_amount ?? 0),
                    ] : null,
                    'OrderDetails' => $order->details->map(function ($detail) {
                        $relations = ['menu', 'service', 'room'];
                        $product = null;
                        foreach ($relations as $relation) {
                            if ($detail->$relation) {
                                $product = ['name' => $detail->$relation->name, 'type' => $relation];
                                break;
                            }
                        }
                        return [
                            'id'       => $detail->id,
                            'quantity' => (int) $detail->quantity,
                            'price'    => (float) $detail->price,
                            'total'    => (float) ($detail->quantity * $detail->price),
                            'Product'  => $product,
                        ];
                    }),
                ],
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating order', [
                'order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi cập nhật đơn hàng',
            ], 500);
        }
    }

    // DELETE /api/admin/orders/{id}
    public function destroy(Request $request, $id): JsonResponse
    {
        DB::beginTransaction();
        try {
            $order = Order::where('id', $id)->first();

            if (!$order) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Không tìm thấy đơn hàng',
                ], 404);
            }

            // Chỉ cho phép xóa khi đang "chờ xác nhận"
            if ($order->status !== 'pending') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Chỉ có thể xóa đơn hàng ở trạng thái chờ xác nhận',
                ], 422);
            }

            $order->details()->delete();
            $order->delete();

            DB::commit();

            Log::info('Order deleted', [
                'order_id' => $id,
                'deleted_by' => optional($request->user())->id ?? 'admin'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Xóa đơn hàng thành công',
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error deleting order', [
                'order_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi xóa đơn hàng',
            ], 500);
        }
    }

    // GET /api/admin/orders/statistics
    public function statistics(Request $request): JsonResponse
    {
        try {
            $stats = [
                'total_orders'       => Order::count(),
                'pending_orders'     => Order::where('status', 'pending')->count(),
                'deposit_paid'       => Order::where('status', 'deposit_paid')->count(),
                'confirmed_orders'   => Order::where('status', 'confirmed')->count(),
                'awaiting_balance'   => Order::where('status', 'awaiting_balance')->count(),
                'completed_orders'   => Order::where('status', 'completed')->count(),
                'failed_orders'      => Order::where('status', 'failed')->count(),
                'cancelled_orders'   => Order::where('status', 'cancelled')->count(),

                // Doanh thu thường chốt khi completed
                'total_revenue'      => Order::where('status', 'completed')->sum('total_amount'),

                'today_orders'       => Order::whereDate('created_at', today())->count(),
                'today_revenue'      => Order::whereDate('created_at', today())
                    ->where('status', 'completed')->sum('total_amount'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Lấy thống kê thành công',
                'data'    => $stats,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching order statistics', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Có lỗi xảy ra khi lấy thống kê',
            ], 500);
        }
    }
}
