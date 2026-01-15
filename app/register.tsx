import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { auth, db } from '../firebaseConfig'; // Tabbatar path din nan daidai yake
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router'; // Idan kana amfani da Expo Router

export default function RegisterScreen() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!email || !password || !fullName) {
            Alert.alert('Kuskure', 'Da fatan ka cika dukkan wuraren da ake bukata');
            return;
        }

        setLoading(true);
        try {
            // 1. Kirkirar account a Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Adana sunan manomi a Firestore
            await setDoc(doc(db, "users", user.uid), {
                fullName: fullName,
                email: email,
                createdAt: new Date().toISOString(),
            });

            Alert.alert('Nasara!', 'An yi muku rajista cikin nasara.');
            router.replace('/(tabs)'); // Tura manomi zuwa babban shafi
        } catch (error: any) {
            let errorMessage = 'An samu matsala yayin rajista';
            if (error.code === 'auth/email-already-in-use') errorMessage = 'Wannan Email din riga an yi amfani da shi.';
            if (error.code === 'auth/weak-password') errorMessage = 'Kalmar sirri (password) ta yi rauni sosai.';

            Alert.alert('Kuskure', errorMessage);
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerArea}>
                    <Text style={styles.logoText}>FarmerAI 🌿</Text>
                    <Text style={styles.subTitle}>Yi rajista don fara binciken amfanin gona</Text>
                </View>

                <View style={styles.inputArea}>
                    <Text style={styles.label}>Cikakken Suna</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Misali: Musa Aliyu"
                        value={fullName}
                        onChangeText={setFullName}
                    />

                    <Text style={styles.label}>Email (Imel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="manomi@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Kalmar Sirri (Password)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        style={styles.registerButton}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Yi Rajista</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/login')} style={styles.loginLink}>
                        <Text style={styles.loginLinkText}>Kuna da account? <Text style={{ fontWeight: 'bold' }}>Shiga nan</Text></Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FFF9', // Kore mai haske
    },
    scrollContainer: {
        padding: 20,
        justifyContent: 'center',
        flexGrow: 1,
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 50,
    },
    logoText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#2E7D32', // Dark Green
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    inputArea: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        elevation: 3, // Shadow don Android
        shadowColor: '#000', // Shadow don iOS
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    registerButton: {
        backgroundColor: '#2E7D32',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    loginLink: {
        marginTop: 20,
        alignItems: 'center',
    },
    loginLinkText: {
        color: '#2E7D32',
        fontSize: 14,
    },
});