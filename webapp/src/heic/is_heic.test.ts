// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {FileInfo} from '@mattermost/types/files';

import {isHeicFileInfo} from 'heic/is_heic';

function makeFileInfo(overrides: Partial<FileInfo>): FileInfo {
    return {
        id: 'file1',
        user_id: 'user1',
        channel_id: 'channel1',
        create_at: 0,
        update_at: 0,
        delete_at: 0,
        name: 'photo.heic',
        extension: 'heic',
        size: 1024,
        mime_type: 'image/heic',
        width: 100,
        height: 100,
        has_preview_image: false,
        clientId: 'client1',
        archived: false,
        ...overrides,
    };
}

describe('isHeicFileInfo', () => {
    test.each([
        ['heic', 'image/heic', true],
        ['HEIC', 'image/heic', true],
        ['heif', 'image/heif', true],
        ['hif', 'application/octet-stream', true],
        ['jpg', 'image/jpeg', false],
        ['png', 'image/png', false],
    ])('extension=%s mime=%s -> %s', (extension, mimeType, expected) => {
        const fileInfo = makeFileInfo({extension, mime_type: mimeType});
        expect(isHeicFileInfo(fileInfo)).toBe(expected);
    });

    test('matches by mime type when extension is unrelated', () => {
        const fileInfo = makeFileInfo({extension: '', mime_type: 'image/heic-sequence'});
        expect(isHeicFileInfo(fileInfo)).toBe(true);
    });

    test('is case-insensitive for mime type', () => {
        const fileInfo = makeFileInfo({extension: '', mime_type: 'IMAGE/HEIF'});
        expect(isHeicFileInfo(fileInfo)).toBe(true);
    });

    test('returns false when archived, even if extension matches', () => {
        const fileInfo = makeFileInfo({extension: 'heic', mime_type: 'image/heic', archived: true});
        expect(isHeicFileInfo(fileInfo)).toBe(false);
    });
});
