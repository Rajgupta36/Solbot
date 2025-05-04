import prisma from './prisma';

const Home = async ({ event, client }) => {
  const userId = event.user;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const publicKeyStr = user?.publicKey;

    const view = {
      type: 'home',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `👋 Welcome <@${userId}> to *Solana Wallet Bot*!`,
          },
        },
        { type: 'divider' },

        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📘 *Available Commands & Usage:*`,
          },
        },

        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `
       • \`/airdrop_sol\` → Request test SOL (random between 0 to 5) on devnet  
    • \`/start\` → Initialize or refresh your wallet  
    • \`/transfer_x_sol <amount> <recipient_address>\` → Send SOL to another wallet  
    • \`/withdraw_all <wallet_address>\` → Withdraw to your wallet  
    • \`/reset confirm\` → Reset your wallet  
    • \`/private_key\` → Get your private key (use with caution)  
            `,
          },
        },

        { type: 'divider' },

        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `🔍 View your wallet on SolScan:`,
          },
        },

        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '🔍 View on SolScan' },
              url: publicKeyStr
                ? `https://solscan.io/account/${publicKeyStr}?cluster=devnet`
                : undefined,
            },
          ],
        },

        { type: 'divider' },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '💡 Pro Tip: Use `/start` anytime to check or initialize your wallet.',
            },
          ],
        },
      ],
    };

    await client.views.publish({
      user_id: userId,
      view,
    });
  } catch (err) {
    console.error('Error publishing Home Tab:', err);
  }
};

export default Home;
