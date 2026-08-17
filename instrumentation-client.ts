/**
 * HeyCatch analytics — client entry point.
 *
 * Next.js 15.3+ loads this file once per page load, at module scope, before
 * the app renders. That is exactly what the SDK requires: init must run at
 * module scope, from a static import, never inside a component or handler.
 *
 * The project key is publishable and is inlined deliberately, per the install
 * guide — it is not a secret and must not be moved behind an env var.
 *
 * Do not add an `apiHost`; the SDK defaults are correct.
 */
import { analytics } from '@heycatch/sdk';

analytics.init({
  projectKey: 'hck_pk_kPaGXlTnw1beQQ-d8qqzFLi_uwrXvj5u',
  install: {
    framework: 'nextjs',
    frameworkVersion: '15',
    agent: 'claude-code',
  },
});
