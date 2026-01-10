import React from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';


const LogoutPopUp: React.FC = () => {
  const dispatch = useDispatch();

  const showLogoutAlert = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You won’t be able to log in again without an internet connection.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => handleLogout(),
        },
      ],
      { cancelable: false }
    );
  };

  const handleLogout = async () => {
     await AsyncStorage.removeItem('user');
    dispatch(logout()); // Dispatch logout
};


  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={showLogoutAlert} style={styles.button}>
        <Icon name="logout" size={28} color="#0093dd" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});

export default LogoutPopUp;
