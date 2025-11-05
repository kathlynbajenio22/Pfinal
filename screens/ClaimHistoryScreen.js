import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BASE_URL } from '../constant';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const ClaimHistoryScreen = ({ route }) => {
  const { user } = route.params;
  const [claimHistory, setClaimHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilter, setShowFilter] = useState(false);

  // 🧩 Fetch claim history
  const fetchClaimHistory = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`${BASE_URL}/api/claim-history/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await response.json();

      if (data.success) {
        setClaimHistory(data.history || []);
      } else {
        Alert.alert('Error', data.message || 'Failed to fetch claim history.');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while fetching claim history.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchClaimHistory();
    }, [])
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'approved': return '#28A745';
      case 'rejected': return '#DC3545';
      default: return '#6C757D';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila',
    });
  };

  const formatSimpleDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    if (isNaN(date)) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Manila',
    });
  };

  const isClaimExpired = (claimByDate) => {
    if (!claimByDate) return false;
    const now = new Date();
    const claimDate = new Date(claimByDate);
    return now > claimDate;
  };

  const getDaysRemaining = (claimByDate) => {
    if (!claimByDate) return null;
    const now = new Date();
    const claimDate = new Date(claimByDate);
    const diff = claimDate - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const handleSearch = (text) => setSearchText(text);
  const handleFilter = (status) => {
    setFilterStatus(status);
    setShowFilter(false);
  };

  const filteredHistory = claimHistory.filter(claim => {
    if (filterStatus !== 'all' && claim.status !== filterStatus) return false;
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      return (
        claim.unique_id?.toLowerCase().includes(searchLower) ||
        claim.reward_name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const renderClaimItem = ({ item }) => {
    const expired = isClaimExpired(item.claim_by_date);
    const daysRemaining = getDaysRemaining(item.claim_by_date);

    return (
      <View style={styles.claimItem}>
        <View style={styles.claimHeader}>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardName}>{item.reward_name}</Text>
            <Text style={styles.uniqueId}>
              ID: {item.unique_id || `CR${item.id.toString().padStart(6, '0')}`}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.claimDetails}>
          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Points Required: </Text>
            <Text style={styles.detailValue}>{item.reward_cost}</Text>
          </Text>

          <Text style={styles.detailRow}>
            <Text style={styles.detailLabel}>Requested: </Text>
            <Text style={styles.detailValue}>{formatDateTime(item.requested_at)}</Text>
          </Text>

          {item.status === 'approved' && item.claim_by_date && (
            <View style={[styles.claimDateContainer, expired ? styles.expiredClaim : styles.activeClaim]}>
              <Text style={styles.claimDateLabel}>
                {expired ? '⏰ Claim Expired' : '📅 Claim By:'} {formatSimpleDate(item.claim_by_date)}
              </Text>
              {!expired && daysRemaining > 0 && (
                <Text style={styles.daysRemaining}>{daysRemaining} days left</Text>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={['#BBF7D0', '#059669']} style={styles.background}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎟️ Claim History</Text>
          <Text style={styles.subtitle}>Track your reward requests and status.</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by ID or Reward..."
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* Filter Button */}
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilter(!showFilter)}>
          <Text style={styles.filterButtonText}>
            Filter: {filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}
          </Text>
          <Ionicons
            name={showFilter ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#2C5530"
          />
        </TouchableOpacity>

        {showFilter && (
          <View style={styles.filterDropdown}>
            {['all', 'approved', 'pending', 'rejected'].map(status => (
              <TouchableOpacity key={status} onPress={() => handleFilter(status)}>
                <Text style={styles.filterOption}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Claim List */}
        <FlatList
          data={filteredHistory}
          renderItem={renderClaimItem}
          keyExtractor={item => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchClaimHistory} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No Claim History Found</Text>
          }
          contentContainerStyle={{ paddingBottom: 50 }}
        />
      </View>
    </LinearGradient>
  );
};

export default ClaimHistoryScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C5530',
  },
  subtitle: {
    fontSize: 16,
    color: '#374151',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    height: 50,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 10,
  },
  filterButton: {
    backgroundColor: '#E8F5E8',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterButtonText: {
    fontWeight: '600',
    color: '#2C5530',
  },
  filterDropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 8,
    fontSize: 14,
    color: '#495057',
  },
  claimItem: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  claimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C5530',
  },
  uniqueId: {
    fontSize: 12,
    color: '#2C5530',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  claimDetails: {
    marginTop: 10,
  },
  detailRow: {
    marginBottom: 4,
  },
  detailLabel: {
    color: '#6C757D',
    fontWeight: '500',
  },
  detailValue: {
    color: '#495057',
    fontWeight: '600',
  },
  claimDateContainer: {
    marginTop: 8,
    padding: 10,
    borderRadius: 8,
  },
  activeClaim: {
    backgroundColor: '#F0F9FF',
  },
  expiredClaim: {
    backgroundColor: '#FEF2F2',
  },
  claimDateLabel: {
    fontWeight: 'bold',
    color: '#374151',
  },
  daysRemaining: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6C757D',
    marginTop: 50,
  },
});
