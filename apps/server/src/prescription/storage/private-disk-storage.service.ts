import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, resolve } from 'node:path';

import type {
    PrivateStoragePort,
    StoredPrivateFile,
} from './private-storage.port.js';

@Injectable()
export class PrivateDiskStorageService implements PrivateStoragePort {
    private readonly root = resolve(
        process.env.SHAFAQ_PRIVATE_STORAGE_PATH ?? './storage/private',
    );

    private getSecret() {
        const secret = process.env.SHAFAQ_STORAGE_SIGNING_SECRET;
        if (!secret) {
            throw new InternalServerErrorException(
                'Private storage signing secret is not configured',
            );
        }
        return secret;
    }

    async put(input: {
        bytes: Buffer;
        extension: string;
    }): Promise<StoredPrivateFile> {
        const extension = extname(input.extension).toLowerCase();
        const storageKey = randomUUID() + extension;
        const absolutePath = this.resolveSafe(storageKey);

        await mkdir(dirname(absolutePath), { recursive: true });
        await writeFile(absolutePath, input.bytes, { flag: 'wx' });

        return {
            storageKey,
            sizeBytes: input.bytes.byteLength,
        };
    }

    async read(storageKey: string) {
        return readFile(this.resolveSafe(storageKey));
    }

    async delete(storageKey: string) {
        try {
            await unlink(this.resolveSafe(storageKey));
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                throw error;
            }
        }
    }

    createSignedToken(storageKey: string, expiresAt: number) {
        const payload = Buffer.from(
            JSON.stringify({ storageKey, expiresAt }),
        ).toString('base64url');
        const signature = createHmac(
            'sha256',
            this.getSecret(),
        )
            .update(payload)
            .digest('base64url');

        return payload + '.' + signature;
    }

    verifySignedToken(token: string) {
        const [payload, signature] = token.split('.');
        if (!payload || !signature) {
            throw new BadRequestException('Invalid signed file URL');
        }

        const expected = createHmac(
            'sha256',
            this.getSecret(),
        )
            .update(payload)
            .digest('base64url');

        const actualBuffer = Buffer.from(signature);
        const expectedBuffer = Buffer.from(expected);

        if (
            actualBuffer.length !== expectedBuffer.length ||
            !timingSafeEqual(actualBuffer, expectedBuffer)
        ) {
            throw new BadRequestException('Invalid signed file URL');
        }

        let parsed: {
            storageKey?: unknown;
            expiresAt?: unknown;
        };

        try {
            parsed = JSON.parse(
                Buffer.from(payload, 'base64url').toString('utf8'),
            );
        } catch {
            throw new BadRequestException('Invalid signed file URL');
        }

        if (
            typeof parsed.storageKey !== 'string' ||
            typeof parsed.expiresAt !== 'number' ||
            !Number.isSafeInteger(parsed.expiresAt) ||
            parsed.expiresAt <= Date.now()
        ) {
            throw new BadRequestException('Signed file URL has expired');
        }

        this.resolveSafe(parsed.storageKey);

        return {
            storageKey: parsed.storageKey,
            expiresAt: parsed.expiresAt,
        };
    }

    private resolveSafe(storageKey: string) {
        if (!storageKey || isAbsolute(storageKey)) {
            throw new BadRequestException('Invalid private storage key');
        }

        const absolutePath = resolve(join(this.root, storageKey));
        const rootWithSeparator = this.root.endsWith('/') ||
            this.root.endsWith('\\')
            ? this.root
            : this.root + '/';

        if (
            absolutePath !== this.root &&
            !absolutePath.startsWith(rootWithSeparator) &&
            !absolutePath.startsWith(this.root + '\\')
        ) {
            throw new BadRequestException('Invalid private storage key');
        }

        return absolutePath;
    }
}
