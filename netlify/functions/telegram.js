import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mugdmvdtbvmaglzeittz.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Z2RtdmR0YnZtYWdsemVpdHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NDUzNjksImV4cCI6MjA5NjUyMTM2OX0.Qv9JKFYdatwXz1LEvvZfPY_5Eclzs-Qw1zBWr6eV5Us';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BOT_TOKEN = '8946477442:AAHZAuZKTyPq-tzYHUkH55B8s5ZgG6TGD30';

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const update = JSON.parse(event.body);

    if (update.callback_query) {
      const callbackQuery = update.callback_query;
      const data = callbackQuery.data;

      if (data.startsWith('approve_')) {
        const parts = data.split('_');
        const reqId = parts[1];
        const userId = parts[2];

        // Update payment_requests status
        await supabase.from('payment_requests').update({ status: 'approved' }).eq('id', reqId);
        
        // Update user profile to premium
        await supabase.from('profiles').update({ is_premium: true }).eq('id', userId);

        // Edit the message in Telegram
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message.chat.id,
            message_id: callbackQuery.message.message_id,
            text: callbackQuery.message.text + '\n\n✅ Tasdiqlandi!'
          })
        });

        // Answer callback query
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: 'Premium faollashtirildi!'
          })
        });

        return { statusCode: 200, body: 'OK' };
      }
    }

    return { statusCode: 200, body: 'Ignored' };
  } catch (error) {
    console.error('Webhook error:', error);
    return { statusCode: 500, body: 'Error processing webhook' };
  }
};
