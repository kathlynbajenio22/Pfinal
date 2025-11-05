import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

import NewScreen from '../screens/NewScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RewardScreen from '../screens/RewardScreen';
import TransactionScreen from '../screens/TransactionScreen';
import ClaimHistoryScreen from '../screens/ClaimHistoryScreen';
import QRScreen from '../screens/QRScreen';

const Tab = createBottomTabNavigator();

// Custom floating QR Button (icon only)
const QRButton = ({ onPress }) => (
  <TouchableOpacity style={styles.qrButtonContainer} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.qrButton}>
      <MaterialCommunityIcons name="qrcode-scan" size={30} color="#fff" />
    </View>
  </TouchableOpacity>
);

const AppNavigator = ({ route }) => {
  const { user } = route.params;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          paddingBottom: 6,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={NewScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Reward"
        component={RewardScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <FontAwesome5 name="gift" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="QR"
        component={QRScreen}
        initialParams={{ user }}
        options={{
          tabBarButton: (props) => <QRButton {...props} />,
        }}
      />

      <Tab.Screen
        name="History"
        component={ClaimHistoryScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        initialParams={{ user }}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  qrButtonContainer: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#28a745', // ✅ green background
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
});
