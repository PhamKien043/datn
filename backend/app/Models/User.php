<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'username',
        'email',
        'email_verified_at',
        'password',
        'phone',
        'avatar',
        'address',
        'role',
        'google_id',
        'provider',
        'remember_token',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => 'boolean', //  thêm dòng này để FE đọc đúng true/false
            'status' => 'boolean',  // FE đọc true/false
        ];

    }

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'role' => 'boolean',    // FE đọc true/false
        'status' => 'boolean',  // FE đọc true/false
    ];

//     Kiểm tra quyền
    public function isAdmin(): bool
    {
        return $this->role === 0; // 0 = admin
    }

    public function isUser(): bool
    {
        return $this->role === 1; // 1 = user
    }
    

}
