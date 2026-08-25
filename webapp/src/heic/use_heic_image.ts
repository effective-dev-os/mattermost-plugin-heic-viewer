// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {useEffect, useState} from 'react';

import type {FileInfo} from '@mattermost/types/files';

import {getCachedObjectUrl, setCachedObjectUrl} from 'heic/cache';
import {decodeHeicToObjectUrl} from 'heic/decode';

export type HeicImageState =
    | {status: 'loading'}
    | {status: 'ready'; objectUrl: string}
    | {status: 'failed'; error: string};

export function useHeicImage(fileInfo: FileInfo): HeicImageState {
    const [state, setState] = useState<HeicImageState>(() => {
        const cachedObjectUrl = getCachedObjectUrl(fileInfo.id);
        return cachedObjectUrl === undefined ? {status: 'loading'} : {status: 'ready', objectUrl: cachedObjectUrl};
    });

    useEffect(() => {
        let cancelled = false;

        const cachedObjectUrl = getCachedObjectUrl(fileInfo.id);
        if (cachedObjectUrl !== undefined) {
            setState({status: 'ready', objectUrl: cachedObjectUrl});
            return () => {
                cancelled = true;
            };
        }

        setState({status: 'loading'});

        (async () => {
            try {
                const response = await fetch(`/api/v4/files/${fileInfo.id}`, {credentials: 'same-origin'});
                if (!response.ok) {
                    throw new Error(`Failed to fetch file (status ${response.status})`);
                }
                const blob = await response.blob();
                const objectUrl = await decodeHeicToObjectUrl(blob);

                if (cancelled) {
                    URL.revokeObjectURL(objectUrl);
                    return;
                }

                setCachedObjectUrl(fileInfo.id, objectUrl);
                setState({status: 'ready', objectUrl});
            } catch (err) {
                if (!cancelled) {
                    setState({status: 'failed', error: err instanceof Error ? err.message : 'Unknown error'});
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [fileInfo.id]);

    return state;
}
