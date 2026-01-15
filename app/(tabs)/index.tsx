import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, TextInput, Modal, Dimensions, Alert, ImageBackground
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Firebase Imports
import { auth, db } from '../../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function FarmerApp() {
  const router = useRouter();

  // App State
  const [image, setImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [greeting, setGreeting] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);
  const [weather, setWeather] = useState({ temp: '32°C', status: 'Hasken Rana', icon: 'sunny' });

  // Date & Time
  const now = new Date();
  const dateString = now.toLocaleDateString('ha-NG', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    const hours = now.getHours();
    if (hours < 12) setGreeting('Ina kwana, Barka da Safiya');
    else if (hours < 16) setGreeting('Barka da Rana, ya aikin gona?');
    else setGreeting('Barka da Yamma, ya hutu?');
  }, []);

  // --- Functions ---

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMenuVisible(false);
      router.replace('/login');
    } catch (error) {
      Alert.alert("Kuskure", "Ba a samu damar fita ba.");
    }
  };

  const pickImage = async (mode: 'camera' | 'library') => {
    let result;
    if (mode === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        quality: 0.5,
        base64: true
      });
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
      setShowConfirmModal(true);
    }
  };

  const startAnalysis = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('https://farmermobile.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_data: base64Image }),
      });
      const data = await response.json();
      const analysisText = data.analysis;

      setResult(analysisText);

      // Adana a Firestore History
      const user = auth.currentUser;
      if (user && base64Image) {
        await addDoc(collection(db, "history"), {
          userId: user.uid,
          image: `data:image/jpeg;base64,${base64Image}`,
          result: analysisText,
          createdAt: serverTimestamp(),
        });
      }

      Speech.speak(analysisText, { language: 'ha', pitch: 1.0, rate: 0.9 });
    } catch (error) {
      Alert.alert("Matsala", "Ba a samu damar tuntuɓar FarmerAI ba.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F1F8E9' }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateString}</Text>
          <Text style={styles.greetingText}>{greeting}</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={28} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* Weather Card */}
        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.weatherTemp}>{weather.temp}</Text>
            <Text style={styles.weatherStatus}>{weather.status}</Text>
            <Text style={styles.weatherDesc}>Zai iya yin ruwa anjima kaɗan</Text>
          </View>
          <Ionicons name={weather.icon as any} size={50} color="#FFA000" />
        </View>

        <Text style={styles.sectionTitle}>Binciken FarmerAI</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionItem} onPress={() => pickImage('camera')}>
            <View style={[styles.iconCircle, { backgroundColor: '#2E7D32' }]}>
              <Ionicons name="camera" size={30} color="white" />
            </View>
            <Text style={styles.actionLabel}>Duba Shuka</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => pickImage('library')}>
            <View style={[styles.iconCircle, { backgroundColor: '#8B4513' }]}>
              <MaterialCommunityIcons name="image-filter-center-focus" size={30} color="white" />
            </View>
            <Text style={styles.actionLabel}>Hoton Gona</Text>
          </TouchableOpacity>
        </View>

        {loading && <ActivityIndicator size="large" color="#2E7D32" style={{ marginTop: 20 }} />}

        {result ? (
          <View style={styles.resultBox}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Sakamakon FarmerAI</Text>
              <TouchableOpacity onPress={() => Speech.speak(result, { language: 'ha' })}>
                <Ionicons name="volume-high" size={24} color="#2E7D32" />
              </TouchableOpacity>
            </View>
            <Text style={styles.resultContent}>{result}</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => setResult('')}>
              <Text style={styles.backBtnText}>Goge/Sake Wani</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>FarmerAI zai taimake ka gano cutar shuka da kuma ingancin ƙasarka cikin daƙiƙu kadan.</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem}><Ionicons name="home" size={24} color="#2E7D32" /><Text style={styles.footerText}>Gida</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/history')}><Ionicons name="leaf" size={24} color="#999" /><Text style={styles.footerText}>History</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}><Ionicons name="chatbubbles" size={24} color="#999" /><Text style={styles.footerText}>Shawara</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerItem}><Ionicons name="person" size={24} color="#999" /><Text style={styles.footerText}>Profile</Text></TouchableOpacity>
      </View>

      {/* Image Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Tabbatar da Hoto</Text>
            {image && <Image source={{ uri: image }} style={styles.confirmImage} />}
            <Text style={styles.confirmInfo}>Shin hoton nan ya fito da kyau don bincike?</Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowConfirmModal(false)}>
                <Text style={styles.cancelText}>Sake Ɗauka</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={startAnalysis}>
                <Text style={styles.confirmBtnText}>Fara Bincike</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side Menu Modal */}
      <Modal visible={menuVisible} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBg} onPress={() => setMenuVisible(false)}>
          <View style={styles.sideMenu}>
            <Text style={styles.menuHeader}>Saituna</Text>
            <TouchableOpacity style={styles.menuItem}><Ionicons name="person-outline" size={20} /> <Text>Profile Dina</Text></TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); setPrivacyVisible(true); }}>
              <Ionicons name="shield-checkmark-outline" size={20} /> <Text>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem}><Ionicons name="help-circle-outline" size={20} /> <Text>Taimako</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { marginTop: 20 }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="red" /> <Text style={{ color: 'red' }}>Fita (Logout)</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={privacyVisible} animationType="slide">
        <View style={styles.privacyContainer}>
          <View style={styles.privacyHeader}>
            <TouchableOpacity onPress={() => setPrivacyVisible(false)}>
              <Ionicons name="chevron-back" size={30} color="#1B5E20" />
            </TouchableOpacity>
            <Text style={styles.privacyTitle}>Privacy Policy</Text>
            <View style={{ width: 30 }} />
          </View>
          <ScrollView style={{ padding: 20 }}>
            <Text style={styles.pText}>Barka da amfani da **FarmerAI**. Tsaron bayananku yana da muhimmanci a gare mu.</Text>
            <Text style={styles.pSub}>1. Bayanan da muke tattarawa</Text>
            <Text style={styles.pText}>Muna amfani da hotunan da kuka dauka ne kawai don binciken cututtukan shuka ta hanyar fasahar AI.</Text>
            <Text style={styles.pSub}>2. Yadda muke amfani da bayanai</Text>
            <Text style={styles.pText}>Ba mu sayar da bayanan ku ga wasu kamfanoni. Ana amfani da su ne kawai don inganta nomanku.</Text>
            <Text style={styles.pSub}>3. Tsaro</Text>
            <Text style={styles.pText}>Duk hotunan da aka tura ana kiyaye su ta hanyar rufaffen nishadi (encryption).</Text>
            <TouchableOpacity style={styles.closePrivacy} onPress={() => setPrivacyVisible(false)}>
              <Text style={styles.closePrivacyText}>Na Karanta, Na Gane</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateText: { color: '#888', fontSize: 14 },
  greetingText: { fontSize: 22, fontWeight: 'bold', color: '#1B5E20' },
  mainContent: { padding: 20 },
  weatherCard: { backgroundColor: '#E8F5E9', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  weatherTemp: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20' },
  weatherStatus: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  weatherDesc: { color: '#666', fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionItem: { width: '45%', alignItems: 'center' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 5 },
  actionLabel: { fontWeight: 'bold', color: '#333' },
  resultBox: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5, marginBottom: 100 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 15 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  resultContent: { fontSize: 16, lineHeight: 26, color: '#444' },
  backBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  backBtnText: { color: '#8B4513', fontWeight: 'bold' },
  infoCard: { padding: 40, alignItems: 'center' },
  infoText: { textAlign: 'center', color: '#999', lineHeight: 22 },
  footer: { position: 'absolute', bottom: 0, width: '100%', height: 70, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', elevation: 20 },
  footerItem: { alignItems: 'center' },
  footerText: { fontSize: 12, marginTop: 4 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  confirmBox: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center' },
  confirmTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  confirmImage: { width: '100%', height: 250, borderRadius: 15, marginBottom: 15 },
  confirmInfo: { textAlign: 'center', color: '#666', marginBottom: 20 },
  confirmButtons: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  cancelBtn: { padding: 15, width: '48%', alignItems: 'center' },
  cancelText: { color: 'red', fontWeight: 'bold' },
  confirmBtn: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, width: '48%', alignItems: 'center' },
  confirmBtnText: { color: 'white', fontWeight: 'bold' },
  sideMenu: { position: 'absolute', right: 0, top: 0, width: '70%', height: '100%', backgroundColor: 'white', padding: 30, paddingTop: 60 },
  menuHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, color: '#1B5E20' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', gap: 10 },
  privacyContainer: { flex: 1, backgroundColor: 'white' },
  privacyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#eee' },
  privacyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  pSub: { fontSize: 18, fontWeight: 'bold', color: '#2E7D32', marginTop: 20, marginBottom: 10 },
  pText: { fontSize: 16, color: '#444', lineHeight: 24, marginBottom: 10 },
  closePrivacy: { backgroundColor: '#2E7D32', padding: 15, borderRadius: 10, alignItems: 'center', marginVertical: 40 },
  closePrivacyText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});