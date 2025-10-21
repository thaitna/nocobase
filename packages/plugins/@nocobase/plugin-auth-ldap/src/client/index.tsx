/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, usePlugin } from '@nocobase/client';
import { PluginAuthClient as AuthPlugin } from '@nocobase/plugin-auth/client';
import { lazy } from '@nocobase/client';
import { Registry } from '@nocobase/utils/client';
import { ComponentType } from 'react';
import { NAMESPACE } from './locale';

const { Options, SignInForm } = lazy(() => import('./ldap'), 'Options', 'SignInForm');

export type AuthOptions = {
  components: Partial<{
    SignInForm: ComponentType<{ authenticator: any }>;
    AdminSettingsForm: ComponentType;
  }>;
};

export class PluginAuthLdapClient extends Plugin {
  async load() {
    const authPlugin = this.app.pm.get('auth') as AuthPlugin;

    if (authPlugin) {
      // Register our LDAP authenticator type
      authPlugin.registerType('ldap', {
        components: {
          SignInForm: SignInForm,
          AdminSettingsForm: Options,
        },
      });
    }
  }
}

export default PluginAuthLdapClient;
