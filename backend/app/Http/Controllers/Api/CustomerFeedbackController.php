<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CustomerFeedbackRequest;
use App\Models\CustomerFeedback;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class CustomerFeedbackController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'event_booking_id' => 'required|exists:event_bookings,id',
            'rating' => 'required',
            'content' => 'required',
        ]);
         $data_feedback = [
             'user_id' => Auth::id(),
             'event_booking_id' => $request->event_booking_id,
             'rating' => $request->rating,
             'content' => $request->content,
             'status' => 1,
         ];

         try {
             $feedback = CustomerFeedback::create($data_feedback);

             return response()->json([
                'success' => true,
                 'message' => 'Feedback thành công',
                 'data' => $feedback
             ], 201);
         } catch (QueryException $e) {
             return response()->json([
                'success' => false,
                 'message' => 'Feedback không thành công do lỗi hệ thống',
                 'error' => $e->getMessage()
             ], 500);
         }
    }

    /**
     * Display the specified resource.
     */
    public function show(CustomerFeedback $customerFeedback)
    {
       return response()->json([
           'success' => true,
           'message' => 'Feedback',
           'data' => $customerFeedback
       ]);
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
        $deletedRows = CustomerFeedback::where('id', $id)->delete();
        if ($deletedRows > 0) {
            return response()->json([
                'success' => true,
                'message' => 'Xóa feedback thành công',
            ], 200);
        }

        return response()->json([
            'success' => false,
            'message' => 'Không tìm thấy feedback để xóa'
        ]);
    }
}
