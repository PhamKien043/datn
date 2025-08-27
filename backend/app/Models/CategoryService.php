<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class CategoryService extends Model
{
    use HasFactory;

    protected $table = 'category_services';

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function services()
    {
        return $this->hasMany(Service::class, 'category_service_id');
    }
}
