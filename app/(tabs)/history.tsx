import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, FlatList, Image,
    ActivityIndicator, TouchableOpacity, Modal, ScrollView
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Bayanin yadda kowane tarihi yake
interface HistoryItem {
    id: string;
    image: string | null;
    question: string | null;
    result: string;
    createdAt: any;
}

export default function HistoryScreen() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const q = query(
                collection(db, "history"),
                where("userId", "==", user.uid),
                orderBy("createdAt", "desc")
            );

            const querySnapshot = await getDocs(q);
            const data: HistoryItem[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as HistoryItem);
            });
            setHistory(data);
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: HistoryItem }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedItem(item)}
        >
            <View style={styles.cardContent}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.thumbnail} />
                ) : (
                    <View style={[styles.thumbnail, styles.textIconPlaceholder]}>
                        <Ionicons name="chatbubble-ellipses" size={24} color="#2E7D32" />
                    </View>
                )}
                <View style={styles.textDetails}>
                    <Text style={styles.dateText}>
                        {item.createdAt?.toDate().toLocaleDateString('ha-NG')}
                    </Text>
                    <Text style={styles.questionSnippet} numberOfLines={1}>
                        {item.question || "Binciken Hoto"}
                    </Text>
                    <Text style={styles.resultSnippet} numberOfLines={2}>
                        {item.result}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#1B5E20" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Tarihin Bincike</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#2E7D32" />
                </View>
            ) : history.length === 0 ? (
                <View style={styles.center}>
                    <Ionicons name="leaf-outline" size={80} color="#DDD" />
                    <Text style={styles.emptyText}>Baka yi bincike ko daya ba tukunna.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}

            {/* Modal don nuna cikakken bayani idan an taba daya */}
            <Modal visible={!!selectedItem} animationType="slide" transparent={false}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedItem(null)}>
                        <Ionicons name="close-circle" size={40} color="#1B5E20" />
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.modalScroll}>
                        {selectedItem?.image && (
                            <Image source={{ uri: selectedItem.image }} style={styles.fullImage} />
                        )}
                        <View style={styles.detailsBox}>
                            <Text style={styles.modalLabel}>Tambayar Ka:</Text>
                            <Text style={styles.modalText}>{selectedItem?.question || "Binciken Hoto Kawai"}</Text>

                            <View style={styles.divider} />

                            <Text style={styles.modalLabel}>Amsar FarmerAI:</Text>
                            <Text style={styles.modalResult}>{selectedItem?.result}</Text>
                        </View>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FFF9' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'white',
        elevation: 2
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: {
        backgroundColor: 'white', borderRadius: 12, marginBottom: 12,
        padding: 12, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1
    },
    cardContent: { flexDirection: 'row', alignItems: 'center' },
    thumbnail: { width: 60, height: 60, borderRadius: 8, marginRight: 15 },
    textIconPlaceholder: { backgroundColor: '#E8F5E9', justifyContent: 'center', alignItems: 'center' },
    textDetails: { flex: 1 },
    dateText: { fontSize: 12, color: '#888', marginBottom: 4 },
    questionSnippet: { fontSize: 15, fontWeight: 'bold', color: '#333' },
    resultSnippet: { fontSize: 13, color: '#666', marginTop: 2 },
    emptyText: { marginTop: 15, fontSize: 16, color: '#999', textAlign: 'center' },

    // Modal Styles
    modalContainer: { flex: 1, backgroundColor: 'white', paddingTop: 40 },
    closeBtn: { alignSelf: 'center', marginBottom: 10 },
    modalScroll: { padding: 20 },
    fullImage: { width: '100%', height: 300, borderRadius: 15, marginBottom: 20 },
    detailsBox: { backgroundColor: '#F1F8E9', padding: 20, borderRadius: 15 },
    modalLabel: { fontSize: 14, fontWeight: 'bold', color: '#2E7D32', marginBottom: 5 },
    modalText: { fontSize: 16, color: '#333', marginBottom: 15 },
    divider: { height: 1, backgroundColor: '#DDD', marginVertical: 15 },
    modalResult: { fontSize: 16, lineHeight: 24, color: '#333' }
});