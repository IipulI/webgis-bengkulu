import crypto from 'node:crypto';

export function generateUUIDv7(timestampMs) {
    const ts = BigInt(timestampMs);
    const randomBytes = new Uint8Array(10);
    crypto.getRandomValues(randomBytes);

    const tsHex = ts.toString(16).padStart(12, '0');
    const randAVal = ((randomBytes[0] << 8) | randomBytes[1]) & 0xFFF;
    const randAHex = randAVal.toString(16).padStart(3, '0');

    let varByte = randomBytes[2];
    varByte = (varByte & 0x3F) | 0x80;
    const varHex = varByte.toString(16).padStart(2, '0');

    const buf = Buffer.alloc(7);
    crypto.randomFillSync(buf);
    const randBHex = buf.toString('hex');

    return `${tsHex.substring(0, 8)}-${tsHex.substring(8, 12)}-7${randAHex}-${varHex}${randBHex.substring(0, 2)}-${randBHex.substring(2, 14)}`;
}