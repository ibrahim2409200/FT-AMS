import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import SplashScreen from '../components/SplashScreen';
import {LoginScreen, DashboardScreen, SignupScreen} from '../screens';
import {RootState} from '../redux/store';
import {loggedIn} from '../redux/slices/authSlice';
import SideMenu from '../components/SideMenu';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Dashboard: undefined;
  SideMenu: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const dispatch = useDispatch();
  const [initialRoute, setInitialRoute] =
    useState<keyof RootStackParamList>('Splash');

  useEffect(() => {
    const checkLoginState = async () => {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      const userString = await AsyncStorage.getItem('user');
      let user;
      if (userString) {
        user = JSON.parse(userString);
      }
      if (isAuthenticated === 'true' && user) {
        dispatch(loggedIn(user));
      } else {
        setInitialRoute('Login');
      }
    };

    checkLoginState();
  }, [isAuthenticated]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute}>
        <Stack.Screen
          name="Splash"
          component={SplashScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="SignUp"
          component={SignupScreen}
          options={{headerShown: false}}
        />
        {/* <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} /> */}
        <Stack.Screen
          name="SideMenu"
          component={SideMenu}
          options={{headerShown: false}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
export default AppNavigator;