"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const crypto_js_1 = __importDefault(require("crypto-js"));
const config_1 = __importDefault(require("./config"));
const SECRET = config_1.default.messageSecret || 'fallback_secret';
function encrypt(text) {
    return crypto_js_1.default.AES.encrypt(text, SECRET).toString();
}
function decrypt(cipher) {
    const bytes = crypto_js_1.default.AES.decrypt(cipher, SECRET);
    return bytes.toString(crypto_js_1.default.enc.Utf8);
}
