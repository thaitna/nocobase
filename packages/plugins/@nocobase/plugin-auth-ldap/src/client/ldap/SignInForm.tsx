/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/react';
import { SchemaComponent, useAPIClient, useCurrentUserContext } from '@nocobase/client';
import React, { useCallback } from 'react';
import { useAuthTranslation } from '../locale';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from '@formily/react';
import { Authenticator } from '@nocobase/plugin-auth/client';

export function useRedirect(next = '/admin') {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return useCallback(() => {
    navigate(searchParams.get('redirect') || '/admin', { replace: true });
  }, [navigate, searchParams]);
}

export const useSignIn = (authenticator: string) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  const { refreshAsync } = useCurrentUserContext();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      await refreshAsync();
      redirect();
    },
  };
};

const getPasswordForm = (): ISchema => ({
  type: 'object',
  name: 'passwordForm',
  'x-component': 'FormV2',
  properties: {
    account: {
      type: 'string',
      required: true,
      'x-component': 'Input',
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Username")}}' },
    },
    password: {
      type: 'string',
      'x-component': 'Password',
      required: true,
      'x-decorator': 'FormItem',
      'x-component-props': { placeholder: '{{t("Password")}}' },
    },
    actions: {
      type: 'void',
      'x-component': 'div',
      properties: {
        submit: {
          title: '{{t("Sign in")}}',
          type: 'void',
          'x-component': 'Action',
          'x-component-props': {
            htmlType: 'submit',
            block: true,
            type: 'primary',
            useAction: `{{ useLdapSignIn }}`,
            style: { width: '100%' },
          },
        },
      },
    },
  },
});
export const SignInForm = (props: { authenticator: Authenticator }) => {
  const { t } = useAuthTranslation();
  const authenticator = props.authenticator;
  const { name } = authenticator;

  const useLdapSignIn = () => {
    return useSignIn(name);
  };
  return <SchemaComponent schema={getPasswordForm()} scope={{ useLdapSignIn, t, authenticator }} />;
};
