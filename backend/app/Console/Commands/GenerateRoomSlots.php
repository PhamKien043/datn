<?php

namespace App\Console\Commands;

use App\Models\Room;
use App\Models\RoomSlot;
use Illuminate\Console\Command;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class GenerateRoomSlots extends Command
{
    protected $signature = 'slots:generate
                          {--days=30 : Số ngày để tạo slots}
                          {--room= : ID phòng cụ thể để tạo slots}
                          {--force : Buộc tái tạo slots hiện có}
                          {--clean : Xóa slots cũ trước khi tạo}';

    protected $description = 'Tạo slots phòng cho tất cả các phòng trong số ngày chỉ định';

    protected $timeSlots = [
        'morning' => ['start' => '08:00', 'end' => '12:00'],
        'afternoon' => ['start' => '13:00', 'end' => '19:00'],
        'evening' => ['start' => '19:00', 'end' => '23:00']
    ];

    public function handle()
    {
        try {
            DB::beginTransaction();

            $days = $this->option('days');
            $roomId = $this->option('room');
            $force = $this->option('force');
            $clean = $this->option('clean');

            if ($clean) {
                $this->cleanOldSlots();
            }

            $query = Room::where('status', 'available');
            if ($roomId) {
                $query->where('id', $roomId);
            }
            $rooms = $query->get();

            if ($rooms->isEmpty()) {
                $this->error('Không tìm thấy phòng nào với trạng thái "available"');
                return Command::FAILURE;
            }

            $this->info("Tạo slots cho {$rooms->count()} phòng trong {$days} ngày...");

            $progressBar = $this->output->createProgressBar($rooms->count() * $days * count($this->timeSlots));
            $progressBar->start();

            $created = 0;
            $updated = 0;
            $skipped = 0;
            $errors = 0;

            foreach ($rooms as $room) {
                for ($i = 0; $i < $days; $i++) {
                    $date = Carbon::now()->addDays($i)->format('Y-m-d');

                    foreach ($this->timeSlots as $timeSlot => $timeRange) {
                        try {
                            $result = $this->createOrUpdateSlot($room, $date, $timeSlot, $force);

                            switch ($result) {
                                case 'created':
                                    $created++;
                                    break;
                                case 'updated':
                                    $updated++;
                                    break;
                                case 'skipped':
                                    $skipped++;
                                    break;
                            }
                        } catch (\Exception $e) {
                            $errors++;
                            $this->error("Lỗi tạo slot cho phòng {$room->name}, ngày {$date}, ca {$timeSlot}: {$e->getMessage()}");
                            Log::error("Lỗi tạo slot", [
                                'room_id' => $room->id,
                                'date' => $date,
                                'time_slot' => $timeSlot,
                                'error' => $e->getMessage()
                            ]);
                        }

                        $progressBar->advance();
                    }
                }
            }

            $progressBar->finish();
            $this->newLine(2);

            DB::commit();

            $this->info("=== KẾT QUẢ ===");
            $this->info("✅ Tạo mới: {$created} slots");
            if ($updated > 0) $this->info("🔄 Cập nhật: {$updated} slots");
            $this->info("⏭️  Bỏ qua: {$skipped} slots");
            if ($errors > 0) $this->error("❌ Lỗi: {$errors} slots");

            Log::info("Tạo slots thành công", [
                'created' => $created,
                'updated' => $updated,
                'skipped' => $skipped,
                'errors' => $errors
            ]);

            return Command::SUCCESS;

        } catch (\Exception $e) {
            DB::rollback();
            $this->error("Lỗi tổng thể: {$e->getMessage()}");
            Log::error("Tạo slots thất bại", ['error' => $e->getMessage()]);
            return Command::FAILURE;
        }
    }

    private function createOrUpdateSlot($room, $date, $timeSlot, $force = false)
    {
        $existing = RoomSlot::where('room_id', $room->id)
            ->where('slot_date', $date)
            ->where('time_slot', $timeSlot)
            ->first();

        if ($existing) {
            if ($force) {
                if (!$existing->orderDetails()->whereHas('order', fn($q) => $q->where('status', 'completed'))->exists()) {
                    $existing->update(['is_available' => true]);
                    return 'updated';
                }
            }
            return 'skipped';
        }

        if (Carbon::parse($date)->isPast()) {
            return 'skipped';
        }

        RoomSlot::create([
            'room_id' => $room->id,
            'slot_date' => $date,
            'time_slot' => $timeSlot,
            'is_available' => true,
        ]);

        return 'created';
    }

    private function cleanOldSlots()
    {
        $deletedCount = RoomSlot::where('slot_date', '<', Carbon::today())
            ->whereDoesntHave('orderDetails', fn($q) => $q->whereHas('order', fn($o) => $o->where('status', 'completed')))
            ->delete();

        $this->info("Đã xóa {$deletedCount} slots cũ");
    }
}
