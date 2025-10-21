/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthConfig, BaseAuth } from '@nocobase/auth';
import { namespace } from '../preset';
import { createClient, Filter } from 'ldapjs';

export class LdapAuth extends BaseAuth {
  constructor(config: AuthConfig) {
    const userCollection = config.ctx.db.getCollection('users');
    super({ ...config, userCollection });
  }

  get ldapOptions() {
    return this.authenticator.options as {
      url: string;
      baseDN: string;
      dnFormat?: string; // e.g., 'cn=%s,ou=users,dc=example,dc=com'
    };
  }

  async validate() {
    const { ctx } = this;
    const { url, baseDN, dnFormat } = this.ldapOptions;
    const {
      account, // This is now the simple username, e.g., 'admin'
      password,
    } = ctx.action.params.values || {};

    console.log('[LDAP Auth] Starting validation for user:', account);

    if (!account || !password) {
      ctx.throw(400, ctx.t('Please enter your username and password', { ns: namespace }));
    }

    if (!url || !baseDN) {
      ctx.throw(500, ctx.t('LDAP authenticator is not configured', { ns: namespace }));
    }

    // Sanitize username to prevent LDAP injection
    let dn: string;
    if (account.includes('=')) {
      // The user seems to have entered a full DN, so we use it directly
      dn = account;
    } else {
      // The user entered a simple username, so we construct the DN
      //const sanitizedAccount = this.escapeDNComponent(account);
      if (dnFormat) {
        dn = dnFormat.replace('%s', account);
      } else {
        // Fallback for old configurations or simple setups
        dn = `uid=${account},${baseDN}`;
      }
    }

    console.log('[LDAP Auth] Attempting to bind with DN:', dn);

    try {
      // Step 1: Bind to LDAP server
      await this.ldapBind(dn, password);

      console.log('[LDAP Auth] Bind successful. Finding or creating user in database.');

      // Step 2: Find or create user in NocoBase DB (JIT Provisioning)
      let user = await this.userRepository.findOne({
        filter: {
          // We search by username, which should be unique
          username: account,
        },
      });

      if (!user) {
        console.log('[LDAP Auth] User not found in DB. Creating new user:', account);
        // User is valid in LDAP but not in NocoBase, so create them.
        user = await this.userRepository.create({
          values: {
            username: account,
            nickname: account, // Use username as nickname by default
            // Set a random, unusable password
            password: Math.random().toString(),
            // Mark this user as an LDAP user if needed
            // meta: { authProvider: 'ldap' }
          },
        });
      }

      return user;
    } catch (error) {
      // LDAP error
      this.ctx.logger.warn(`LDAP auth failed for user "${account}" with DN "${dn}"`, error.message);
      ctx.throw(401, ctx.t('The username or password is incorrect', { ns: namespace }));
    }
  }

  private ldapBind(dn: string, secret: string): Promise<void> {
    const { url } = this.ldapOptions;

    return new Promise((resolve, reject) => {
      const client = createClient({ url });

      client.on('error', (err) => {
        console.error('[LDAP Auth] LDAP client error:', err);
        this.ctx.logger.error('LDAP client error', err);
        client.unbind();
        reject(err);
      });

      client.bind(dn, secret, (err) => {
        client.unbind();
        if (err) {
          console.error('[LDAP Auth] Bind failed:', err.message);
          // Do not log the full error here as it might contain sensitive info
          return reject(err);
        }
        console.log('[LDAP Auth] Connection to LDAP server successful.');
        this.ctx.logger.info(`LDAP bind successful for DN: ${dn}`);
        return resolve();
      });
    });
  }

  private escapeDNComponent(str: string): string {
    if (!str) {
      return '';
    }
    let escaped = '';
    // Escape special characters as per RFC 4514
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      switch (char) {
        case ',':
        case '+':
        case '"':
        case '\\':
        case '<':
        case '>':
        case ';':
          escaped += '\\' + char;
          break;
        default:
          escaped += char;
          break;
      }
    }
    // Handle leading/trailing spaces and leading '#'
    if (escaped.length > 0) {
      if (escaped[0] === ' ' || escaped[0] === '#') {
        escaped = '\\' + escaped;
      }
      if (escaped.length > 1 && escaped[escaped.length - 1] === ' ') {
        escaped = escaped.substring(0, escaped.length - 1) + '\\ ';
      }
    }
    return escaped;
  }
}
