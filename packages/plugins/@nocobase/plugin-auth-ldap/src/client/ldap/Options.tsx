/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponent } from '@nocobase/client';
import React from 'react';
import { useAuthTranslation } from '../locale';

const schema = {
  type: 'object',
  properties: {
    notice: {
      type: 'void',
      'x-decorator': 'FormItem',
      'x-component': 'Alert',
      'x-component-props': {
        showIcon: true,
        message: '{{t("LDAP authentication allows users to sign in via an LDAP directory.")}}',
      },
    },
    url: {
      type: 'string',
      title: '{{t("LDAP server URL")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'ldap://your-ldap-server:389',
      },
      required: true,
    },
    baseDN: {
      type: 'string',
      title: '{{t("Base DN")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'ou=users,ou=system',
      },
      required: true,
      description: '{{t("The base distinguished name to search for users. Used when DN format is not provided.")}}',
    },
    dnFormat: {
      type: 'string',
      title: '{{t("DN format")}}',
      'x-decorator': 'FormItem',
      'x-component': 'Input',
      'x-component-props': {
        placeholder: 'cn=%s,ou=users,dc=example,dc=com',
      },
      description:
        '{{t("Optional. A format string to construct the user\'s DN. Use `%s` as a placeholder for the username. If provided, this will be used instead of the default `uid=<username>,<baseDN>` format.")}}',
    },
  },
};

export const Options = () => {
  const { t } = useAuthTranslation();

  return <SchemaComponent scope={{ t }} schema={schema} />;
};
