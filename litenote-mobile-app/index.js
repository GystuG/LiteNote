/**
 * @format
 */

import * as Sentry from '@sentry/react-native';
import Config from 'react-native-config';

const sentryDsn = Config.SENTRY_DSN?.trim();

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: __DEV__ ? 'development' : 'production',
    tracesSampleRate: 1.0,
    enableAutoSessionTracking: true,
    debug: __DEV__,
  });
}

if (__DEV__) {
  require('./ReactotronConfig');
}

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
