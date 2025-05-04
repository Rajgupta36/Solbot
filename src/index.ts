const { Connection, Keypair } = require('@solana/web3.js');
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import prisma from './prisma';
import { decrypt, encrypt } from './utils';
import Home from './home';
const { App } = require('@slack/bolt');
require('dotenv').config();
const bcrypt = require('bcrypt');

const connection = new Connection('https://api.devnet.solana.com');
const saltRounds = 10;

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
});

//events
app.event('app_home_opened', Home);

app.command('/airdrop_sol', async ({ command, ack }) => {
  await ack();

  const userId = command.user_id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ No wallet found. Use `/start` to create one.',
    });
    return;
  }

  const publicKey = new PublicKey(user.publicKey);

  const amount = parseFloat((Math.random() * 5).toFixed(2));

  try {
    const signature = await connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await connection.confirmTransaction(signature, 'confirmed');

    await app.client.chat.postMessage({
      channel: userId,
      text: `✅ Airdrop of *${amount} SOL* successful!\n\n🔗 Transaction Signature:\n\`${signature}\`\n\nView your wallet here: https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`,
    });
  } catch (err) {
    console.error('Airdrop failed:', err);
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Airdrop failed. Please try again later or check your wallet address.',
    });
  }
});

app.command('/private_key', async ({ command, ack }) => {
  await ack();
  const userId = command.user_id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ No wallet found. Use `/start` to create one.',
    });
    return;
  }
  const secretKeyArray = JSON.parse(decrypt(user.privateKey));
  const secretKey = Uint8Array.from(secretKeyArray); // Create Uint8Array
  const keypair = Keypair.fromSecretKey(secretKey); //generate keypair from secret key
  const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

  await app.client.chat.postMessage({
    channel: userId,
    text: `🔐 *Your Private Key (Base64)*\n\n\`${privateKeyBase64}\`\n\n⚠️ *Keep this key secure.* Anyone with this key can access your funds. Do NOT share it with anyone.`,
  });
});

app.command('/reset', async ({ command, ack }) => {
  await ack();

  const userId = command.user_id;
  const args = command.text.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ No wallet found. Use `/start` to create one.',
    });
    return;
  }

  // Get balance
  const publicKey = new PublicKey(user.publicKey);
  const balanceLamports = await connection.getBalance(publicKey);
  const balanceSol = balanceLamports / LAMPORTS_PER_SOL;

  if (balanceSol > 0.01 && args !== 'confirm') {
    await app.client.chat.postMessage({
      channel: userId,
      text: `⚠️ Your wallet still has *${balanceSol.toFixed(4)} SOL*. If you really want to reset, type \`/reset confirm\`. This will erase your wallet permanently.`,
    });
    return;
  }

  await prisma.user.delete({ where: { id: userId } });

  await app.client.chat.postMessage({
    channel: userId,
    text: '✅ Wallet has been reset. Use `/start` to generate a new one.',
  });
});

app.command('/start', async ({ command, ack }) => {
  await ack();
  const userId = command.user_id;

  await app.client.chat.postMessage({
    channel: userId,
    text: '🔍 Checking your wallet info...',
  });

  let user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: "👋 Welcome! We're creating your new Solana Devnet wallet. Please wait...",
    });

    const keypair = Keypair.generate();
    const publicKeyStr = keypair.publicKey.toBase58();

    user = await prisma.user.create({
      data: {
        id: userId,
        publicKey: publicKeyStr,
        privateKey: encrypt(JSON.stringify(Array.from(keypair.secretKey))),
      },
    });
  } else {
    await app.client.chat.postMessage({
      channel: userId,
      text: '👋 Welcome back! Checking your wallet info...',
    });
  }

  const publicKey = new PublicKey(user.publicKey);
  const balanceLamports = await connection.getBalance(publicKey);
  const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

  await app.client.chat.postMessage({
    channel: userId,
    text: `💳 *Your Wallet Info:*\n\n• *Public Key:* \`${user.publicKey}\`\n• *Balance:* ${balanceSOL} SOL\n\nYou can now use other commands.`,
  });

});

app.command('/transfer_x_sol', async ({ command, ack }) => {
  await ack();

  const userId = command.user_id;
  const [amountStr, destinationAddress] = command.text.trim().split(/\s+/);

  if (!amountStr || !destinationAddress) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Usage: `/transfer_x_sol <amount> <destination_address>`\nExample: `/transfer_x_sol 0.5 DhjdCv63...`',
    });
    return;
  }

  const amountSOL = parseFloat(amountStr);
  if (isNaN(amountSOL) || amountSOL <= 0) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Invalid amount. Please enter a number greater than 0.',
    });
    return;
  }

  await app.client.chat.postMessage({
    channel: userId,
    text: `🔄 Transferring *${amountSOL} SOL* to \`${destinationAddress}\`...`,
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Wallet not found. Use `/start` to create one.',
    });
    return;
  }

  try {
    const secretKeyArray = JSON.parse(decrypt(user.privateKey));
    const senderKeypair = Keypair.fromSecretKey(
      Uint8Array.from(secretKeyArray)
    );

    const lamports = Math.floor(amountSOL * 1e9);
    const balanceLamports = await connection.getBalance(
      senderKeypair.publicKey
    );

    const feeBuffer = 5000; // approx transaction fee
    if (lamports + feeBuffer > balanceLamports) {
      await app.client.chat.postMessage({
        channel: userId,
        text: '❌ Insufficient balance to complete this transaction.',
      });
      return;
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [
      senderKeypair,
    ]);

    const link = `https://solscan.io/tx/${signature}?cluster=devnet`;
    await app.client.chat.postMessage({
      channel: userId,
      text: `✅ Sent *${amountSOL} SOL* to \`${destinationAddress}\`\n🔗 View on SolScan: ${link}`,
    });
  } catch (err) {
    console.error('Transfer X SOL Error:', err);
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Transaction failed. Please check the destination address and try again.',
    });
  }
});

app.command('/withdraw_all', async ({ command, ack }) => {
  await ack();

  const userId = command.user_id;
  const destinationAddress = command.text.trim();

  if (!destinationAddress) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Please provide a valid destination wallet address. Example:\n`/withdraw_all DhjdCv63...`',
    });
    return;
  }

  await app.client.chat.postMessage({
    channel: userId,
    text: '🔍 Checking your wallet info...',
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ No wallet found. Use `/start` to create one.',
    });
    return;
  }

  try {
    const secretKeyArray = JSON.parse(decrypt(user.privateKey));

    const senderKeypair = Keypair.fromSecretKey(
      Uint8Array.from(secretKeyArray)
    );
    const balanceLamports = await connection.getBalance(
      senderKeypair.publicKey
    );
    if (balanceLamports <= 5000) {
      await app.client.chat.postMessage({
        channel: userId,
        text: '⚠️ Not enough SOL to withdraw. Network fees apply.',
      });
      return;
    }

    const tx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: new PublicKey(destinationAddress),
        lamports: balanceLamports - 5000,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, tx, [
      senderKeypair,
    ]);

    const sol = (balanceLamports - 5000) / 1e9;
    const link = `https://solscan.io/tx/${signature}?cluster=devnet`;

    await app.client.chat.postMessage({
      channel: userId,
      text: `✅ Successfully sent *${sol} SOL* to \`${destinationAddress}\`\n🔗 View on SolScan: ${link}`,
    });
  } catch (err) {
    console.error('Withdraw All Error:', err);
    await app.client.chat.postMessage({
      channel: userId,
      text: '❌ Transaction failed. Please try again later.',
    });
  }
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log(`⚡️ Slack bot is running on PORT ${process.env.PORT || 3000}!`);
})();

export default app;
