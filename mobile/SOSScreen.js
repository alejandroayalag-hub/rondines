import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Animated, Vibration, TextInput
} from 'react-native';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { alertasAPI, turnosAPI } from '../services/api';
import { colors, typography, spacing, radius } from '../theme/tokens';

export default function SOSScreen({ navigation }) {
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [nota, setNota] = useState('');
  const [turnoActivo, setTurnoActivo] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);

  useEffect(() => {
    turnosAPI.getActivo().then(r => setTurnoActivo(r.data.turno)).catch(() => {});
    return () => pulseLoop.current?.stop();
  }, []);

  const startPulse = () => {
    pulseLoop.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    pulseLoop.current.start();
  };

  const handleSOS = () => {
    Alert.alert(
      '🚨 ALERTA DE EMERGENCIA',
      '¿Confirmas que necesitas ayuda urgente? Se notificará a todos los supervisores.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'SÍ, ENVIAR SOS',
          style: 'destructive',
          onPress: enviarSOS,
        }
      ]
    );
  };

  const enviarSOS = async () => {
    setEnviando(true);
    startPulse();
    Vibration.vibrate([0, 300, 100, 300, 100, 300]);

    let coords = null;
    try {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      coords = loc.coords;
    } catch (_) {}

    try {
      await alertasAPI.enviarSOS({
        turno_id: turnoActivo?.id,
        latitud: coords?.latitude,
        longitud: coords?.longitude,
        mensaje: nota.trim() || undefined,
      });

      pulseLoop.current?.stop();
      setEnviado(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      pulseLoop.current?.stop();
      Alert.alert('Error', 'No se pudo enviar la alerta. Llama directamente a tu supervisor.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <View style={[styles.container, styles.center]}>
        <View style={styles.successRing}>
          <Ionicons name="checkmark" size={60} color={colors.primary} />
        </View>
        <Text style={styles.successTitle}>Alerta Enviada</Text>
        <Text style={styles.successText}>
          Todos los supervisores han sido notificados de tu emergencia.
          Mantente en un lugar seguro.
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.textSecond} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alerta de Emergencia</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Botón SOS */}
        <View style={styles.sosWrapper}>
          <Animated.View style={[styles.sosRingOuter, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.sosRingInner}>
              <TouchableOpacity
                style={styles.sosBtn}
                onPress={enviando ? undefined : handleSOS}
                activeOpacity={0.8}
                disabled={enviando}
              >
                {enviando ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <>
                    <Ionicons name="warning" size={48} color="#fff" />
                    <Text style={styles.sosBtnText}>SOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <Text style={styles.sosLabel}>
          {enviando ? 'Enviando alerta de emergencia...' : 'Presiona el botón para solicitar ayuda urgente'}
        </Text>

        {/* Nota opcional */}
        {!enviando && (
          <View style={styles.notaContainer}>
            <Text style={styles.notaLabel}>Descripción de la emergencia (opcional)</Text>
            <TextInput
              style={styles.notaInput}
              placeholder="Ej: Persona sospechosa en almacén norte..."
              placeholderTextColor={colors.textMuted}
              value={nota}
              onChangeText={setNota}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        )}

        {/* Aviso */}
        <View style={styles.aviso}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
          <Text style={styles.avisoText}>
            Al presionar SOS, tu ubicación GPS y la hora exacta serán registradas y enviadas a todos los supervisores activos.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: typography.semibold },
  content: { flex: 1, padding: spacing.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.xl },

  sosWrapper: { alignItems: 'center', justifyContent: 'center' },
  sosRingOuter: {
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(255, 59, 92, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  sosRingInner: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255, 59, 92, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255, 59, 92, 0.3)',
  },
  sosBtn: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
    gap: 4,
    elevation: 12,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  sosBtnText: { color: '#fff', fontSize: typography.xxl, fontWeight: typography.black, letterSpacing: 4 },
  sosLabel: { color: colors.textSecond, fontSize: typography.sm, textAlign: 'center', maxWidth: 280 },

  notaContainer: { width: '100%', gap: spacing.sm },
  notaLabel: { color: colors.textSecond, fontSize: typography.xs, letterSpacing: 1, textTransform: 'uppercase' },
  notaInput: { backgroundColor: colors.bgCard, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, color: colors.textPrimary, padding: spacing.md, fontSize: typography.sm, textAlignVertical: 'top', minHeight: 80 },

  aviso: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  avisoText: { flex: 1, color: colors.textMuted, fontSize: typography.xs, lineHeight: 18 },

  successRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryGlow, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  successTitle: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: typography.bold },
  successText: { color: colors.textSecond, fontSize: typography.base, textAlign: 'center', lineHeight: 24 },
  backBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  backBtnText: { color: colors.bg, fontWeight: typography.bold },
});
