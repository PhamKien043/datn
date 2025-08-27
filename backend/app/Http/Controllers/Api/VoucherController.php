<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class VoucherController extends Controller
{
    public function index(Request $request)
    {
        $userId = (int) $request->query('user_id', 0);
        $total  = (float) $request->query('total', 0);

        if ($userId <= 0) {
            Log::warning('Missing user_id in voucher request', ['request' => $request->all()]);
        }

        $vouchers = Voucher::query()
            ->where('status', true)
            ->get()
            ->map(function ($v) use ($userId, $total) {
                $inDateRange = (!$v->start_date || now()->gte($v->start_date)) &&
                    (!$v->end_date   || now()->lte($v->end_date));

                // Nếu DB của bạn có cặp trường is_used + used_by_user_id thì giữ cách check này
                $usedByUser = $userId > 0 && $v->used_by_user_id == $userId && (bool)$v->is_used;

                return [
                    'id'              => $v->id,
                    'code'            => $v->code,
                    'title'           => $v->title,
                    'type'            => $v->type,
                    'value'           => (float) $v->value,
                    'min_order_total' => (float) ($v->min_order_total ?? 0),
                    'start_date'      => $v->start_date?->toDateString(),
                    'end_date'        => $v->end_date?->toDateString(),
                    'status'          => (bool) $v->status,
                    'used_by_user'    => $usedByUser,
                    'eligible'        => $inDateRange && $total >= (float) ($v->min_order_total ?? 0) && !$usedByUser,
                ];
            });

        return response()->json(['success' => true, 'data' => $vouchers], 200);
    }

    public function show($id, Request $request)
    {
        $baseTotal = (float) $request->query('total', 0);
        $userId    = (int) $request->query('user_id', 0);
        $now       = now();

        $v = Voucher::find($id);
        if (!$v) {
            return response()->json(['success' => false, 'message' => 'Voucher không tồn tại'], 404);
        }

        $activeByStatus = (bool) $v->status;
        $activeByStart  = !$v->start_date || $v->start_date->startOfDay() <= $now;
        $activeByEnd    = !$v->end_date   || $v->end_date->endOfDay()   >= $now;
        $activeWindow   = $activeByStatus && $activeByStart && $activeByEnd;

        $min        = (float) ($v->min_order_total ?? 0);
        $meetsMin   = $baseTotal >= $min;
        $usedByUser = $userId > 0 && $v->used_by_user_id == $userId && (bool)$v->is_used;

        $data = [
            'id'              => $v->id,
            'code'            => $v->code ?? null,
            'title'           => $v->title,
            'type'            => $v->type,
            'value'           => (float) $v->value,
            'min_order_total' => $min,
            'start_date'      => optional($v->start_date)->toDateString(),
            'end_date'        => optional($v->end_date)->toDateString(),
            'status'          => (bool) $v->status,
            'used_by_user'    => (bool) $usedByUser,
            'eligible'        => $activeWindow && $meetsMin && !$usedByUser,
        ];

        return response()->json(['success' => true, 'data' => $data], 200);
    }
}
