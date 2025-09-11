<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WithdrawRequest extends Model
{
    protected $fillable = [
        'user_id',
        'order_id',
        'bank_name',
        'account_number',
        'account_holder_name',
        'phone_number',
        'amount',
        'status',
        'transaction_id', // ✅
        'note',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
