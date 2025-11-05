import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  Alert,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { AuthContext } from '../AuthContext';
import { BASE_URL } from '../constant';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';


const ProfileScreen = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phoneNumber: '',
    birthDate: null,
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const navigation = useNavigation();
  const { logout } = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        await loadProfile();
      };
      loadData();
    }, [])
  );

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        throw new Error('No user data found in storage');
      }

      const { id, token } = JSON.parse(userData);
      
      const response = await fetch(`${BASE_URL}/api/get-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: id })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Server returned: ${text}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to load profile');
      }

      setProfile(data.profile);
      setFormData({
        firstName: data.profile.first_name || '',
        lastName: data.profile.last_name || '',
        address: data.profile.address || '',
        phoneNumber: data.profile.phone_number || '',
        birthDate: data.profile.birth_date ? new Date(data.profile.birth_date) : null,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Separate profile update and password change
  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) throw new Error('No user data found');

      const { id, token } = JSON.parse(userData);

      // Prepare profile update data
      const updateData = {
        user_id: id,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        address: formData.address.trim() || null,
        phone_number: formData.phoneNumber.trim() || null,
      };

      console.log('Sending profile update:', updateData);

      // Update profile
      const profileResponse = await fetch(`${BASE_URL}/api/update-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const profileData = await profileResponse.json();
      console.log('Profile update response:', profileData);

      if (!profileResponse.ok) {
        throw new Error(profileData.message || 'Profile update failed');
      }

      // Update password separately if provided
      if (formData.currentPassword && formData.newPassword) {
        await updatePassword(id);
      }

      // Update local state
      if (profileData.profile) {
        setProfile(profileData.profile);
        setFormData(prev => ({
          ...prev,
          firstName: profileData.profile.first_name || '',
          lastName: profileData.profile.last_name || '',
          address: profileData.profile.address || '',
          phoneNumber: profileData.profile.phone_number || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
      }

      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);

    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', error.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Password change function
  const updatePassword = async (userId) => {
    if (formData.newPassword !== formData.confirmPassword) {
      throw new Error('New passwords do not match');
    }

    const response = await fetch(`${BASE_URL}/api/change-password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Password change failed');
    }
    
    return data;
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.firstName.trim()) {
      Alert.alert('Validation Error', 'First name is required');
      return false;
    }
    if (!formData.lastName || !formData.lastName.trim()) {
      Alert.alert('Validation Error', 'Last name is required');
      return false;
    }
    if (formData.phoneNumber && formData.phoneNumber.trim() && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber.trim())) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    
    // Password validation only if trying to change password
    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) {
        Alert.alert('Validation Error', 'Current password is required to change password');
        return false;
      }
      if (!formData.newPassword) {
        Alert.alert('Validation Error', 'New password is required');
        return false;
      }
      if (formData.newPassword.length < 6) {
        Alert.alert('Validation Error', 'New password must be at least 6 characters');
        return false;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        Alert.alert('Validation Error', 'New passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
  };

  const handleChange = (name, value) => {
    setFormData({...formData, [name]: value});
  };

  // FIXED: Profile picture upload
  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.length > 0) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // FIXED: Upload image function
  const uploadImage = async (uri) => {
    setLoading(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) throw new Error('No user data found');

      const { id } = JSON.parse(userData);
      
      // Create FormData properly
      const formDataToSend = new FormData();
      formDataToSend.append('profile_pic', {
        uri: uri,
        name: 'profile.jpg',
        type: 'image/jpeg',
      });
      formDataToSend.append('user_id', id.toString());

      console.log('Uploading image for user:', id);
      
      const response = await fetch(`${BASE_URL}/api/upload-profile-pic/`, {
        method: 'POST',
        body: formDataToSend,
        headers: {
          // Let React Native set the Content-Type with boundary
        },
      });

      const data = await response.json();
      console.log('Upload response:', data);

      if (!response.ok) {
        throw new Error(data.message || `Upload failed: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }

      // Update local profile with new image
      setProfile(prev => ({
        ...prev,
        profile_pic: data.profile_pic
      }));
      
      Alert.alert('Success', 'Profile picture updated!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userData');
    logout();
    navigation.replace('Login');
  };

  const handleSendForgotPasswordOTP = async () => {
    if (!profile?.email) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/send-forgot-password-otp/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: profile.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');

      Alert.alert('Success', 'OTP sent to your email');
      navigation.navigate('ForgotPassword', { email: profile.email });

    } catch (error) {
      console.error('Send OTP error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };


  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>No profile data available</Text>
        <TouchableOpacity 
          style={[styles.button, styles.retryButton]}
          onPress={loadProfile}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Profile Picture Section */}
      <View style={styles.avatarContainer}>
        {profile.profile_pic ? (
          <Image source={{ uri: profile.profile_pic }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.initials}>
              {profile.first_name?.[0]?.toUpperCase() || 
               profile.username?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
        )}
        {isEditing && (
          <TouchableOpacity 
            style={styles.editPhotoButton}
            onPress={pickImage}
            disabled={loading}
          >
            <MaterialIcons name="edit" size={20} color="white" />
          </TouchableOpacity>
        )}
      </View>

      {isEditing ? (
        <>
          {/* Edit Form */}
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => handleChange('firstName', text)}
            placeholder="First Name"
            editable={!loading}
          />
          
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => handleChange('lastName', text)}
            placeholder="Last Name"
            editable={!loading}
          />
          
              <View style={styles.pickerContainer}>
      <Picker
        selectedValue={formData.address}
        onValueChange={(value) => handleChange('address', value)}
        enabled={!loading}
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
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) => handleChange('phoneNumber', text)}
            placeholder="Phone Number"
            keyboardType="phone-pad"
            editable={!loading}
          />
          
          {/* Birthday Field - Display Only */}
          <View style={[styles.dateInput, styles.disabledField]}>
            <Text style={[styles.dateText, styles.disabledText]}>
              {formData.birthDate ? formData.birthDate.toLocaleDateString() : 'No birth date set'}
            </Text>
            <MaterialIcons name="calendar-today" size={20} color="#999" />
          </View>
          <Text style={styles.disabledNote}>
            * Birth date cannot be changed
          </Text>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.birthDate || new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.sectionTitle}>Change Password (Optional)</Text>
          <TextInput
            style={styles.input}
            value={formData.currentPassword}
            onChangeText={(text) => handleChange('currentPassword', text)}
            placeholder="Current Password"
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            value={formData.newPassword}
            onChangeText={(text) => handleChange('newPassword', text)}
            placeholder="New Password"
            secureTextEntry
            editable={!loading}
          />

          <TextInput
            style={styles.input}
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange('confirmPassword', text)}
            placeholder="Confirm New Password"
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity 
            style={[styles.button, styles.saveButton]}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              const hasChanges = 
                formData.firstName !== (profile.first_name || '') ||
                formData.lastName !== (profile.last_name || '') ||
                formData.address !== (profile.address || '') ||
                formData.phoneNumber !== (profile.phone_number || '') ||
                formData.currentPassword || formData.newPassword || formData.confirmPassword;
              
              if (hasChanges) {
                Alert.alert(
                  'Discard Changes',
                  'Are you sure you want to discard your changes?',
                  [
                    { text: 'Keep Editing', style: 'cancel' },
                    { 
                      text: 'Discard', 
                      style: 'destructive',
                      onPress: () => {
                        setFormData({
                          firstName: profile.first_name || '',
                          lastName: profile.last_name || '',
                          address: profile.address || '',
                          phoneNumber: profile.phone_number || '',
                          birthDate: profile.birth_date ? new Date(profile.birth_date) : null,
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setIsEditing(false);
                      }
                    }
                  ]
                );
              } else {
                setIsEditing(false);
              }
            }}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* View Mode */}
          <Text style={styles.name}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={styles.username}>@{profile.username}</Text>
          
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <MaterialIcons name="email" size={24} color="#06923E" />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>
            
            {profile.address && (
              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={24} color="#06923E" />
                <Text style={styles.infoText}>{profile.address}</Text>
              </View>
            )}
            
            {profile.phone_number && (
              <View style={styles.infoItem}>
                <MaterialIcons name="phone" size={24} color="#06923E" />
                <Text style={styles.infoText}>{profile.phone_number}</Text>
              </View>
            )}
            
            {profile.birth_date && (
              <View style={styles.infoItem}>
                <MaterialIcons name="cake" size={24} color="#06923E" />
                <Text style={styles.infoText}>
                  {new Date(profile.birth_date).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.button, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#DEFFE4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginVertical: 15,
    marginTop: 100,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e1e1e1',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 15,
  },
  initials: {
    fontSize: 48,
    color: '#666',
    fontWeight: 'bold',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 10,
    right: 100,
    backgroundColor: '#06923E',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: '#333',
  },
  username: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#444',
    flexShrink: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
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
  dateInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 5,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  disabledField: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  disabledText: {
    color: '#999',
  },
  disabledNote: {
    fontSize: 12,
    color: '#999',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  editButton: {
    backgroundColor: '#06923E',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#dd2323ff',
  },
  logoutButton: {
    backgroundColor: '#dd2323ff',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: '#91e5aa',
    marginTop: 20,
    paddingHorizontal: 30,
  },
  pickerContainer: {
  borderWidth: 1,
  borderColor: '#ddd',
  borderRadius: 8,
  backgroundColor: '#fff',
  marginBottom: 15,
},

});

export default ProfileScreen;