import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, Image,
  ActivityIndicator, TextInput, Modal, Dimensions, Alert, KeyboardAvoidingView, Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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
  const [userName, setUserName] = useState('');
  const [question, setQuestion] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [privacyVisible, setPrivacyVisible] = useState(false);

  // Real-time Weather State
  const [weather, setWeather] = useState({ temp: '--°C', status: 'Loading...', icon: 'cloud-outline' });

  // Date & Time
  const now = new Date();
  const dateString = now.toLocaleDateString('ha-NG', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    // Saita sunan mai amfani daga Firebase
    const user = auth.currentUser;
    if (user) {
      const name = user.displayName || user.email?.split('@')[0] || 'Manomi';
      setUserName(name.charAt(0).toUpperCase() + name.slice(1));
    }

    // Saita gaisuwa dangane da lokaci
    const hours = now.getHours();
    if (hours < 12) setGreeting('Barka da Safiya');
    else if (hours < 16) setGreeting('Barka da Rana');
    else setGreeting('Barka da Yamma');

    fetchWeather();
  }, []);

  const fetchWeather = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setWeather({ temp: '32°C', status: 'Babu Izini', icon: 'sunny' });
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const data = await response.json();
      const temp = Math.round(data.current_weather.temperature);
      const code = data.current_weather.weathercode;

      let statusText = 'Hasken Rana';
      let iconName = 'sunny';
      if (code > 0 && code < 45) { statusText = 'Akwai Gajimare'; iconName = 'cloud'; }
      else if (code >= 45) { statusText = 'Ana Ruwa'; iconName = 'rainy'; }

      setWeather({ temp: `${temp}°C`, status: statusText, icon: iconName });
    } catch (error) {
      setWeather({ temp: '30°C', status: 'Haske', icon: 'sunny' });
    }
  };

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
    const options: ImagePicker.ImagePickerOptions = {
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.3,
      base64: true,
    };

    if (mode === 'camera') {
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
      setBase64Image(result.assets[0].base64 || null);
      setShowConfirmModal(true);
    }
  };

  const startAnalysis = async () => {
    if (!base64Image && !question.trim()) {
      Alert.alert("Tsanaki", "Don Allah ɗauki hoto ko ka rubuta tambaya.");
      return;
    }

    setShowConfirmModal(false);
    setLoading(true);
    setResult('');

    try {
      // GYARA: Tura "" maimakon null don magance 422 error
      const payload = {
        image_data: base64Image || "",
        text_query: question.trim() || ""
      };

      const response = await fetch('https://farmermobile.onrender.com/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.analysis);
        const user = auth.currentUser;
        if (user) {
          await addDoc(collection(db, "history"), {
            userId: user.uid,
            image: base64Image ? `data:image/jpeg;base64,${base64Image}` : null,
            question: question || null,
            result: data.analysis,
            createdAt: serverTimestamp(),
          });
        }
        Speech.speak(data.analysis, { language: 'ha', pitch: 1.0, rate: 0.9 });
        setQuestion('');
      } else {
        throw new Error(data.detail || "Server error");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Matsala", "Ba a samu damar tuntuɓar FarmerAI ba.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#F1F8E9' }}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.dateText}>{dateString}</Text>
          <Text style={styles.greetingText}>{greeting}, {userName}</Text>
        </View>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-vertical" size={28} color="#1B5E20" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.weatherCard}>
          <View>
            <Text style={styles.weatherTemp}>{weather.temp}</Text>
            <Text style={styles.weatherStatus}>{weather.status}</Text>
            <Text style={styles.weatherDesc}>Yanayin lokacin yanzu</Text>
          </View>
          <Ionicons name={weather.icon as any} size={50} color="#FFA000" />
        </View>

        {!result && !loading && (
          <View style={styles.infoCardTop}>
            <Text style={styles.infoText}>
              FarmerAI zai taimake ka gano cutar shuka da kuma ingancin ƙasar gonarka.
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={styles.loadingText}>FarmerAI yana nazari, dakata kadan...</Text>
          </View>
        )}

        <View style={styles.questionSection}>
          <Text style={styles.sectionTitle}>Menene matsalar ka yau? ✍️</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Rubuta tambayarka anan..."
            placeholderTextColor="#999"
            multiline
            value={question}
            onChangeText={setQuestion}
          />
          {question.length > 0 && !loading && (
            <TouchableOpacity style={styles.sendTextBtn} onPress={startAnalysis}>
              <Text style={styles.sendTextBtnText}>Tambayi FarmerAI</Text>
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionTitle}>Binciken Hoto 📷</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionItem} onPress={() => pickImage('camera')} disabled={loading}>
            <View style={[styles.iconCircle, { backgroundColor: '#2E7D32' }]}>
              <Ionicons name="camera" size={30} color="white" />
            </View>
            <Text style={styles.actionLabel}>Duba Shuka</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem} onPress={() => pickImage('library')} disabled={loading}>
            <View style={[styles.iconCircle, { backgroundColor: '#8B4513' }]}>
              <MaterialCommunityIcons name="image-filter-center-focus" size={30} color="white" />
            </View>
            <Text style={styles.actionLabel}>Hoton Gona</Text>
          </TouchableOpacity>
        </View>

        {result && (
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
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer Container */}
      <View style={styles.footerContainer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerAppName}>FarmerAI</Text>
          <Text style={styles.footerMotto}>Abokin Manomi na Kwarai 🌿</Text>
        </View>
        <View style={styles.footerTabs}>
          <TouchableOpacity style={styles.footerItem}>
            <Ionicons name="home" size={22} color="#2E7D32" />
            <Text style={[styles.footerText, { color: '#2E7D32' }]}>Gida</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem} onPress={() => router.push('/history')}>
            <Ionicons name="leaf" size={22} color="#999" />
            <Text style={styles.footerText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Ionicons name="chatbubbles" size={22} color="#999" />
            <Text style={styles.footerText}>Shawara</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerItem}>
            <Ionicons name="person" size={22} color="#999" />
            <Text style={styles.footerText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals remained the same */}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  dateText: { color: '#888', fontSize: 13 },
  greetingText: { fontSize: 20, fontWeight: 'bold', color: '#1B5E20' },
  mainContent: { padding: 20 },
  weatherCard: { backgroundColor: '#E8F5E9', borderRadius: 20, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  weatherTemp: { fontSize: 32, fontWeight: 'bold', color: '#1B5E20' },
  weatherStatus: { fontSize: 18, color: '#2E7D32', fontWeight: 'bold' },
  weatherDesc: { color: '#666', fontSize: 12 },
  infoCardTop: { paddingVertical: 10, paddingHorizontal: 5, marginBottom: 20 },
  infoText: { textAlign: 'left', color: '#555', lineHeight: 20, fontSize: 14 },
  loadingContainer: { alignItems: 'center', marginVertical: 20 },
  loadingText: { marginTop: 10, color: '#2E7D32', fontWeight: 'bold' },
  questionSection: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 25, elevation: 3 },
  textInput: { height: 80, textAlignVertical: 'top', color: '#333', fontSize: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sendTextBtn: { backgroundColor: '#2E7D32', flexDirection: 'row', padding: 10, borderRadius: 10, alignSelf: 'flex-end', marginTop: 10, alignItems: 'center', gap: 5 },
  sendTextBtnText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  actionItem: { width: '45%', alignItems: 'center' },
  iconCircle: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 5 },
  actionLabel: { fontWeight: 'bold', color: '#333' },
  resultBox: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5, marginBottom: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10, marginBottom: 15 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#1B5E20' },
  resultContent: { fontSize: 16, lineHeight: 26, color: '#444' },
  backBtn: { marginTop: 20, alignItems: 'center', padding: 10 },
  backBtnText: { color: '#8B4513', fontWeight: 'bold' },
  footerContainer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: 'white', elevation: 25, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  footerTop: { alignItems: 'center', paddingTop: 10, borderBottomWidth: 0.5, borderBottomColor: '#eee', paddingBottom: 5 },
  footerAppName: { fontSize: 16, fontWeight: 'bold', color: '#2E7D32' },
  footerMotto: { fontSize: 10, color: '#666', fontStyle: 'italic' },
  footerTabs: { height: 60, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  footerItem: { alignItems: 'center' },
  footerText: { fontSize: 10, marginTop: 2, color: '#999' },
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