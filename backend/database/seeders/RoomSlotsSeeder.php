<?php

// 2. Tạo Seeder để generate slots ban đầu
// php artisan make:seeder RoomSlotsSeeder

namespace Database\Seeders;

use App\Models\Room;
use App\Models\RoomSlot;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class RoomSlotsSeeder extends Seeder
{
public function run()
{
$rooms = Room::where('status', 'active')->get();
$timeSlots = ['morning', 'afternoon'];
$days = 60; // Generate cho 60 ngày tới

foreach ($rooms as $room) {
for ($i = 0; $i < $days; $i++) {
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
}
