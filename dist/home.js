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
const prisma_1 = __importDefault(require("./prisma"));
const Home = (_a) => __awaiter(void 0, [_a], void 0, function* ({ event, client }) {
    const userId = event.user;
    try {
        const user = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        const publicKeyStr = user === null || user === void 0 ? void 0 : user.publicKey;
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
        yield client.views.publish({
            user_id: userId,
            view,
        });
    }
    catch (err) {
        console.error('Error publishing Home Tab:', err);
    }
});
exports.default = Home;
