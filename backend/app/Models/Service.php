<?php


namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $table = 'services';

    protected $fillable = [
        'name',
        'image',
        'description',
        'status',
        'category_service_id',
    ];

    public function category()
    {
        return $this->belongsTo(CategoryService::class, 'category_service_id');
    }

    public function orderDetails()
    {
        return $this->hasMany(OrderDetail::class);
    }

    public function cartDetails()
    {
        return $this->hasMany(CartDetail::class);
    }


}
