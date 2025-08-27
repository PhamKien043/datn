<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CustomerFeedback;
use Illuminate\Http\Request;

class CustomerFeedbackController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $keyword = request('keyword');
        $customer = CustomerFeedback::latest();
        $paginate = request('paginate') ?? 5;
        if ($keyword) {
            $customer->where((function ($query) use ($keyword) {
                $query->where('content', 'like', '%' . $keyword . '%');
            }));
        }
        return response()->json([
            'success' => true,
            'message' => 'Danh sách feedback',
            'data' => $customer->paginate($paginate)
        ], 200);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $deletedRows = CustomerFeedback::where('id', $id)->delete();
            if ($deletedRows > 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'Xóa feedback thành công'
                ], 200);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi không thể xóa'
            ]);
        }
    }
}
