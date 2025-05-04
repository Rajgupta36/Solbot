# Solana Wallet Bot for Slack

Welcome to the **Solana Wallet Bot**! This bot enables users to interact with the Solana network via Slack commands, making it easy to manage wallets, send SOL, and perform various wallet operations.

---

## 📢 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you’d like to change.

If you find this project useful, please consider giving it a ⭐️ on GitHub!

---

## 🚀 Features

- **Wallet Initialization & Management**
  - Initialize or refresh your wallet with `/start`.
  - Get your private key with `/private_key` (use with caution).
  - View your wallet on SolScan with `/view_wallet`.

- **Transaction Operations**
  - Request test SOL using `/airdrop_sol` (random between 0 to 5 SOL).
  - Transfer SOL to another wallet using `/transfer_x_sol <amount> <recipient_address>`.
  - Withdraw all funds to your wallet using `/withdraw_all <wallet_address>`.

- **Wallet Reset**
  - Reset your wallet with `/reset confirm` for a fresh start.

---

## 💬 Commands

Here’s a quick overview of available commands and their usage:

- `/airdrop_sol` → Request test SOL (random between 0 to 5) on Solana.
- `/start` → Initialize or refresh your wallet.
- `/transfer_x_sol <amount> <recipient_address>` → Send SOL to another wallet.
- `/withdraw_all <wallet_address>` → Withdraw all funds to your wallet.
- `/reset confirm` → Reset your wallet.
- `/private_key` → Get your private key (use with caution).

---

## 🔗 Integration with Solana

This bot uses the Solana **Devnet** for test transactions. Users can view their wallet on [SolScan](https://solscan.io) for transparency.

---

## 🛠 Getting Started

To set up the bot locally, follow these steps:

### 1. Clone the Repository

```bash
git clone https://github.com/Rajgupta36/Solbot.git
cd solbot

```
### 2. Install Dependencies

```sh
npm install
```

### 3. Set Up Environment Variables
Create a .env file in the root directory with the following content:
```sh
DATABASE_URL=<your-database-url>
ENCRYPTION_SECRET=<your-encryption-secret>
PORT=3000
SLACK_BOT_TOKEN=<your-slack-bot-token>
SLACK_SIGNING_SECRET=<your-slack-signing-secret>
SOLANA_RPC_URL=<your-solana-network-url>
```
### 4. Run Database Migrations and generate client
```sh
npx prisma migrate dev --name init
```

### 5. Start the Development Server
```sh
npm run dev
```

### 6. Start ngrok tunnel
Use ngrok to expose your local server to the internet (required for Slack to receive events):
```sh
npx ngrok http 3000
```
Copy the generated public URL and update it in your Slack App configuration under Event Subscriptions and Slash Commands.

## 📝 License

This project is licensed under the [MIT License](./LICENSE).