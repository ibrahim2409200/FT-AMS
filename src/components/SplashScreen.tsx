import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { 
  Easing, 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSequence,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }: any) => {
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textScale = useSharedValue(0.5);
  const bottomBarWidth = useSharedValue(0);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    // Logo scale and rotate animation
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 800, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 300, easing: Easing.ease })
    );

    logoRotate.value = withTiming(360, { duration: 2000, easing: Easing.ease });

    // Text fade in and scale
    textOpacity.value = withTiming(1, { duration: 1200, easing: Easing.ease });
    textScale.value = withTiming(1, { duration: 1200, easing: Easing.ease });

    // Bottom bar animation
    bottomBarWidth.value = withTiming(width * 0.8, { duration: 2000, easing: Easing.ease });

    // Navigate after animation completes
    const timer = setTimeout(async () => {
      const isAuthenticated = await AsyncStorage.getItem('isAuthenticated');
      if (isAuthenticated === 'true') {
        navigation.replace('SideMenu');
      } else {
        navigation.replace('Login');
      }
    }, 3500); // 3.5 seconds

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigation]);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` }
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ scale: textScale.value }],
  }));

  const bottomBarStyle = useAnimatedStyle(() => ({
    width: bottomBarWidth.value,
  }));

  return (
    <LinearGradient
      colors={['#8686AC', '#272757']}
      locations={[0, 0.3]}
      style={styles.container}>
      <View style={styles.content}>
        <Animated.Image
          source={require('../../assets/images/logo12.png')}
          style={[styles.logo, logoStyle]}
          resizeMode="contain"
        />
        <Animated.Text style={[styles.mainText, textStyle]}>
          AMS
        </Animated.Text>
      </View>
      <Animated.View style={[styles.bottomBar, bottomBarStyle]} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: height * 0.1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: height * 0.03,
  },
  mainText: {
    fontSize: width * 0.15,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'LemonMilkRegular-X3XE2',
    textAlign: 'center',
    letterSpacing: 2,
  },
  bottomBar: {
    height: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    marginBottom: height * 0.05,
  },
});

export default SplashScreen;

