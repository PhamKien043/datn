<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Voucher extends Model
{
    use HasFactory;

    protected $table = 'vouchers'; // Tên bảng

    protected $fillable = [
        'title',
        'type',
        'start_date',
        'end_date',
        'value',
        'status',
        'min_order_total',
        'is_used', // Thêm trường is_used
        'used_at', // Thêm trường để lưu thời điểm sử dụng
        'used_by_user_id', // Thêm trường để lưu user đã sử dụng
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => 'boolean',
        'is_used' => 'boolean', // Cast is_used thành boolean
    ];
       /**
     * Tắt timestamps mặc định (created_at, updated_at) nếu bảng không có
     */
    public $timestamps = false;
}
