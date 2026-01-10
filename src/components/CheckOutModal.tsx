import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import moment from 'moment';

interface CheckOutModalProps {
  onSubmit: (time: string, reason: string) => void;
  onClose: () => void;
}

const CheckOutModal: React.FC<CheckOutModalProps> = ({ onSubmit, onClose }) => {
  const [time, setTime] = useState<string>(moment().format('YYYY-MM-DD HH:mm'));
  const [reason, setReason] = useState<string>("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const handleSubmit = () => {
    if (!reason.trim()) {
      
      Alert.alert("Alert","Please provide a reason!");
      return;
    }
    onSubmit(time, reason);
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date: Date) => {
    const formattedTime = moment(date).format('YYYY-MM-DD HH:mm');
    setTime(formattedTime);
    hideDatePicker();
  };

  return (
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <Text style={styles.heading}>Missed to Checkout</Text>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Shift End Time:</Text>
          <TouchableOpacity style={styles.inputTouchable} onPress={showDatePicker}>
            <Text style={styles.inputText}>{time}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Reason:</Text>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Enter your reason"
            placeholderTextColor='black'
          />
        </View>
        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 8,
    width: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    textAlign: 'center',
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  formGroup: {
    marginBottom: 15,
    textAlign: 'left',
  },
  label: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputTouchable: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor:'#ccc',
    borderRadius: 4,
    padding: 8,
  },
  inputText: {
    fontSize: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    color:'black',
    backgroundColor:'#ccc',
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 8,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: '#2ac3aa',
  },
  closeBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default CheckOutModal;
