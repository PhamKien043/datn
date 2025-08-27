<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_amount',
        'deposit_amount',   // <— NEW
        'balance_amount',   // <— NEW
        'voucher_id',
        'status',
        'date',
        'time',
        'method',
        'payment_url',
        'payment_data',
        'momo_order_id',
        'vnpay_order_id',
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
}
