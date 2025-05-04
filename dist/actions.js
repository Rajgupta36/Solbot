'use strict';
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done
          ? resolve(result.value)
          : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const _1 = __importDefault(require('.'));
const prisma_1 = __importDefault(require('./prisma'));
// Handle button actions
_1.default.action('deposit_sol', (_a) =>
  __awaiter(void 0, [_a], void 0, function* ({ ack, body, client }) {
    yield ack();
    const userId = body.user.id;
    const user = yield prisma_1.default.user.findUnique({
      where: { id: userId },
    });
    if (!user || !user.publicKey) {
      yield client.chat.postMessage({
        channel: userId,
        text: `❌ Could not find your wallet address. Please run \`/start\` to create one.`,
      });
      return;
    }
    // Provide deposit instructions and user's public key
    yield client.chat.postMessage({
      channel: userId,
      text: `💸 *Deposit SOL to your wallet:*\n\nTo deposit SOL to your wallet, send it to the following public key:\n\`${user.publicKey}\`\n\n⚠️ Please make sure you're sending SOL to this exact address!`,
    });
  })
);
