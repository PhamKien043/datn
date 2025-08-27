<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderDetail extends Model
{
    protected $fillable = [
        'order_id',
        'service_id',
        'menu_id',
        'room_id',
        'room_slot_id',
        'quantity',
        'price'
    ];

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function roomSlot()
    {
        return $this->belongsTo(RoomSlot::class, 'room_slot_id');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function locationType()
    {
        return $this->belongsTo(LocationType::class, 'location_type_id');
    }
}
