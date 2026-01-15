import React, { useEffect, useState } from 'react';
import {
    StyleSheet, Text, View, FlatList, Image, ActivityIndicator,
    TouchableOpacity, Modal, ScrollView
} from 'react-native';
import { db, auth } from '../../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (!user) return;

        // Nemo binciken wannan manomin kawai daga Firestore
        const q = query(
            collection(db, "history"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const data: any[] = [];
            querySnapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setHistory(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => setSelectedItem(item)}
        >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardInfo}>
                <Text style={styles.cardDate}>
                    {item.createdAt?.toDate().toLocaleDateString('ha-NG')}
                </Text>
                <Text numberOfLines={2} style={styles.cardResult}>{item.result}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={styles.centerText}>
                <ActivityIndicator size="large" color="#2E7D32" />
                <Text>Ana ɗauko bayanai...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tarihin Bincike 🌿</Text>
            </View>

            {history.length === 0 ? (
                <View style={styles.centerText}>
                    <Ionicons name="receipt-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>Ba ka da wani bincike a ajiye tukuna.</Text>
                </View>
            ) : (
                <FlatList
                    data={history}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: 15 }}
                />
            )}

            {/* Modal don nuna cikakken bincike */}
            <Modal visible={!!selectedItem} animationType="slide" transparent={false}>
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setSelectedItem(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="#2E7D32" />
                    </TouchableOpacity>

                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {selectedItem && (
                            <>
                                <Image source={{ uri: selectedItem.image }} style={styles.fullImage} />
                                <Text style={styles.fullDate}>An yi binciken ne a ranar: {selectedItem.createdAt?.toDate().toLocaleDateString('ha-NG')}</Text>
                                <Text style={styles.fullTitle}>Sakamakon FarmerAI:</Text>
                                <Text style={styles.fullText}>{selectedItem.result}</Text>
                            </>
                        )}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FFF9' },
    header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#fff', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#eee' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
    centerText: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { flexDirection: 'row', backgroundColor: '#fff', marginBottom: 10, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 2 },
    cardImage: { width: 60, height: 60, borderRadius: 8 },
    cardInfo: { flex: 1, marginLeft: 12 },
    cardDate: { fontSize: 12, color: '#888' },
    cardResult: { fontSize: 14, color: '#444', marginTop: 4 },
    emptyText: { marginTop: 10, color: '#888', fontSize: 16 },
    modalContainer: { flex: 1, backgroundColor: '#fff' },
    closeBtn: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
    modalContent: { padding: 20, paddingTop: 100 },
    fullImage: { width: '100%', height: 300, borderRadius: 15, marginBottom: 20 },
    fullDate: { fontSize: 14, color: '#666', marginBottom: 10 },
    fullTitle: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20', marginBottom: 10 },
    fullText: { fontSize: 17, lineHeight: 28, color: '#333' }
});