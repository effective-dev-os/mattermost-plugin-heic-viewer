// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// heic-to's own worker is blob:-URL based, which Mattermost's CSP blocks
// (script-src 'self', no worker-src, no blob:). This talks directly to a
// vendored copy of that same worker bundle served as a real same-origin
// static file instead. See webapp/vendor/heic-worker.js's header for the
// full investigation and provenance.
import manifest from 'manifest';

type DecodeRequest = {
    id: string;
    buffer: ArrayBuffer;
};

type DecodeResponse = {
    id: string;
    imageData: ImageData | null;
    error: string;
};

function resolveWorkerUrl(): string {
    const currentScriptSrc = (document.currentScript as HTMLScriptElement | null)?.src;
    if (currentScriptSrc) {
        return new URL('heic-worker.js', currentScriptSrc).toString();
    }
    return `${window.location.origin}/static/plugins/${manifest.id}/heic-worker.js`;
}

let worker: Worker | undefined;

function getWorker(): Worker {
    if (!worker) {
        worker = new Worker(resolveWorkerUrl());
    }
    return worker;
}

function decodeBuffer(buffer: ArrayBuffer): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const id = `${Math.random()}-${Date.now()}`;
        const activeWorker = getWorker();

        const cleanup = () => {
            activeWorker.removeEventListener('message', handleMessage);
            activeWorker.removeEventListener('error', handleError);
        };

        const handleMessage = (event: MessageEvent<DecodeResponse>) => {
            if (event.data.id !== id) {
                return;
            }
            cleanup();
            if (event.data.error) {
                reject(new Error(event.data.error));
                return;
            }
            if (!event.data.imageData) {
                reject(new Error('Worker returned no image data'));
                return;
            }
            resolve(event.data.imageData);
        };

        const handleError = (event: ErrorEvent) => {
            cleanup();
            reject(new Error(event.message));
        };

        activeWorker.addEventListener('message', handleMessage);
        activeWorker.addEventListener('error', handleError);

        const request: DecodeRequest = {id, buffer};
        activeWorker.postMessage(request);
    });
}

function encodeImageDataToJpeg(imageData: ImageData): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        throw new Error('Failed to get canvas 2d context');
    }
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            canvas.width = 1;
            canvas.height = 1;

            if (!blob) {
                reject(new Error('Failed to encode canvas to JPEG'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 0.9);
    });
}

export async function decodeHeicToObjectUrl(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const imageData = await decodeBuffer(buffer);
    const jpegBlob = await encodeImageDataToJpeg(imageData);
    return URL.createObjectURL(jpegBlob);
}
