import React from 'react';
import {View, Text, ActivityIndicator, StyleSheet} from 'react-native';

const Spinner: React.FC<{message: string}> = ({message}) => {
  return (
    <View style={styles.spinnerContainer}>
      <ActivityIndicator size="large" color="#0093dd" />
      <Text style={styles.spinnerText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  spinnerText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#0093dd',
  },
});

export default Spinner;
