
import { supabase } from '../services/supabase';

/**
 * Vercel Serverless Function for Telegram Webhook
 * Handles commands: /start, /balance, /claim, /watch_ads
 */
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { message } = req.body;
  if (!message || !message.text) return res.status(200).send('OK');

  const chatId = message.chat.id;
  const text = message.text.toLowerCase();
  const telegramUser = message.from.username || `user_${chatId}`;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8552243007:AAGW5kSZ9UnXY1o6B6oq2xYr_v9xPFXt9GU";

  const sendMessage = async (msg: string) => {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    });
  };

  try {
    let { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('username', telegramUser.toUpperCase())
      .maybeSingle();

    if (text === '/start') {
      const welcomeMsg = user 
        ? `Welcome back, *${telegramUser}*! 🚀\n\nYour current node is active.\nUse /balance to check earnings.\nUse /watch_ads to earn $WOS from ads.` 
        : `Welcome to *WealthOS Quantum Ecosystem*! 🌐\n\nTo start earning, register on our web portal with the username: *${telegramUser.toUpperCase()}*`;
      await sendMessage(welcomeMsg);
    } 
    
    else if (text === '/balance') {
      if (!user) return sendMessage("❌ User not found. Login to the web portal first.");
      await sendMessage(`💎 *WealthOS Balance*\n\nUser: \`${user.username}\`\nBalance: *${user.earnings.toFixed(2)} WOS*\nStatus: *Node Active* ✅`);
    }

    else if (text === '/watch_ads') {
      if (!user) return sendMessage("❌ Register first.");
      
      // Send ad link and credit reward
      const adReward = 0.15;
      const adUrl = "https://example-ads.com/telegram-special";
      
      const newBalance = (user.earnings || 0) + adReward;
      await supabase.from('users').update({ earnings: newBalance }).eq('id', user.id);

      await sendMessage(`📺 *Quantum Ad Channel*\n\n1. Click link: [Watch Now](${adUrl})\n2. Reward: *${adReward} WOS*\n\nNew Balance: *${newBalance.toFixed(2)} WOS*`);
    }

    else if (text === '/claim') {
      if (!user) return sendMessage("❌ Register first.");
      const now = new Date();
      const lastClaim = user.last_reset ? new Date(user.last_reset) : new Date(0);
      
      if (now.toDateString() === lastClaim.toDateString() && user.viewed_today >= 21) {
        return sendMessage("⏳ *Daily Limit Reached!*");
      }

      const reward = 0.5; 
      const newBalance = (user.earnings || 0) + reward;
      await supabase.from('users').update({ earnings: newBalance, last_reset: now.toISOString() }).eq('id', user.id);
      await sendMessage(`🎁 *Reward Claimed!*\n\nYou received *${reward} WOS*.\nNew Balance: *${newBalance.toFixed(2)} WOS*`);
    }

    return res.status(200).send('OK');
  } catch (error) {
    return res.status(200).send('Internal Error But OK');
  }
}
