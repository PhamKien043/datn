<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    use HasFactory;

    protected $table = 'menus';

    protected $fillable = [
        'id','name','description','image','price','type','is_chay','status','category_id',
    ];
    public $timestamps = false;

    protected $appends = ['image_url']; // <-- thêm

    public function category()
    {
        return $this->belongsTo(CategoryMenu::class, 'category_id');
    }

    public function getImageUrlAttribute()
    {
        if (!$this->image) return null;
        // Đảm bảo đã chạy: php artisan storage:link
        return url('storage/menus/'.$this->image);
    }
}
