// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type * as CacheModule from 'heic/cache';

let cache: typeof CacheModule;
let revokeObjectURL: jest.Mock;

beforeEach(() => {
    jest.resetModules();

    // The module-scoped cache is a singleton keyed by import, so each test
    // needs a fresh module instance to avoid state leaking across tests.
    // Node/jsdom don't reliably implement URL.revokeObjectURL, so stub it
    // directly rather than assuming jsdom's behavior.
    revokeObjectURL = jest.fn();
    (global.URL as unknown as {revokeObjectURL: jest.Mock}).revokeObjectURL = revokeObjectURL;

    // eslint-disable-next-line global-require
    cache = require('heic/cache');
});

describe('heic object URL cache', () => {
    test('returns undefined for an uncached file id', () => {
        expect(cache.getCachedObjectUrl('missing')).toBeUndefined();
    });

    test('returns a previously cached object URL', () => {
        cache.setCachedObjectUrl('file1', 'blob:file1');
        expect(cache.getCachedObjectUrl('file1')).toBe('blob:file1');
    });

    test('revokes the previous object URL when overwriting the same file id', () => {
        cache.setCachedObjectUrl('file1', 'blob:file1-a');
        cache.setCachedObjectUrl('file1', 'blob:file1-b');

        expect(revokeObjectURL).toHaveBeenCalledWith('blob:file1-a');
        expect(cache.getCachedObjectUrl('file1')).toBe('blob:file1-b');
    });

    test('evicts the least-recently-used entry once the cache exceeds its bound', () => {
        for (let i = 0; i < 21; i++) {
            cache.setCachedObjectUrl(`file${i}`, `blob:file${i}`);
        }

        expect(revokeObjectURL).toHaveBeenCalledWith('blob:file0');
        expect(cache.getCachedObjectUrl('file0')).toBeUndefined();
        expect(cache.getCachedObjectUrl('file20')).toBe('blob:file20');
    });

    test('accessing an entry marks it as most-recently-used, protecting it from eviction', () => {
        for (let i = 0; i < 20; i++) {
            cache.setCachedObjectUrl(`file${i}`, `blob:file${i}`);
        }

        // Touch file0 so it becomes most-recently-used.
        cache.getCachedObjectUrl('file0');

        // Adding one more entry should now evict file1 (the new LRU), not file0.
        cache.setCachedObjectUrl('file20', 'blob:file20');

        expect(cache.getCachedObjectUrl('file0')).toBe('blob:file0');
        expect(cache.getCachedObjectUrl('file1')).toBeUndefined();
    });
});
