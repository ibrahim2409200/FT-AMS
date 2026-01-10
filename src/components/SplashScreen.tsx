import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { Easing, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(50); // Starting position
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    // Animate logo
    logoOpacity.value = withTiming(1, { duration: 2000, easing: Easing.ease });
    logoY.value = withTiming(0, { duration: 2000, easing: Easing.ease });

    // Navigate after animation completes
    const timer = setTimeout(async () => {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      if (isAuthenticated === 'true') {
        navigation.replace('SideMenu');
      } else {
        navigation.replace('Login');
      }
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require('../../assets/images/logo.png')}
        style={[styles.logo, logoStyle]}
        resizeMode="contain"
      />
      <Animated.Text style={[styles.mainText, textStyle]}>
        ATTENDANCE{"\n"}APP
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0589d2',
  },
  logo: {
    width: width * 0.5, // 50% of screen width
    height: width * 0.5, // Maintain square aspect ratio
    
  },
  mainText: {
    fontSize: width * 0.1, // 10% of screen width
    fontWeight: '200',
    color: '#fff',
    fontFamily: 'LemonMilkRegular-X3XE2',
    textAlign: 'center',
    marginTop: height * 0.05, // 5% of screen height
    paddingHorizontal: '5%', // Add padding for smaller screens
  },
});

export default SplashScreen;
