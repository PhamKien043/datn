<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory;

    protected $table = 'rooms';
    public $timestamps = false;
    protected $fillable = [
        'id',
        'name',
        'description',
        'capacity',
        'price',
        'status',
        'image',
        // 'table_money',
        'location_type_id',
    ];



    protected $appends = ['table_fee_per_table'];

    public function getTableFeePerTableAttribute(): int
    {
        return (int) ($this->table_money ?? 0);
    }
    /**
     * Lấy loại địa điểm của phòng này.
     */
    public function locationType()
    {
        return $this->belongsTo(LocationType::class, 'location_type_id');
    }

    /**
     * Lấy tất cả các slot của phòng này.
     */
    public function roomSlots()
    {
        return $this->hasMany(RoomSlot::class);
    }

    /**
     * Lấy các slot có sẵn của phòng này.
     */
    public function availableSlots()
    {
        return $this->hasMany(RoomSlot::class)->where('is_available', true);
    }

    /**
     * Lấy cart details liên quan đến phòng này.
     */
    public function cartDetails()
    {
        return $this->hasMany(CartDetail::class);
    }
}
