<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LocationType extends Model
{
    use HasFactory;

    protected $table = 'location_types';

    protected $fillable = [
        'name',
        'image',
        'descriptions',
        'is_active',
    ];

    /**
     * Tắt timestamps mặc định (created_at, updated_at) nếu bảng không có
     */
    public $timestamps = false;

    /**
     * Lấy tất cả các phòng thuộc về loại địa điểm này.
     */
    public function rooms()
    {
        return $this->hasMany(Room::class);
    }
    protected $attributes = [
        'is_active' => 1, // Mặc định active = 1
    ];
}
