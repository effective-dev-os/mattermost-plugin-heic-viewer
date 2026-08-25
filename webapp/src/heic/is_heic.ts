// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import type {FileInfo} from '@mattermost/types/files';

const HEIC_EXTENSIONS = new Set(['heic', 'heif', 'hif']);

// mime_type is unreliable for .heic/.heif (no entry in Go's builtin MIME
// table, depends on the host OS's /etc/mime.types), so extension is the
// primary signal and mime is only a fallback.
const HEIC_MIME_TYPES = new Set([
    'image/heic',
    'image/heif',
    'image/heic-sequence',
    'image/heif-sequence',
]);

export function isHeicFileInfo(fileInfo: FileInfo): boolean {
    if (fileInfo.archived) {
        return false;
    }

    if (HEIC_EXTENSIONS.has(fileInfo.extension.toLowerCase())) {
        return true;
    }

    return HEIC_MIME_TYPES.has(fileInfo.mime_type.toLowerCase());
}
