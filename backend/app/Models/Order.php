<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_amount',
        'deposit_amount',
        'balance_amount',
        'voucher_id',
        'status',
        'date',
        'time',
        'method',
        'payment_url',
        'payment_data',
        'momo_order_id',
        'vnpay_order_id',
        'room_slot_id', // 👈 thêm cột này để liên kết order với room_slots
    ];

    protected $casts = [
        'total_amount'   => 'int',
        'deposit_amount' => 'int',
        'balance_amount' => 'int',
    ];

    public function details()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function voucher()
    {
        return $this->belongsTo(Voucher::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function withdrawRequest()
    {
        return $this->hasOne(\App\Models\WithdrawRequest::class, 'order_id');
    }

    // ✅ Quan hệ mới: mỗi order thuộc về một room_slot
    public function roomSlot()
    {
        return $this->belongsTo(RoomSlot::class, 'room_slot_id');
    }
}
