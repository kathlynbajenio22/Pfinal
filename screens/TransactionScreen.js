// screens/TransactionScreen.js
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const transactions = [
  { id: '1', type: 'Reward Claimed', amount: -50, date: '2025-06-10' },
  { id: '2', type: 'Points Earned', amount: 100, date: '2025-06-09' },
  { id: '3', type: 'Bonus', amount: 25, date: '2025-06-08' },
];

const TransactionScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.type}>{item.type}</Text>
            <Text style={styles.amount}>{item.amount > 0 ? `+${item.amount}` : item.amount} pts</Text>
            <Text style={styles.date}>{item.date}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default TransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  heading: {
    marginTop: 50,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  type: {
    fontSize: 16,
    fontWeight: '500',
  },
  amount: {
    fontSize: 16,
    color: '#333',
  },
  date: {
    fontSize: 12,
    color: '#777',
  },
});
