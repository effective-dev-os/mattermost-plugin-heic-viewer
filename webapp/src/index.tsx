// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import manifest from 'manifest';
import type {Store} from 'redux';

import type {GlobalState} from '@mattermost/types/store';

import {HeicFilePreview} from 'components/heic_file_preview';
import {isHeicFileInfo} from 'heic/is_heic';
import type {PluginRegistry} from 'types/mattermost-webapp';

export default class Plugin {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async initialize(registry: PluginRegistry, store: Store<GlobalState>) {
        registry.registerFilePreviewComponent(
            (fileInfo) => isHeicFileInfo(fileInfo),
            HeicFilePreview,
        );
    }
}

declare global {
    interface Window {
        registerPlugin(pluginId: string, plugin: Plugin): void;
    }
}

window.registerPlugin(manifest.id, new Plugin());
