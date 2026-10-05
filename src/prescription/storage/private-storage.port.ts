import { Buffer } from 'node:buffer';

export const PRIVATE_STORAGE = Symbol('PRIVATE_STORAGE');

export type StoredPrivateFile = {
    storageKey: string;
    sizeBytes: number;
};

export interface PrivateStoragePort {
    put(input: {
        bytes: Buffer;
        extension: string;
    }): Promise<StoredPrivateFile>;
    read(storageKey: string): Promise<Buffer>;
    delete(storageKey: string): Promise<void>;
    createSignedToken(storageKey: string, expiresAt: number): string;
    verifySignedToken(token: string): {
        storageKey: string;
        expiresAt: number;
    };
}
