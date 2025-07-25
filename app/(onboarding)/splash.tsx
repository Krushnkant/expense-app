import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp, Shield } from 'lucide-react-native';
import { router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Keep the native splash screen visible while we prepare our custom splash
SplashScreen.preventAutoHideAsync();

export default function Splash() {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(30);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const backgroundOpacity = useSharedValue(0);
  const progressWidth = useSharedValue(0);

  const navigateToWelcome = () => {
    router.replace('/(onboarding)/welcome');
  };

  useEffect(() => {
    // Hide the native splash screen once our component is ready
    const hideSplash = async () => {
      await SplashScreen.hideAsync();
    };
    hideSplash();

    // Start the animation sequence
    const startAnimation = () => {
      // Background fade in
      backgroundOpacity.value = withTiming(1, { duration: 800 });

      // Logo animation
      logoScale.value = withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
        withTiming(1, { duration: 200 })
      );
      logoOpacity.value = withTiming(1, { duration: 600 });

      // Icon rotation and scale
      iconRotation.value = withTiming(360, { duration: 1000, easing: Easing.out(Easing.cubic) });
      iconScale.value = withDelay(300, withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }));

      // Title animation
      titleOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
      titleTranslateY.value = withDelay(400, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

      // Subtitle animation
      subtitleOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
      subtitleTranslateY.value = withDelay(600, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));

      // Progress bar animation
      progressWidth.value = withDelay(800, withTiming(100, { 
        duration: 1500, 
        easing: Easing.out(Easing.cubic) 
      }));

      // Navigate after all animations
      setTimeout(() => {
        runOnJS(navigateToWelcome)();
      }, 3000);
    };

    // Small delay to ensure component is mounted
    setTimeout(startAnimation, 100);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const subtitleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleTranslateY.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` }
    ],
  }));

  const backgroundAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  const sparkleAnimatedStyle = useAnimatedStyle(() => {
    const sparkleRotation = interpolate(
      iconRotation.value,
      [0, 360],
      [0, -180]
    );
    return {
      transform: [
        { scale: iconScale.value },
        { rotate: `${sparkleRotation}deg` }
      ],
      opacity: iconScale.value,
    };
  });

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.backgroundContainer, backgroundAnimatedStyle]}>
        <LinearGradient
          colors={['#4facfe', '#00f2fe']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Floating Elements */}
      <View style={styles.floatingElements}>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon1, sparkleAnimatedStyle]}>
          <Sparkles size={24} color="rgba(255, 255, 255, 0.3)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon2, sparkleAnimatedStyle]}>
          <TrendingUp size={20} color="rgba(255, 255, 255, 0.2)" />
        </Animated.View>
        <Animated.View style={[styles.floatingIcon, styles.floatingIcon3, sparkleAnimatedStyle]}>
          <Shield size={18} color="rgba(255, 255, 255, 0.25)" />
        </Animated.View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <View style={styles.logoBackground}>
            <Animated.View style={[styles.logoIcon, iconAnimatedStyle]}>
              <Sparkles size={48} color="#FFFFFF" />
            </Animated.View>
          </View>
          <View style={styles.logoRing} />
          <View style={styles.logoRingOuter} />
        </Animated.View>

        {/* Title */}
        <Animated.View style={titleAnimatedStyle}>
          <Text style={styles.title}>ExpenseTracker</Text>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View style={subtitleAnimatedStyle}>
          <Text style={styles.subtitle}>
            Smart financial management{'\n'}for modern families
          </Text>
        </Animated.View>

        {/* Loading Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, progressAnimatedStyle]} />
          </View>
          <Text style={styles.loadingText}>Loading your experience...</Text>
        </View>
      </View>

      {/* Bottom Branding */}
      <View style={styles.bottomBranding}>
        <Text style={styles.brandingText}>Powered by React Native & Expo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4facfe',
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    flex: 1,
  },
  floatingElements: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
  },
  floatingIcon: {
    position: 'absolute',
  },
  floatingIcon1: {
    top: screenHeight * 0.15,
    right: screenWidth * 0.1,
  },
  floatingIcon2: {
    top: screenHeight * 0.25,
    left: screenWidth * 0.08,
  },
  floatingIcon3: {
    bottom: screenHeight * 0.3,
    right: screenWidth * 0.15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
    position: 'relative',
  },
  logoBackground: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  logoIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoRingOuter: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
    marginBottom: 60,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomBranding: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  brandingText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
});