import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Icon from 'react-native-vector-icons/MaterialIcons';

const QRScreen = ({ route }) => {
  const { user } = route.params;

  // Generate random alphanumeric suffix (6 characters)
  const generateIdSuffix = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Combine username with unique suffix (format: username-ABC123)
  const combinedId = `${user.username}-${generateIdSuffix()}`.toUpperCase();

  // QR data with the combined ID
  const qrData = JSON.stringify({
    system: "P-Lament System",
    userId: combinedId,
    username: user.username,
    lastUpdated: new Date().toISOString()
  });

  const shareId = async () => {
    try {
      await Share.share({
        message: `My User ID: ${combinedId}`,
        title: 'Share User ID'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share ID');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>IoT Points QR</Text>
      
      <View style={styles.qrContainer}>
        <QRCode 
          value={qrData}
          size={250}
          color="#2c3e50"
          backgroundColor="white"
        />
      </View>

      <View style={styles.idSection}>
        <Text style={styles.idLabel}>Your Unique ID:</Text>
        <View style={styles.idRow}>
          <Text style={styles.idText} selectable>{combinedId}</Text>
          <TouchableOpacity onPress={shareId}>
            <Icon name="share" size={22} color="#3498db" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.instructions}>
        Scan this QR at IoT machines. Your ID format is USERNAME-ABC123.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DEFFE4',
    padding: 20
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 30
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
    elevation: 3
  },
  idSection: {
    width: '90%',
    marginBottom: 20
  },
  idLabel: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 8
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecf0f1',
    padding: 15,
    borderRadius: 8
  },
  idText: {
    fontSize: 16,
    color: '#2c3e50',
    fontFamily: 'monospace',
    fontWeight: 'bold'
  },
  instructions: {
    fontSize: 14,
    color: '#95a5a6',
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 20,
    paddingHorizontal: 20
  }
});

export default QRScreen;