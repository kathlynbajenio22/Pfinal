import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Pressable
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../constant';

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        navigation.navigate('AppNavigator', { user: data.user });
      } else {
        Alert.alert('Login Failed', data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Login Error', 'Something went wrong. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo Section */}
      <View style={styles.logoSection}>
        <Image 
          source={require('../assets/logss.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>P-Lament</Text>
      </View>

      {/* Login Form Section */}
      <View style={styles.formSection}>
        <Text style={styles.loginTitle}>Welcome Back</Text>
        
        <TextInput
          placeholder="Username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          style={styles.input}
          autoComplete="username"
        />

        {/* Password Input with Show Button */}
        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            style={styles.passwordInput}
            autoComplete="password"
          />
          <Pressable 
            onPress={() => setShowPassword(!showPassword)} 
            style={styles.showButton}
          >
            <Text style={styles.showText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#91e5aa" style={styles.loader} />
        ) : (
          <Pressable
            onPress={handleLogin}
            style={({ pressed }) => [
              styles.loginButton,
              { backgroundColor: pressed ? '#50C878' : '#91e5aa' }
            ]}
          >
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        )}

        {/* Forgot Password Link */}
        <Pressable 
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </Pressable>

        <Pressable 
          style={styles.signupLink}
          onPress={() => navigation.navigate('Signup')}
        >
          <Text style={styles.signupText}>
            Don't have an account? <Text style={styles.signupLinkText}>Sign Up</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8f4ff',
  },
  logoSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  logo: {
    marginTop: 15,
    width: 275,
    height: 275,
    marginBottom: 1,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#91e5aa',
    textAlign: 'center',
    marginBottom: 1,
  },
  formSection: {
    marginTop: 0,
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 25,
    textAlign: 'center',
  },
  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    paddingHorizontal: 18,
    marginBottom: 20,
    backgroundColor: '#fafafa',
    fontSize: 16,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e1e1',
    borderRadius: 12,
    backgroundColor: '#fafafa',
    marginBottom: 20,
    height: 55,
    paddingHorizontal: 10,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingHorizontal: 10,
  },
  showButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showText: {
    color: '#91e5aa',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginButton: {
    height: 55,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    shadowColor: '#91e5aa',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  forgotText: {
    textAlign: 'center',
    color: '#007bff',
    marginBottom: 10,
  },
  signupLink: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 10,
  },
  signupText: {
    color: '#666',
    fontSize: 15,
  },
  signupLinkText: {
    color: '#91e5aa',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loader: {
    marginVertical: 30,
  },
});

export default LoginScreen;
