// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

const MAX_ENTRIES = 20;

// Map preserves insertion order; re-inserting a key on access moves it to
// the end, giving us LRU ordering for free without a separate structure.
const objectUrlsByFileId = new Map<string, string>();

export function getCachedObjectUrl(fileId: string): string | undefined {
    const objectUrl = objectUrlsByFileId.get(fileId);
    if (objectUrl === undefined) {
        return undefined;
    }

    objectUrlsByFileId.delete(fileId);
    objectUrlsByFileId.set(fileId, objectUrl);
    return objectUrl;
}

export function setCachedObjectUrl(fileId: string, objectUrl: string): void {
    const existing = objectUrlsByFileId.get(fileId);
    if (existing !== undefined) {
        URL.revokeObjectURL(existing);
    }

    objectUrlsByFileId.delete(fileId);
    objectUrlsByFileId.set(fileId, objectUrl);

    while (objectUrlsByFileId.size > MAX_ENTRIES) {
        const oldestFileId = objectUrlsByFileId.keys().next().value;
        if (oldestFileId === undefined) {
            break;
        }
        const oldestObjectUrl = objectUrlsByFileId.get(oldestFileId);
        objectUrlsByFileId.delete(oldestFileId);
        if (oldestObjectUrl !== undefined) {
            URL.revokeObjectURL(oldestObjectUrl);
        }
    }
}
