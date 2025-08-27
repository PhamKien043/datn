<?php

// 5. Enhanced Kernel với multiple schedules
namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        // Tạo slots mới hàng ngày cho 30 ngày tới (chạy lúc 00:30)
        $schedule->command('slots:generate --days=30')
            ->daily()
            ->at('00:30')
            ->withoutOverlapping()
            ->onOneServer()
            ->emailOutputOnFailure('admin@yourdomain.com');

        // Dọn dẹp slots cũ (chạy hàng tuần)
        $schedule->command('slots:generate --clean --days=0')
            ->weekly()
            ->wednesdays()
            ->at('02:00')
            ->withoutOverlapping()
            ->onOneServer();

        // Update price modifier cho weekend (chạy thứ 6 hàng tuần)
        $schedule->call(function () {
            \App\Models\RoomSlot::whereIn('slot_date', [
                now()->next('Saturday')->format('Y-m-d'),
                now()->next('Sunday')->format('Y-m-d')
            ])->update(['price_modifier' => 1.2]);
        })->fridays()->at('23:00');
    }

    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');
        require base_path('routes/console.php');
    }

    protected array $routeMiddleware = [
        // các middleware khác...
        'admin' => \App\Http\Middleware\AdminOnly::class, // thêm dòng này
    ];
}
