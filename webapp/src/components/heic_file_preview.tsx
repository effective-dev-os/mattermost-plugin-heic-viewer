// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React from 'react';

import type {FileInfo} from '@mattermost/types/files';
import type {Post} from '@mattermost/types/posts';

import {useHeicImage} from 'heic/use_heic_image';

const TEXT_COLOR = 'rgba(255, 255, 255, 0.88)';

type HeicFilePreviewProps = {
    fileInfo: FileInfo;
    post?: Post;
    onModalDismissed: () => void;
};

function HeicFallback({fileInfo, reason}: {fileInfo: FileInfo; reason?: string}) {
    return (
        <div style={{padding: '20px', textAlign: 'center', color: TEXT_COLOR}}>
            {reason && <p>{reason}</p>}
            <p>{fileInfo.name}</p>
            <a
                href={`/api/v4/files/${fileInfo.id}?download=1`}
                download={fileInfo.name}
            >
                {'Download'}
            </a>
        </div>
    );
}

function HeicImage({fileInfo}: {fileInfo: FileInfo}) {
    const heicImage = useHeicImage(fileInfo);

    if (heicImage.status === 'loading') {
        return (
            <div
                role='status'
                aria-live='polite'
                style={{padding: '20px', textAlign: 'center', color: TEXT_COLOR}}
            >
                {'Decoding HEIC image…'}
            </div>
        );
    }

    if (heicImage.status === 'failed') {
        // eslint-disable-next-line no-console
        console.error('HEIC preview failed to decode:', heicImage.error);
        return (
            <HeicFallback
                fileInfo={fileInfo}
                reason={'This HEIC image could not be displayed.'}
            />
        );
    }

    return (
        <img
            src={heicImage.objectUrl}
            alt={fileInfo.name}
            style={{maxWidth: '100%', maxHeight: 'calc(100vh - 168px)'}}
        />
    );
}

type HeicFilePreviewState = {
    hasError: boolean;
};

// React error boundaries only work as class components (no hook
// equivalent) — a decode exception here must never crash Mattermost's
// post-render tree.
export class HeicFilePreview extends React.Component<HeicFilePreviewProps, HeicFilePreviewState> {
    constructor(props: HeicFilePreviewProps) {
        super(props);
        this.state = {hasError: false};
    }

    static getDerivedStateFromError(): HeicFilePreviewState {
        return {hasError: true};
    }

    componentDidUpdate(prevProps: HeicFilePreviewProps) {
        if (prevProps.fileInfo.id !== this.props.fileInfo.id && this.state.hasError) {
            this.setState({hasError: false});
        }
    }

    render() {
        if (this.state.hasError) {
            return <HeicFallback fileInfo={this.props.fileInfo}/>;
        }

        return (
            <HeicImage
                key={this.props.fileInfo.id}
                fileInfo={this.props.fileInfo}
            />
        );
    }
}
