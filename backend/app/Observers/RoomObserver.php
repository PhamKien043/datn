<?php

// 5. Tạo Observer để tự động tạo slots khi có phòng mới
// php artisan make:observer RoomObserver --model=Room

namespace App\Observers;

use App\Models\Room;
use App\Models\RoomSlot;
use Carbon\Carbon;

class RoomObserver
{
    public function created(Room $room)
    {
        // Tự động tạo slots cho phòng mới trong 30 ngày tới
        $timeSlots = ['morning', 'afternoon'];

        for ($i = 0; $i < 30; $i++) {
            $date = Carbon::now()->addDays($i)->format('Y-m-d');

            foreach ($timeSlots as $timeSlot) {
                RoomSlot::create([
                    'room_id' => $room->id,
                    'slot_date' => $date,
                    'time_slot' => $timeSlot,
                    'is_available' => true,
                ]);
            }
        }
    }
}
