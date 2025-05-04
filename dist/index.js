"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const { Connection, Keypair } = require('@solana/web3.js');
const web3_js_1 = require("@solana/web3.js");
const prisma_1 = __importDefault(require("./prisma"));
const utils_1 = require("./utils");
const home_1 = __importDefault(require("./home"));
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
app.event('app_home_opened', home_1.default);
app.command('/airdrop_sol', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ No wallet found. Use `/start` to create one.',
        });
        return;
    }
    const publicKey = new web3_js_1.PublicKey(user.publicKey);
    const amount = parseFloat((Math.random() * 5).toFixed(2));
    try {
        const signature = yield connection.requestAirdrop(publicKey, amount * web3_js_1.LAMPORTS_PER_SOL);
        yield connection.confirmTransaction(signature, 'confirmed');
        yield app.client.chat.postMessage({
            channel: userId,
            text: `✅ Airdrop of *${amount} SOL* successful!\n\n🔗 Transaction Signature:\n\`${signature}\`\n\nView your wallet here: https://solscan.io/account/${publicKey.toBase58()}?cluster=devnet`,
        });
    }
    catch (err) {
        console.error('Airdrop failed:', err);
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Airdrop failed. Please try again later or check your wallet address.',
        });
    }
}));
app.command('/private_key', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ No wallet found. Use `/start` to create one.',
        });
        return;
    }
    const secretKeyArray = JSON.parse((0, utils_1.decrypt)(user.privateKey));
    const secretKey = Uint8Array.from(secretKeyArray); // Create Uint8Array
    const keypair = Keypair.fromSecretKey(secretKey); //generate keypair from secret key
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');
    yield app.client.chat.postMessage({
        channel: userId,
        text: `🔐 *Your Private Key (Base64)*\n\n\`${privateKeyBase64}\`\n\n⚠️ *Keep this key secure.* Anyone with this key can access your funds. Do NOT share it with anyone.`,
    });
}));
app.command('/reset', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    const args = command.text.trim().toLowerCase();
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ No wallet found. Use `/start` to create one.',
        });
        return;
    }
    // Get balance
    const publicKey = new web3_js_1.PublicKey(user.publicKey);
    const balanceLamports = yield connection.getBalance(publicKey);
    const balanceSol = balanceLamports / web3_js_1.LAMPORTS_PER_SOL;
    if (balanceSol > 0.01 && args !== 'confirm') {
        yield app.client.chat.postMessage({
            channel: userId,
            text: `⚠️ Your wallet still has *${balanceSol.toFixed(4)} SOL*. If you really want to reset, type \`/reset confirm\`. This will erase your wallet permanently.`,
        });
        return;
    }
    yield prisma_1.default.user.delete({ where: { id: userId } });
    yield app.client.chat.postMessage({
        channel: userId,
        text: '✅ Wallet has been reset. Use `/start` to generate a new one.',
    });
}));
app.command('/start', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    yield app.client.chat.postMessage({
        channel: userId,
        text: '🔍 Checking your wallet info...',
    });
    let user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: "👋 Welcome! We're creating your new Solana Devnet wallet. Please wait...",
        });
        const keypair = Keypair.generate();
        const publicKeyStr = keypair.publicKey.toBase58();
        user = yield prisma_1.default.user.create({
            data: {
                id: userId,
                publicKey: publicKeyStr,
                privateKey: (0, utils_1.encrypt)(JSON.stringify(Array.from(keypair.secretKey))),
            },
        });
    }
    else {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '👋 Welcome back! Checking your wallet info...',
        });
    }
    const publicKey = new web3_js_1.PublicKey(user.publicKey);
    const balanceLamports = yield connection.getBalance(publicKey);
    const balanceSOL = balanceLamports / web3_js_1.LAMPORTS_PER_SOL;
    yield app.client.chat.postMessage({
        channel: userId,
        text: `💳 *Your Wallet Info:*\n\n• *Public Key:* \`${user.publicKey}\`\n• *Balance:* ${balanceSOL} SOL\n\nYou can now use other commands.`,
    });
    console.log(`User ${userId} - Balance: ${balanceSOL} SOL`);
}));
app.command('/transfer_x_sol', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    const [amountStr, destinationAddress] = command.text.trim().split(/\s+/);
    if (!amountStr || !destinationAddress) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Usage: `/transfer_x_sol <amount> <destination_address>`\nExample: `/transfer_x_sol 0.5 DhjdCv63...`',
        });
        return;
    }
    const amountSOL = parseFloat(amountStr);
    if (isNaN(amountSOL) || amountSOL <= 0) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Invalid amount. Please enter a number greater than 0.',
        });
        return;
    }
    yield app.client.chat.postMessage({
        channel: userId,
        text: `🔄 Transferring *${amountSOL} SOL* to \`${destinationAddress}\`...`,
    });
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Wallet not found. Use `/start` to create one.',
        });
        return;
    }
    try {
        const secretKeyArray = JSON.parse((0, utils_1.decrypt)(user.privateKey));
        const senderKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        const lamports = Math.floor(amountSOL * 1e9);
        const balanceLamports = yield connection.getBalance(senderKeypair.publicKey);
        const feeBuffer = 5000; // approx transaction fee
        if (lamports + feeBuffer > balanceLamports) {
            yield app.client.chat.postMessage({
                channel: userId,
                text: '❌ Insufficient balance to complete this transaction.',
            });
            return;
        }
        const tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new web3_js_1.PublicKey(destinationAddress),
            lamports,
        }));
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [
            senderKeypair,
        ]);
        const link = `https://solscan.io/tx/${signature}?cluster=devnet`;
        yield app.client.chat.postMessage({
            channel: userId,
            text: `✅ Sent *${amountSOL} SOL* to \`${destinationAddress}\`\n🔗 View on SolScan: ${link}`,
        });
    }
    catch (err) {
        console.error('Transfer X SOL Error:', err);
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Transaction failed. Please check the destination address and try again.',
        });
    }
}));
app.command('/withdraw_all', (_a) => __awaiter(void 0, [_a], void 0, function* ({ command, ack }) {
    yield ack();
    const userId = command.user_id;
    const destinationAddress = command.text.trim();
    console.log(`User ${userId} - Withdraw All command received with address: ${destinationAddress}`);
    if (!destinationAddress) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Please provide a valid destination wallet address. Example:\n`/withdraw_all DhjdCv63...`',
        });
        return;
    }
    yield app.client.chat.postMessage({
        channel: userId,
        text: '🔍 Checking your wallet info...',
    });
    const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ No wallet found. Use `/start` to create one.',
        });
        return;
    }
    try {
        console.log('starting connection');
        const secretKeyArray = JSON.parse((0, utils_1.decrypt)(user.privateKey));
        const senderKeypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        console.log(senderKeypair);
        const balanceLamports = yield connection.getBalance(senderKeypair.publicKey);
        if (balanceLamports <= 5000) {
            yield app.client.chat.postMessage({
                channel: userId,
                text: '⚠️ Not enough SOL to withdraw. Network fees apply.',
            });
            return;
        }
        const tx = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: senderKeypair.publicKey,
            toPubkey: new web3_js_1.PublicKey(destinationAddress),
            lamports: balanceLamports - 5000,
        }));
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, tx, [
            senderKeypair,
        ]);
        const sol = (balanceLamports - 5000) / 1e9;
        const link = `https://solscan.io/tx/${signature}?cluster=devnet`;
        yield app.client.chat.postMessage({
            channel: userId,
            text: `✅ Successfully sent *${sol} SOL* to \`${destinationAddress}\`\n🔗 View on SolScan: ${link}`,
        });
    }
    catch (err) {
        console.error('Withdraw All Error:', err);
        yield app.client.chat.postMessage({
            channel: userId,
            text: '❌ Transaction failed. Please try again later.',
        });
    }
}));
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield app.start(process.env.PORT || 3000);
    console.log(`⚡️ Slack bot is running on PORT ${process.env.PORT || 3000}!`);
}))();
exports.default = app;
