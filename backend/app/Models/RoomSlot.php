<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomSlot extends Model
{
    protected $fillable = [
        'room_id',
        'slot_date',
        'time_slot',
        'is_available',
    ];

    protected $casts = [
        'is_available' => 'boolean',
        'slot_date'    => 'date:Y-m-d',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class, 'room_slot_id');
    }

    // ✅ Helper: khóa hàng & set đã đặt
    public function book(): bool
    {
        // SELECT ... FOR UPDATE
        $slot = self::lockForUpdate()->find($this->id);
        if (!$slot) return false;

        if ($slot->is_available) {
            $slot->is_available = false;
            return $slot->save();
        }
        // đã bị người khác giữ
        return false;
    }
}
