<?php


namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderDetail;
use App\Models\Service;
use App\Models\Room;
use App\Models\Menu;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Support\Facades\DB;

class StatisticController extends Controller
{
    // 1. Tổng quan đơn hàng
    public function overview()
    {
        $totalOrders = Order::count();
        $totalRevenue = Order::whereIn('status', ['confirmed', 'delivered'])->sum('total_amount');
        $ordersByStatus = Order::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'orders_by_status' => $ordersByStatus
        ]);
    }

    // 2. Tổng doanh thu chi tiết
    public function totalRevenue()
    {
        $revenue = OrderDetail::join('orders', 'order_details.order_id', '=', 'orders.id')
            ->whereIn('orders.status', ['confirmed', 'delivered'])
            ->sum(DB::raw('COALESCE(order_details.quantity, 0) * COALESCE(order_details.price, 0)'));

        $total = $revenue;

        return response()->json([
            'total_revenue' => $total,
            'details' => [
                'order_details_total' => $revenue
            ]
        ]);
    }


    // 4. Doanh thu theo ngày
    public function revenueByDate()
    {
        $revenue = Order::whereIn('status', ['confirmed', 'delivered'])
            ->select(DB::raw('DATE(date) as date'), DB::raw('SUM(total_amount) as total'))
            ->groupBy(DB::raw('DATE(date)'))
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($revenue);
    }

    // 5. Doanh thu theo tháng trong năm hiện tại
    public function revenueByMonth()
    {
        $year = now()->year;

        $monthly = Order::whereIn('status', ['confirmed', 'delivered'])
            ->whereYear('date', $year)
            ->select(DB::raw('MONTH(date) as month'), DB::raw('SUM(total_amount) as total'))
            ->groupBy(DB::raw('MONTH(date)'))
            ->orderBy('month')
            ->get();

        return response()->json($monthly);
    }


    // 6. Dịch vụ được đặt nhiều nhất
    public function topServices()
    {
        $top = OrderDetail::join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('services', 'order_details.service_id', '=', 'services.id')
            ->whereIn('orders.status', ['confirmed', 'delivered'])
            ->select('services.name', DB::raw('COUNT(order_details.id) as total'))
            ->groupBy('services.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json($top);
    }

    // 7. Phòng được đặt nhiều nhất
    public function topRooms()
    {
        $top = OrderDetail::join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('rooms', 'order_details.room_id', '=', 'rooms.id')
            ->whereIn('orders.status', ['confirmed', 'delivered'])
            ->select('rooms.name', DB::raw('COUNT(order_details.id) as total'))
            ->groupBy('rooms.name')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        return response()->json($top);
    }

    // 8. Menu được đặt nhiều nhất
    public function topMenus()
    {
        $top = OrderDetail::join('orders', 'order_details.order_id', '=', 'orders.id')
            ->join('menus', 'order_details.menu_id', '=', 'menus.id')
            ->whereIn('orders.status', ['confirmed', 'delivered'])
            ->select(
                'menus.name',
                DB::raw('COUNT(DISTINCT order_details.id) as order_count'),
                DB::raw('SUM(order_details.quantity) as total_quantity'),
                DB::raw('SUM(order_details.quantity * order_details.price) as total_revenue')
            )
            ->groupBy('menus.name')
            ->orderByDesc('order_count')
            ->limit(10)
            ->get();

        return response()->json($top);
    }


    // 9. Thống kê lịch phòng theo ngày
    public function roomSchedule(Request $request)
    {
        $date = $request->input('date', now()->toDateString());

        $rooms = Room::all();

        $orderIds = Order::whereDate('date', $date)
            ->whereIn('status', ['confirmed', 'delivered'])
            ->pluck('id');

        // Lấy chi tiết order của các đơn hàng đó, cùng với room_slot info
        $orderDetails = OrderDetail::with('roomSlot')
            ->whereIn('order_id', $orderIds)
            ->get();

        $data = $rooms->map(function ($room) use ($orderDetails) {
            // Lọc order detail của phòng này
            $detailsForRoom = $orderDetails->where('room_id', $room->id);

            // Kiểm tra buổi sáng (time_slot = 'morning') đã đặt chưa
            $morningBooked = $detailsForRoom->contains(function ($detail) {
                return $detail->roomSlot && $detail->roomSlot->time_slot === 'morning';
            });

            // Kiểm tra buổi chiều (time_slot = 'afternoon') đã đặt chưa
            $afternoonBooked = $detailsForRoom->contains(function ($detail) {
                return $detail->roomSlot && $detail->roomSlot->time_slot === 'afternoon';
            });

            return [
                'room_id' => $room->id,
                'room_name' => $room->name,
                'morning' => $morningBooked ? 'Đã đặt' : 'Còn trống',
                'afternoon' => $afternoonBooked ? 'Đã đặt' : 'Còn trống',
            ];
        });

        return response()->json([
            'date' => $date,
            'rooms' => $data,
        ]);
    }


    // 10. Thống kê người dùng
    public function userStatistics()
    {
        $totalUsers = User::count();

        return response()->json(['total_users' => $totalUsers]);
    }


    // 11. Phương thức thanh toán
    public function paymentMethods()
    {
        $methods = Order::select('method', DB::raw('count(*) as total'))
            ->groupBy('method')
            ->pluck('total', 'method');

        return response()->json($methods);
    }

    // 12. Đơn hàng gần đây
    public function recentOrders()
    {
        $orders = Order::with(['user', 'details.service', 'details.menu', 'details.room'])
            ->whereIn('status', ['confirmed', 'delivered'])
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get();

        $result = $orders->map(function ($order) {
            return [
                'id' => $order->id,
                'user_name' => $order->user->name ?? 'Khách lạ',
                'total_amount' => $order->total_amount,
                'status' => $order->status,
                'date' => $order->date,
                'time' => $order->time,
                'services' => $order->details->pluck('service.name')->filter()->unique()->values(),
                'menus' => $order->details->pluck('menu.name')->filter()->unique()->values(),
                'rooms' => $order->details->pluck('room.name')->filter()->unique()->values(),
            ];
        });

        return response()->json($result);
    }

    // 13. Hoạt động gần đây (đơn hàng & người dùng)
    public function recentActivities()
    {
        $activities = collect();

        // Lấy đơn hàng mới
        $orders = Order::with(['details.menu', 'details.service'])
            ->latest()
            ->take(5)
            ->get();

        foreach ($orders as $order) {
            $menus = $order->details->pluck('menu.name')->filter()->unique()->values();
            $services = $order->details->pluck('service.name')->filter()->unique()->values();

            $extra = collect([
                $menus->count() ? 'Menu: ' . $menus->implode(', ') : null,
                $services->count() ? 'Dịch vụ: ' . $services->implode(', ') : null,
            ])->filter()->implode(' | ');

            $activities->push([
                'type' => 'order',
                'title' => "Đơn hàng mới #ORD-{$order->id}" . ($extra ? " - {$extra}" : ''),
                'time' => $order->created_at->diffForHumans(),
                'timestamp' => $order->created_at->timestamp,
            ]);
        }

        // Lấy user mới
        $users = User::latest()->take(2)->get();
        foreach ($users as $user) {
            $activities->push([
                'type' => 'user',
                'title' => "Khách hàng mới: " . $user->name,
                'time' => $user->created_at->diffForHumans(),
                'timestamp' => $user->created_at->timestamp,
            ]);
        }

        // Sắp xếp & giới hạn 5
        $result = $activities->sortByDesc('timestamp')->take(5)->map(function ($a) {
            unset($a['timestamp']);
            return $a;
        })->values();

        return response()->json($result);
    }
}
