<?php

namespace App\Models;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReplyToCustomerMail extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $replyMessage;

    public function __construct($email, $replyMessage)
    {
        $this->email = $email;
        $this->replyMessage = $replyMessage;
    }

    public function build()
    {
        return $this->subject('Phản hồi từ HAPPY EVENT')
            ->markdown('emails.reply')
            ->with([
                'email' => $this->email,
                'replyMessage' => $this->replyMessage,
            ]);
    }
}
