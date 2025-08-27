<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CartDetail extends Model
{
    protected $fillable = [
        'user_id',
        'service_id',
        'room_id',
        'room_slot_id',
        'location_type_id',
        'selected_date',
        'selected_time_slot',
        'menu_id',
        'quantity',
        'price_per_table',
        'total_price',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class, 'service_id');
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function locationType()
    {
        return $this->belongsTo(LocationType::class, 'location_type_id');
    }

    public function roomSlot()
    {
        return $this->belongsTo(RoomSlot::class, 'room_slot_id');
    }
}
