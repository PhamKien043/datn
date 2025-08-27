<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherAdminController extends Controller
{
    /**
     * ✅ Lấy danh sách voucher (có phân trang, tìm kiếm, lọc status)
     */
    public function index(Request $request)
    {
        $query = Voucher::query();

        // Lọc theo trạng thái
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Tìm kiếm theo title
        if ($request->has('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Phân trang
        $perPage = $request->input('per_page', 10);
        $vouchers = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $vouchers
        ], 200);
    }

    /**
     * ✅ Thêm voucher mới
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'value' => 'required|numeric|min:0',
            'status' => 'required',
            'min_order_total' => 'nullable|numeric|min:0',
        ]);

        // Chuyển status về int
        $validated['status'] = filter_var($validated['status'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

        $voucher = Voucher::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Thêm voucher thành công',
            'data' => $voucher
        ], 201);
    }

    /**
     * ✅ Lấy chi tiết voucher
     */
    public function show($id)
    {
        $voucher = Voucher::find($id);
        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $voucher
        ], 200);
    }

    /**
     * ✅ Cập nhật voucher
     */
    public function update(Request $request, $id)
    {
        $voucher = Voucher::find($id);
        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'value' => 'required|numeric|min:0',
            'status' => 'required',
            'min_order_total' => 'nullable|numeric|min:0',
        ]);

        // Chuyển status về int
        $validated['status'] = filter_var($validated['status'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;

        $voucher->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Cập nhật voucher thành công',
            'data' => $voucher
        ], 200);
    }

    /**
     * ✅ Xóa voucher
     */
    public function destroy($id)
    {
        $voucher = Voucher::find($id);
        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy voucher'
            ], 404);
        }

        $voucher->delete();

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa voucher'
        ], 200);
    }

    /**
     * ✅ Kiểm tra tên voucher trùng
     */
    public function checkName(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:100',
            'id' => 'nullable|integer'
        ]);

        $title = strtolower(trim($request->input('title')));
        $id = $request->input('id');

        $query = Voucher::whereRaw('LOWER(title) = ?', [$title]);

        if (!empty($id)) {
            $query->where('id', '!=', $id);
        }

        return response()->json(['exists' => $query->exists()], 200);
    }
}
