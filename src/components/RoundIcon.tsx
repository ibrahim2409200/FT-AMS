import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as ImagePicker from 'react-native-image-picker'; // Image picker import
import AsyncStorage from '@react-native-async-storage/async-storage'; // Async storage for local saving

interface RoundIconProps {}

const RoundIcon: React.FC<RoundIconProps> = () => {
  const [imageUri, setImageUri] = useState<string | null>(null); // State for the selected image
  const [isImageLoaded, setIsImageLoaded] = useState(false); // Tracks image load status
  const [isError, setIsError] = useState(false); // Tracks errors in loading image

  // Load saved image on component mount
  const loadSavedImage = async () => {
    try {
      const savedImage = await AsyncStorage.getItem('roundIconImage');
      if (savedImage) {
        setImageUri(savedImage);
      }
    } catch (error) {
      console.error('Error loading saved image:', error);
    }
  };

  // Open image picker
  const openImagePicker = async () => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 1,
      });

      if (result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri ?? null; // Ensure no undefined values
        setImageUri(selectedImageUri);

        if (selectedImageUri) {
          // Save image URI to local storage
          await AsyncStorage.setItem('roundIconImage', selectedImageUri);
        }
        setIsError(false);
      } else {
        Alert.alert('No image selected');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // Handle user click on round icon
  const handlePress = () => {
    Alert.alert(
      'Upload Image',
      'Do you want to upload a new image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: openImagePicker, // Open gallery if "Yes"
        },
      ],
      { cancelable: true }
    );
  };

  useEffect(() => {
    loadSavedImage();
  }, []);

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.container}>
        {!isImageLoaded && !isError && (
          <ActivityIndicator size="large" color="#008000" style={styles.spinner} />
        )}
        <Image
          source={
            !isError && imageUri
              ? { uri: imageUri }
              : require('../../assets/images/pic.png') // Fallback image
          }
          style={styles.image}
          resizeMode="cover"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => {
            setIsError(true);
            setIsImageLoaded(true);
          }}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '20%',
    marginLeft: '5%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  spinner: {
    position: 'absolute',
  },
});

export default RoundIcon;

