<?php

use App\Http\Controllers\Api\Admin\AdminOrderController;
use App\Http\Controllers\Api\Admin\CategoryMenuAdminController;
use App\Http\Controllers\Api\Admin\LocationTypeAdminController;
use App\Http\Controllers\Api\Admin\MenuAdminController;
use App\Http\Controllers\Api\Admin\VoucherAdminController;



use App\Http\Controllers\Api\Admin\RoomsAdminController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Admin\BlogAdminController;
use App\Http\Controllers\Api\Admin\EmailAdminController;
use App\Http\Controllers\API\CartDetailController;
use App\Http\Controllers\Api\CategoryMenuController;
use App\Http\Controllers\Api\CategoryServiceController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\LocationTypeController;
use App\Http\Controllers\Api\MenuController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\RoomSlotController;
use App\Http\Controllers\Api\ServiceController;
use App\Http\Controllers\api\StatisticController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\VnpayController;

use App\Http\Controllers\Api\EmailController;

use App\Http\Controllers\Api\VoucherController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;


// routes/web.php (hoặc api.php nếu đang phục vụ qua /api)
Route::get('/phpinfo', function () { phpinfo(); });


Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

/* Giữ cả 2 alias để tương thích FE */
Route::post('/auth/google/token', [AuthController::class, 'googleLogin']);
Route::post('/auth/google-login', [AuthController::class, 'googleLogin']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});
// Google Authentication Routes
Route::get('auth/google', [GoogleAuthController::class, 'redirectToGoogle']);
Route::get('auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
Route::post('auth/google/token', [GoogleAuthController::class, 'loginWithGoogleToken']);
Route::get('/users', [UserController::class, 'index']);
Route::post('/users', [UserController::class, 'store']);

// Kiểm tra trùng username/email/name
Route::get('/users/check-unique', [UserController::class, 'checkUnique']);

// Chỉ admin (role=true)
Route::middleware('admin')->prefix('admin')->group(function () {
    Route::get('/dashboard', fn () => response()->json(['ok' => true]));

});

// Blog
Route::prefix('admin')->group(function () {
    Route::get('/blog', [BlogAdminController::class, 'index']);
    Route::post('/blog', [BlogAdminController::class, 'store']);
    Route::get('/blog/{id}', [BlogAdminController::class, 'show']);
    Route::put('/blog/{id}', [BlogAdminController::class, 'update']);
    Route::delete('/blog/{id}', [BlogAdminController::class, 'destroy']);
    Route::post('/blog/check-name', [BlogAdminController::class, 'checkTitle']);
});

//Email
Route::prefix('admin')->group(function () {
    Route::get('/email', [EmailAdminController::class, 'index']);
    Route::get('/email/{id}', [EmailAdminController::class, 'show']);
    Route::get('/emails/unread-count', [EmailAdminController::class, 'getUnreadCount']);
    Route::post('/emails/mark-read', [EmailAdminController::class, 'markAsRead']);
});

Route::post('/emails', [EmailController::class, 'store']);


//Thanh Trúc

// Vouchers Client
Route::get('/vouchers', [VoucherController::class, 'index']);
Route::get('/vouchers/{id}', [VoucherController::class, 'show']);

// Dịch vụ
Route::apiResource('services', ServiceController::class);
Route::apiResource('category-services', CategoryServiceController::class);

Route::get('/menus/search', [MenuController::class, 'search'])->name('menus.search');

// Menus
Route::apiResource('menus', MenuController::class);

// Danh mục Menus
Route::apiResource('category-menus', CategoryMenuController::class);

//Món ăn theo Danh mục
Route::get('/category-menus-with-menus', [CategoryMenuController::class, 'getCategoriesWithMenus']);

// Route để lấy danh sách tất cả các phòng
Route::get('/rooms', [RoomController::class, 'index']);
Route::get('/rooms/{id}', [RoomController::class, 'show']);

// Ngày và Giờ
Route::apiResource('room-slots', RoomSlotController::class);
Route::prefix('admin')->group(function () {
    Route::get('location-types', [LocationTypeController::class, 'index']);
    Route::get('rooms', [RoomController::class, 'index']);
    Route::get('room-slots', [RoomSlotController::class, 'index']);
    Route::post('room-slots', [RoomSlotController::class, 'store']);
    Route::put('room-slots/{id}', [RoomSlotController::class, 'update']);
    Route::delete('room-slots/{id}', [RoomSlotController::class, 'destroy']);

    Route::post('room-slots/create-payment', [RoomSlotController::class, 'createPayment']);
    Route::post('room-slots/confirm-payment', [RoomSlotController::class, 'confirmPayment']);
    Route::post('orders/{id}/cancel', [RoomSlotController::class, 'cancelBooking']);

    Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::apiResource('room-slots', RoomSlotController::class);
        Route::post('room-slots/bulk-update', [RoomSlotController::class, 'bulkUpdate']);
        Route::delete('room-slots/bulk-delete', [RoomSlotController::class, 'bulkDelete']);
        Route::post('room-slots/generate', [RoomSlotController::class, 'generateSlots']);
    });
});
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});


Route::prefix('payment')->group(function () {

    // Get data for payment page
    Route::get('/menus', [PaymentController::class, 'getMenus']);
    Route::get('/rooms', [PaymentController::class, 'getRooms']);
    Route::get('/room-slots', [PaymentController::class, 'getRoomSlots']);

    // ========== USER ROUTES (require authentication) ==========

    // Cart and payment processing
    Route::post('/cart', [PaymentController::class, 'getCartForPayment']);
    Route::post('/redirect', [PaymentController::class, 'redirectToGateway']);
    Route::post('/check-status', [PaymentController::class, 'checkStatus']);

    // Order management
    Route::get('/order', [PaymentController::class, 'getOrderSummary']);
    Route::post('/cancel', [PaymentController::class, 'cancelOrder']);
    Route::get('/orders', [PaymentController::class, 'getUserOrders']);

    // ========== GATEWAY CALLBACK ROUTES ==========

    // MoMo callbacks
    Route::get('/return', [PaymentController::class, 'returnFromMomo']);
    Route::post('/callback', [PaymentController::class, 'callback']);
});

// ====================
// VNPAY ROUTES GROUP
// ====================
Route::prefix('vnpay')->group(function () {

    // VNPay payment processing
    Route::post('/redirect', [VnpayController::class, 'redirectToGateway']);
    Route::post('/check-status', [VnpayController::class, 'checkStatus']);

    // VNPay callback

});
// Route cho VNPay callback (không nằm trong prefix 'payment')
Route::get('/vnpay/return', [VnpayController::class, 'returnFromVnpay'])->name('api.vnpay.return');
Route::get('/orders/{order}', [OrderController::class, 'show']);
// Loại phòng
Route::apiResource('location-types', LocationTypeController::class);
Route::get('/location-types', [LocationTypeController::class, 'index']);
Route::post('/location-types', [LocationTypeController::class, 'store']);


// Giỏ hàng
Route::apiResource('cart-details', CartDetailController::class);


Route::delete('/cart-details/user/{userId}', [CartDetailController::class, 'clearByUserId']);

Route::group([], function () {
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::put('/orders/{id}', [OrderController::class, 'update']);
    Route::delete('/orders/{id}', [OrderController::class, 'destroy']);
});


//admin đơn hàng
Route::group(['prefix' => 'admin'], function () {
    Route::get('/orders', [AdminOrderController::class, 'index']);
    Route::get('/orders/{id}', [AdminOrderController::class, 'show']);
    Route::put('/orders/{id}', [AdminOrderController::class, 'update']);
});

Route::get('/menus1', [PaymentController::class, 'getMenus']);
Route::get('/rooms1', [PaymentController::class, 'getRooms']);

//end phần Thanh Trúc



///////////////////////////////// Phần Trì ///////////////////////////////////////////////

Route::prefix('admin')->group(function () {
    // Rooms
    Route::apiResource('/rooms', RoomsAdminController::class);
    Route::post('rooms/id/{id}', [RoomsAdminController::class, 'update']);
    Route::get('/rooms/check-name', [RoomsAdminController::class, 'checkName']);

    // Category menus
    Route::apiResource('/category_menus', CategoryMenuAdminController::class);
    Route::post('/category_menus/check-name', [CategoryMenuAdminController::class, 'checkName']);

    // Menus
    Route::apiResource('/menus', MenuAdminController::class);
    ;
    Route::post('/menus/check-name', [MenuAdminController::class, 'checkName']);

    // Location types
    Route::apiResource('/location-types', LocationTypeAdminController::class);
    Route::post('/location-types/check-name', [LocationTypeAdminController::class, 'checkName']);

    // Voucher
    Route::get('/voucher/check-name', [VoucherAdminController::class, 'checkName']);
    Route::apiResource('voucher', VoucherAdminController::class);
});

// Users
Route::apiResource('/users', UserController::class);

Route::get('/users/check-unique', [UserController::class, 'checkUnique']);






Route::prefix('statistics')->controller(StatisticController::class)->group(function () {
    Route::get('/overview', 'overview');

    // Doanh thu
    Route::get('/total-revenue', 'totalRevenue');
    Route::get('/revenue-by-category', 'revenueByCategory');
    Route::get('/revenue-daily', 'revenueByDate');
    Route::get('/revenue-monthly', 'revenueByMonth');

    // Top đặt nhiều
    Route::get('/top-services', 'topServices');
    Route::get('/top-rooms', 'topRooms');
    Route::get('/top-menus', 'topMenus');

    Route::get('/room-schedule', 'roomSchedule');
    Route::get('/users', 'userStatistics');

    // Thanh toán
    Route::get('/payment-methods', 'paymentMethods');

    // Gần đây
    Route::get('/recent-orders', 'recentOrders');
    Route::get('/recent-activities', 'recentActivities');
});


// Google Authentication Routes
Route::get('auth/google', [GoogleAuthController::class, 'redirectToGoogle']);
Route::get('auth/google/callback', [GoogleAuthController::class, 'handleGoogleCallback']);
Route::post('auth/google/token', [GoogleAuthController::class, 'loginWithGoogleToken']);

