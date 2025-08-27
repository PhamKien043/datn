<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomerFeedback extends Model
{
    protected $table = 'customer_feedbacks';

    protected $fillable = [
        'user_id',
        'event_booking_id',
        'rating',
        'status',
        'content',
    ];
}
