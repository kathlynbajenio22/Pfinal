import React, { useCallback, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { BASE_URL } from "../constant";
import { Ionicons } from "@expo/vector-icons";

const NewScreen = ({ route }) => {
  const { user } = route.params;
  const [points, setPoints] = useState(0);
  const [claimHistory, setClaimHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const getDashboardData = async () => {
        try {
          setLoading(true);
          const pointsRes = await fetch(`${BASE_URL}/api/get-points/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });
          const pointsData = await pointsRes.json();
          if (pointsData.success) setPoints(pointsData.points);

          const historyRes = await fetch(`${BASE_URL}/api/claim-history/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id }),
          });
          const historyData = await historyRes.json();
          if (historyData.success) setClaimHistory(historyData.history || []);
        } catch (err) {
          console.error("Dashboard error:", err.message);
        } finally {
          setLoading(false);
        }
      };
      getDashboardData();
    }, [user.id])
  );

  const totalClaims = claimHistory.length;
  const approvedClaims = claimHistory.filter((c) => c.status === "approved").length;
  const pendingClaims = claimHistory.filter((c) => c.status === "pending").length;
  const rejectedClaims = claimHistory.filter((c) => c.status === "rejected").length;
  const decidedClaims = approvedClaims + rejectedClaims;
  const successRate = decidedClaims > 0 ? Math.round((approvedClaims / decidedClaims) * 100) : 0;

  const rewardCounts = {};
  claimHistory
    .filter((c) => c.status === "approved")
    .forEach((c) => {
      if (c.reward_name) {
        rewardCounts[c.reward_name] = (rewardCounts[c.reward_name] || 0) + 1;
      }
    });

  const favoriteReward =
    Object.keys(rewardCounts).length > 0
      ? Object.keys(rewardCounts).reduce((a, b) => (rewardCounts[a] > rewardCounts[b] ? a : b))
      : null;

  const getMotivationalMessage = () => {
    if (points >= 100) return "🌎 Amazing! You’re a Recycling Hero!";
    if (points >= 50) return "💪 Keep recycling! Every bottle counts!";
    if (points >= 0) return "♻️ Great job! You're helping clean the planet!";
    return "🌱 Start recycling bottles to earn rewards and save Earth!";
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your recycling dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.background}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.welcomeText}>Welcome, {user.username || "Recycler"}! ♻️</Text>

        {/* Points Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💰 Your Point Balance</Text>
          <Text style={styles.pointsValue}>{points}</Text>
          <Text style={styles.cardSubtitle}>Available to Redeem</Text>
          <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="time-outline" size={26} color="#fff" />
            <Text style={styles.statNumber}>{pendingClaims}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="checkmark-circle-outline" size={26} color="#fff" />
            <Text style={styles.statNumber}>{approvedClaims}</Text>
            <Text style={styles.statLabel}>Approved</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="close-circle-outline" size={26} color="#fff" />
            <Text style={styles.statNumber}>{rejectedClaims}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: "#16A34A" }]}>
            <Ionicons name="list-outline" size={26} color="#fff" />
            <Text style={styles.statNumber}>{totalClaims}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Success Rate */}
        {decidedClaims > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊 Recycling Success</Text>
            <Text style={styles.successRate}>{successRate}%</Text>
            <Text style={styles.successDescription}>
              {approvedClaims} successful claims out of {decidedClaims}
            </Text>
          </View>
        )}

        {/* Activity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>♻️ Your Eco Activity</Text>
          <Text style={styles.activityText}>🧴 You’ve recycled bottles worth {points} points!</Text>
          {favoriteReward && (
            <Text style={styles.activityText}>
              🌟 Favorite Reward: {favoriteReward} ({rewardCounts[favoriteReward]} time
              {rewardCounts[favoriteReward] > 1 ? "s" : ""})
            </Text>
          )}
        </View>

        {/* Empty State */}
        {totalClaims === 0 && (
          <View style={[styles.card, styles.emptyCard]}>
            <Text style={styles.cardTitle}>🚀 Start Your Green Journey!</Text>
            <Text style={styles.emptyText}>
              You haven’t submitted any bottle claims yet. Recycle and earn Eco Points today!
            </Text>
            <TouchableOpacity style={styles.startButton}>
              <Text style={styles.startButtonText}>Recycle Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#F7FCF5",
  },
  container: {
    padding: 20,
    alignItems: "stretch",
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7FCF5",
  },
  loadingText: {
    fontSize: 18,
    color: "#166534",
    fontWeight: "600",
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#064E3B",
    textAlign: "center",
    marginVertical: 25,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 20,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#166534",
    textAlign: "center",
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
  },
  pointsValue: {
    fontSize: 48,
    fontWeight: "800",
    color: "#16A34A",
    textAlign: "center",
    marginVertical: 8,
  },
  motivationText: {
    fontSize: 15,
    textAlign: "center",
    color: "#4B5563",
    marginTop: 8,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  statCard: {
    flexBasis: "48%",
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
  },
  successRate: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#16A34A",
    textAlign: "center",
    marginVertical: 10,
  },
  successDescription: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
  },
  activityText: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 6,
    textAlign: "center",
  },
  emptyCard: {
    backgroundColor: "#ECFDF5",
    borderLeftWidth: 5,
    borderLeftColor: "#16A34A",
  },
  emptyText: {
    fontSize: 14,
    color: "#065F46",
    textAlign: "center",
    marginVertical: 8,
  },
  startButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  startButtonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default NewScreen;
