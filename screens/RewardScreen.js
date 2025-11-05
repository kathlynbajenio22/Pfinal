import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../constant';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // ✅ gradient background

const RewardScreen = ({ route }) => {
  const { user } = route.params;
  const [rewards, setRewards] = useState([]);
  const [selectedReward, setSelectedReward] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userPoints, setUserPoints] = useState(user.points ?? 0);

  const screenWidth = Dimensions.get('window').width;
  const itemSize = (screenWidth - 48 - 16) / 2;

  const fetchRewards = () => {
    setRefreshing(true);
    axios.get(`${BASE_URL}/api/rewards/`)
      .then(response => {
        const rewardsData = Array.isArray(response.data)
          ? response.data
          : response.data.rewards || [];
        setRewards(rewardsData);
      })
      .catch(error => console.log('Error fetching rewards:', error))
      .finally(() => setRefreshing(false));
  };

  const fetchUserPoints = () => {
    fetch(`${BASE_URL}/api/get-points/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) setUserPoints(data.points);
      })
      .catch(error => console.error(error));
  };

  useFocusEffect(
    useCallback(() => {
      fetchRewards();
      fetchUserPoints();
    }, [])
  );

  const openModal = (reward) => {
    setSelectedReward(reward);
    setModalVisible(true);
  };

  const handleClaim = () => {
    if (!selectedReward) {
      Alert.alert('Error', 'No reward selected.');
      return;
    }

    if (userPoints >= selectedReward.cost) {
      fetch(`${BASE_URL}/api/claim-reward/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reward_id: selectedReward.id,
          user_id: user.id,
        }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            Alert.alert(
              'Request Submitted',
              data.message ||
              'Your claim request has been submitted successfully. Please wait for admin approval.'
            );
            fetchRewards();
            fetchUserPoints();
          } else {
            Alert.alert('Failed', data.message || 'Failed to submit claim request');
          }
        })
        .catch(error => {
          console.error(error);
          Alert.alert('Error', 'Something went wrong');
        });
    } else {
      Alert.alert('Not enough points', `You need ${selectedReward.cost} points.`);
    }

    setModalVisible(false);
  };

  const renderItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.rewardBox,
        {
          width: itemSize,
          height: itemSize + 20,
          marginLeft: index % 2 === 0 ? 0 : 8,
          marginRight: index % 2 === 0 ? 8 : 0,
        },
      ]}
      onPress={() => openModal(item)}
    >
      <View style={styles.availabilityContainer}>
        <View
          style={[
            styles.availabilityBadge,
            {
              backgroundColor:
                item.remaining_quantity > 0 ? '#E8F5E8' : '#FFE8E8',
            },
          ]}
        >
          <Text
            style={[
              styles.availabilityText,
              {
                color: item.remaining_quantity > 0 ? '#28A745' : '#DC3545',
              },
            ]}
          >
            {item.remaining_quantity > 0
              ? `${item.remaining_quantity} left`
              : 'Out of stock'}
          </Text>
        </View>
      </View>

      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle} numberOfLines={2} ellipsizeMode="tail">
          {item.name || 'Unnamed Reward'}
        </Text>
        <Text style={styles.rewardCost}>{item.cost} pts</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#BBF7D0', '#059669']} // 🌿 light, formal gradient like NewScreen
      style={styles.container}
    >
      <Text style={styles.title}>🎁 Rewards</Text>
      <Text style={styles.points}>You have {userPoints} points!</Text>

      <FlatList
        data={rewards}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={fetchRewards}
        numColumns={2}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedReward && (
              <>
                <Image
                  source={{ uri: selectedReward.image }}
                  style={styles.modalImage}
                />
                <Text style={styles.modalTitle}>{selectedReward.name}</Text>
                <Text style={styles.modalText}>
                  Required: {selectedReward.cost} pts
                </Text>
                <Text style={styles.modalText}>You have: {userPoints} pts</Text>
                <Text
                  style={[
                    styles.availabilityText,
                    {
                      color:
                        selectedReward.remaining_quantity > 0
                          ? '#28A745'
                          : '#DC3545',
                      marginBottom: 16,
                    },
                  ]}
                >
                  {selectedReward.remaining_quantity > 0
                    ? `Available: ${selectedReward.remaining_quantity}/${selectedReward.total_quantity}`
                    : 'Out of stock'}
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      {
                        backgroundColor:
                          selectedReward.remaining_quantity > 0
                            ? '#4CAF50'
                            : '#CCCCCC',
                      },
                    ]}
                    onPress={handleClaim}
                    disabled={selectedReward.remaining_quantity === 0}
                  >
                    <Text style={styles.modalButtonText}>
                      {selectedReward.remaining_quantity > 0
                        ? 'Claim'
                        : 'Out of Stock'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: '#888' }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default RewardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#2C5530',
  },
  points: {
    fontSize: 18,
    color: '#444',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 40,
  },
  rewardBox: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3.84,
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  availabilityContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  availabilityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 8,
    marginBottom: 10,
  },
  rewardInfo: {
    flex: 1,
    alignItems: 'center',
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2C5530',
    marginBottom: 4,
    textAlign: 'center',
  },
  rewardCost: {
    fontSize: 13,
    color: '#007B55',
    fontWeight: '600',
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    elevation: 8,
  },
  modalImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#2C5530',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
