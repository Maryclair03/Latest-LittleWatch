import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  FlatList,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    image: require('../assets/onboarding1.jpg'),
    title: 'Let’s get started!',
    description: 'Let’s make sure your little one stays safe, happy, and connected.',
  },
  {
    id: '2',
    image: require('../assets/onboarding2.jpg'),
    title: 'Monitor Your Little One',
    description: 'Keep track of your child\'s wellbeing with real-time updates and notifications.',
  },
  {
    id: '3',
    image: require('../assets/onboarding3.png'),
    title: 'Stay Connected Always',
    description: 'Peace of mind knowing your child is safe with our comprehensive monitoring and alert system.',
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentIndex(index);
  };

  // Auto slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % onboardingData.length;
      setCurrentIndex(nextIndex);

      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000); // change every 3 seconds

    return () => clearInterval(interval);
  }, [currentIndex]);

  const currentItem = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#E6F7FF" />

      {/* Logo in top right */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/Splash.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Onboarding Image Carousel */}
      <View style={styles.imageSection}>
        <FlatList
          ref={flatListRef}
          data={onboardingData}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image
                source={item.image}
                style={styles.onboardingImage}
                resizeMode="cover"
              />
            </View>
          )}
        />
      </View>

      {/* Content Section */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{currentItem.title}</Text>
        <Text style={styles.description}>{currentItem.description}</Text>

        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentIndex === index && styles.activeDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.signUpText}>Sign up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E6F7FF',
  },
  logoContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    right: 2,
    zIndex: 10,
  },
  logo: {
    width: 200,
    height: 150,
  },
  imageSection: {
    height: height * 0.55,
    width: width,
  },
  slide: {
    width: width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  onboardingImage: {
    width: width - 32,
    height: '90%',
    borderRadius: 24,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 10 : 20,
  },
  title: {
    fontSize: Math.min(width * 0.055, 24),
    fontWeight: '600',
    color: '#0091EA',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  description: {
    fontSize: Math.min(width * 0.037, 15),
    color: '#757575',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
    flex: 1,
    marginTop: 12,
  },
  pagination: {
    flexDirection: 'row',
    marginVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B3E5FC',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#0091EA',
    width: 24,
  },
  buttonContainer: {
    width: '100%',
  },
  signUpButton: {
    backgroundColor: '#0091EA',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#0091EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#B3E5FC',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 8,
  },
  loginText: {
    color: '#0091EA',
    fontSize: 16,
    fontWeight: '600',
  },
});
