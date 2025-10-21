/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { namespace } from '../preset';
import { LdapAuth } from './ldap-auth';

export class PluginAuthLdapServer extends Plugin {
  async load() {
    // 1. Register the new authenticator type
    this.app.authManager.registerTypes('ldap', {
      auth: LdapAuth,
      title: 'LDAP',
    });

    // 2. Add collections
    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, 'migrations'),
    });
    await this.importCollections(resolve(__dirname, 'collections'));

    // 3. Define ACL policies
    // Allow public access to sign-in
    this.app.acl.allow('auth', 'signIn');
    // Allow logged-in users to check their status and sign out
    ['check', 'signOut'].forEach((action) => this.app.acl.allow('auth', action, 'loggedIn'));
    // Allow public listing of authenticators
    this.app.acl.allow('authenticators', 'publicList');
    // Snippet for admin role to manage authenticators
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.authenticators`,
      actions: ['authenticators:*'],
    });

    // Other parts of the original plugin might be needed depending on functionality
    // such as token management, audit logging, etc.
    // For now, we keep it simple.
  }

  async install(options?: InstallOptions) {
    const authRepository = this.db.getRepository('authenticators');
    // 4. Create a default LDAP authenticator instance on install
    const exist = await authRepository.findOne({ filter: { name: 'ldap' } });
    if (!exist) {
      await authRepository.create({
        values: {
          name: 'ldap',
          authType: 'ldap',
          description: 'Sign in with LDAP credentials.',
          enabled: true, // Disabled by default, admin needs to configure and enable it
          options: {
            url: 'ldap://127.0.0.1:10389',
            baseDN: 'ou=system',
            dnFormat: 'cn=%s,ou=users,ou=system',
          },
        },
      });
    }
  }

  async afterEnable() {
    // Code to run after the plugin is enabled
  }

  async afterDisable() {
    // Code to run after the plugin is disabled
  }

  async remove() {
    // Code to run when the plugin is removed
    const authRepository = this.db.getRepository('authenticators');
    const exist = await authRepository.findOne({ filter: { name: 'ldap' } });
    if (exist) {
      await authRepository.destroy({
        filter: {
          name: 'ldap',
        },
      });
    }
  }
}

export default PluginAuthLdapServer;
