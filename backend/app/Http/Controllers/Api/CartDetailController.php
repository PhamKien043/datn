<?php


namespace App\Http\Controllers\Api;

use App\Models\CartDetail;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class CartDetailController extends Controller
{
    public function index()
    {
        return CartDetail::with([
            'user',
            'menu',
            'room.locationType',
            'service',
            'locationType',
            'roomSlot'
        ])->get();
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'service_id' => 'nullable|exists:services,id',
                'room_id' => 'nullable|exists:rooms,id',
                'room_slot_id' => 'nullable|exists:room_slots,id',
                'location_type_id' => 'nullable|exists:location_types,id',
                'selected_date' => 'nullable|date',
                'selected_time_slot' => 'nullable|string|in:morning,afternoon',
                'menus' => 'required|array|min:1',
                'menus.*.menu_id' => 'required|exists:menus,id',
                'menus.*.quantity' => 'required|integer|min:1',
                'menus.*.price_per_table' => 'required|numeric|min:0',
            ]);

            $userId = $request->user_id;
            $serviceId = $request->service_id;
            $roomId = $request->room_id;
            $roomSlotId = $request->room_slot_id;
            $locationTypeId = $request->location_type_id;
            $selectedDate = $request->selected_date;
            $selectedTimeSlot = $request->selected_time_slot;

            if ($roomId) {
                $existingRoom = CartDetail::where('user_id', $userId)->whereNotNull('room_id')->first();
                if ($existingRoom) {
                    // Nếu khác phòng → cập nhật tất cả các dòng
                    CartDetail::where('user_id', $userId)->update([
                        'room_id' => $roomId,
                        'service_id' => $serviceId,
                        'room_slot_id' => $roomSlotId,
                        'location_type_id' => $locationTypeId,
                        'selected_date' => $selectedDate,
                        'selected_time_slot' => $selectedTimeSlot,
                    ]);
                } else {
                    // Nếu chưa có phòng → thêm phòng vào bản ghi mới
                    foreach ($request->menus as $menuItem) {
                        CartDetail::create([
                            'user_id' => $userId,
                            'service_id' => $serviceId,
                            'room_id' => $roomId,
                            'room_slot_id' => $roomSlotId,
                            'location_type_id' => $locationTypeId,
                            'selected_date' => $selectedDate,
                            'selected_time_slot' => $selectedTimeSlot,
                            'menu_id' => $menuItem['menu_id'],
                            'quantity' => $menuItem['quantity'],
                            'price_per_table' => $menuItem['price_per_table'],
                            'status' => 'pending',
                        ]);
                    }

                    return response()->json(['message' => 'Đã thêm vào giỏ hàng'], 201);
                }
            }

            $cartItems = [];

            // Thêm món ăn mới nếu chưa có
            foreach ($request->menus as $menuItem) {
                $exists = CartDetail::where('user_id', $userId)
                    ->where('menu_id', $menuItem['menu_id'])
                    ->exists();

                if ($exists) {
                    return response()->json([
                        'message' => 'Món "' . $menuItem['menu_id'] . '" đã có trong giỏ hàng!'
                    ], 409);
                }

                $item = CartDetail::create([
                    'user_id' => $userId,
                    'service_id' => $serviceId,
                    'room_id' => $roomId ?? null,
                    'room_slot_id' => $roomSlotId ?? null,
                    'location_type_id' => $locationTypeId ?? null,
                    'selected_date' => $selectedDate ?? null,
                    'selected_time_slot' => $selectedTimeSlot ?? null,
                    'menu_id' => $menuItem['menu_id'],
                    'quantity' => $menuItem['quantity'],
                    'price_per_table' => $menuItem['price_per_table'],
                    'status' => 'pending',
                ]);

                $cartItems[] = $item;
            }

            return response()->json([
                'message' => 'Đã cập nhật giỏ hàng',
                'data' => $cartItems
            ], 201);

        } catch (\Exception $e) {
            \Log::error($e);
            return response()->json(['message' => 'Lỗi server: ' . $e->getMessage()], 500);
        }
    }

    public function show($id)
    {
        return CartDetail::with([
            'user',
            'menu',
            'room.locationType',
            'service',
            'locationType',
            'roomSlot'
        ])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $cart = CartDetail::findOrFail($id);

        // Validate the incoming data
        $validated = $request->validate([
            'quantity' => 'nullable|integer|min:1',
            'status' => 'nullable|string',
            'room_id' => 'nullable|exists:rooms,id',
            'room_slot_id' => 'nullable|exists:room_slots,id',
            'location_type_id' => 'nullable|exists:location_types,id',
            'selected_date' => 'nullable|date',
            'selected_time_slot' => 'nullable|string|in:morning,afternoon',
        ]);

        // Update only the fields that are provided
        foreach ($validated as $key => $value) {
            if ($request->has($key)) {
                $cart->$key = $value;
            }
        }

        $cart->save();

        return response()->json([
            'message' => 'Cập nhật thành công',
            'data' => $cart->load([
                'user',
                'menu',
                'room.locationType',
                'service',
                'locationType',
                'roomSlot'
            ])
        ]);
    }

    public function destroy($id)
    {
        CartDetail::destroy($id);
        return response()->json(['message' => 'Đã xóa']);
    }

    /**
     * Clear all cart items for a specific user
     */
    public function clearByUserId($userId)
    {
        try {
            $deletedCount = CartDetail::where('user_id', $userId)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Đã xóa giỏ hàng thành công',
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            \Log::error('Error clearing cart for user ' . $userId . ': ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Lỗi khi xóa giỏ hàng: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update multiple cart items for bulk operations
     */
    public function bulkUpdate(Request $request)
    {
        try {
            $request->validate([
                'user_id' => 'required|exists:users,id',
                'updates' => 'required|array',
                'updates.*.cart_id' => 'required|exists:cart_details,id',
                'updates.*.data' => 'required|array',
            ]);

            $updatedItems = [];

            foreach ($request->updates as $update) {
                $cart = CartDetail::where('id', $update['cart_id'])
                    ->where('user_id', $request->user_id)
                    ->first();

                if ($cart) {
                    $cart->update($update['data']);
                    $updatedItems[] = $cart->load([
                        'user',
                        'menu',
                        'room.locationType',
                        'service',
                        'locationType',
                        'roomSlot'
                    ]);
                }
            }

            return response()->json([
                'message' => 'Cập nhật hàng loạt thành công',
                'data' => $updatedItems
            ]);

        } catch (\Exception $e) {
            \Log::error('Bulk update error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Lỗi khi cập nhật hàng loạt: ' . $e->getMessage()
            ], 500);
        }
    }
}
