// screens/ResetPasswordScreen.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native';

export default function ResetPasswordScreen({ route, navigation }) {
  const { email } = route.params;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);

  const inputs = useRef([]);

  useEffect(() => {
    if (timer === 0) return;
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  useEffect(() => {
    // Auto-submit when all OTP digits are filled
    if (otp.every(digit => digit !== '')) handleResetPassword();
  }, [otp]);

  const handleOtpChange = (text, index) => {
    if (/^\d*$/.test(text)) { // Only allow numbers
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);
      if (text && index < 5) inputs.current[index + 1].focus();
    }
  };

  const handleResetPassword = async () => {
    if (!otp.every(d => d) || !newPassword) return;
    setLoading(true);

    try {
      const response = await fetch('http://YOUR_BACKEND_URL/reset-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), new_password: newPassword }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert('Success', 'Password reset successfully');
        navigation.navigate('Login');
      } else {
        Alert.alert('Error', data.detail || 'Invalid OTP or expired');
      }
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'Network error');
    }
  };

  const handleResendOTP = async () => {
    if (timer > 0) return;

    setResendLoading(true);
    try {
      const response = await fetch('http://YOUR_BACKEND_URL/forgot-password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setResendLoading(false);

      if (response.ok) {
        Alert.alert('Success', 'OTP resent to your email');
        setOtp(['', '', '', '', '', '']);
        inputs.current[0].focus();
        setTimer(60);
      } else {
        Alert.alert('Error', data.error || 'Something went wrong');
      }
    } catch (error) {
      setResendLoading(false);
      Alert.alert('Error', 'Network error');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={ref => inputs.current[index] = ref}
            style={styles.otpInput}
            value={digit}
            onChangeText={text => handleOtpChange(text, index)}
            keyboardType="number-pad"
            maxLength={1}
          />
        ))}
      </View>

      <TextInput
        placeholder="Enter New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        style={styles.input}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={{ marginRight: 10 }}>
          Didn't receive OTP? {timer > 0 ? `Resend in ${timer}s` : ''}
        </Text>
        <TouchableOpacity disabled={timer > 0 || resendLoading} onPress={handleResendOTP}>
          {resendLoading ? <ActivityIndicator /> : <Text style={[styles.resendText, { color: timer > 0 ? '#ccc' : '#007bff' }]}>Resend OTP</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  otpContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  otpInput: { borderWidth: 1, borderColor: '#ccc', padding: 10, width: 40, textAlign: 'center', borderRadius: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 },
  button: { backgroundColor: '#28a745', padding: 15, borderRadius: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  resendContainer: { flexDirection: 'row', marginTop: 15, justifyContent: 'center', alignItems: 'center' },
  resendText: { fontWeight: 'bold' },
});
