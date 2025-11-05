import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constant';
import { Picker } from '@react-native-picker/picker';

const SignupScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    birthDate: new Date(),
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  const handleChange = (name, value) => setFormData({ ...formData, [name]: value });

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setFormData({ ...formData, birthDate: selectedDate });
  };

  const handleSendOTP = async () => {
    if (!formData.email.trim()) return Alert.alert('Error', 'Enter your email first');
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/send-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email.trim() }),
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('OTP Sent', `Check your email (${formData.email}) for the OTP.`);
        setOtpSent(true);
      } else {
        Alert.alert('Error', data.error || 'Failed to send OTP.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) return Alert.alert('Error', 'Enter the OTP');
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/verify-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          otp: otpCode.trim(),
        }),
      });
      const data = await response.json();
      console.log('OTP verify response:', data);
      if (response.ok && data.message.toLowerCase().includes('otp verified')) {
        Alert.alert('Success', 'OTP verified successfully!');
        setIsOtpVerified(true);
      } else {
        Alert.alert('Error', data.error || 'Invalid OTP.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.username.trim()) return Alert.alert('Validation Error', 'Username is required');
    if (!formData.email.trim()) return Alert.alert('Validation Error', 'Email is required');
    if (!formData.password) return Alert.alert('Validation Error', 'Password is required');
    if (formData.password.length < 6) return Alert.alert('Validation Error', 'Password must be at least 6 characters');
    if (!formData.firstName.trim()) return Alert.alert('Validation Error', 'First name is required');
    if (!formData.lastName.trim()) return Alert.alert('Validation Error', 'Last name is required');
    if (!isOtpVerified) return Alert.alert('Error', 'Please verify your OTP first');
    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/signup/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          address: formData.address.trim(),
          phone_number: formData.phoneNumber.trim(),
          birth_date: formData.birthDate.toISOString().split('T')[0],
        }),
      });
      const data = await response.json();
      console.log('Signup response:', data);
      if (response.ok) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        Alert.alert('Success', 'Account created successfully!', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      } else {
        Alert.alert('Signup failed', data.message || 'Please try again');
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Error', 'Failed to connect to server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formBox}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput
            placeholder="Username"
            value={formData.username}
            onChangeText={(text) => handleChange('username', text)}
            style={styles.input}
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleChange('email', text)}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          {!otpSent ? (
            <TouchableOpacity style={styles.sendOtpButton} onPress={handleSendOTP}>
              <Text style={styles.buttonText}>Send OTP</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TextInput
                placeholder="Enter OTP"
                value={otpCode}
                onChangeText={setOtpCode}
                keyboardType="numeric"
                style={styles.input}
              />
              <TouchableOpacity style={styles.verifyOtpButton} onPress={handleVerifyOTP}>
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>
            </>
          )}

          <TextInput
            placeholder="Password"
            value={formData.password}
            onChangeText={(text) => handleChange('password', text)}
            style={styles.input}
            secureTextEntry
          />

          <TextInput
            placeholder="First Name"
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
            style={styles.input}
          />

          <TextInput
            placeholder="Last Name"
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            style={styles.input}
          />

          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.address}
              onValueChange={(value) => handleChange('address', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Zone" value="" />
              <Picker.Item label="Zone 1" value="Zone 1" />
              <Picker.Item label="Zone 2" value="Zone 2" />
              <Picker.Item label="Zone 3" value="Zone 3" />
              <Picker.Item label="Zone 4" value="Zone 4" />
              <Picker.Item label="Zone 5" value="Zone 5" />
              <Picker.Item label="Zone 6" value="Zone 6" />
              <Picker.Item label="Zone 7" value="Zone 7" />
            </Picker>
          </View>

          <TextInput
            placeholder="Phone Number"
            value={formData.phoneNumber}
            onChangeText={(text) => handleChange('phoneNumber', text)}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.dateInput} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateText}>{formData.birthDate.toLocaleDateString()}</Text>
            <MaterialIcons name="calendar-today" size={20} color="#91e5aa" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={formData.birthDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {loading ? (
            <ActivityIndicator size="large" color="#91e5aa" style={styles.loader} />
          ) : (
            <TouchableOpacity
              style={[styles.signupButton, !isOtpVerified && { backgroundColor: '#ccc' }]}
              onPress={handleSignup}
              disabled={!isOtpVerified}
            >
              <Text style={styles.signupButtonText}>
                {isOtpVerified ? 'Sign Up' : 'Verify OTP to Continue'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLinkText}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center', // centers vertically
    alignItems: 'center', // centers horizontally
    backgroundColor: '#F7FCF5',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  formBox: {
    width: '100%',
    maxWidth: 400, // keeps it neat on wide screens (like web)
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#91e5aa',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: { height: 50, width: '100%' },
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: { fontSize: 16, color: '#333' },
  sendOtpButton: {
    backgroundColor: '#28a745',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  verifyOtpButton: {
    backgroundColor: '#007bff',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButton: {
    backgroundColor: '#91e5aa',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  signupButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  loader: { marginVertical: 20 },
  loginLink: { marginTop: 10, alignItems: 'center' },
  loginText: { color: '#666' },
  loginLinkText: { color: '#91e5aa', fontWeight: 'bold' },
});

export default SignupScreen;
