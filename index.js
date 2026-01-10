/**
 * @format
 */
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import BackgroundFetch from 'react-native-background-fetch';
import { backgroundFetchHandler } from './src/utils/backgroundTask'; // ya ./utils/backgroundTask if that's your path

AppRegistry.registerComponent(appName, () => App);

// ✅ Register headless task for Android
BackgroundFetch.registerHeadlessTask(backgroundFetchHandler);
