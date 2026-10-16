import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { turnosAPI, escaneosAPI } from '../services/api';
import { colors, typography, spacing, radius, shadows } from '../theme/tokens';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HomeScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [escaneos, setEscaneos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accionando, setAccionando] = useState(false);

  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [])
  );

  const cargarDatos = async () => {
    try {
      const [turnoRes, escaneosRes] = await Promise.all([
        turnosAPI.getActivo(),
        escaneosAPI.getMisEscaneos(),
      ]);
      setTurnoActivo(turnoRes.data.turno);
      setEscaneos(escaneosRes.data.escaneos || []);
    } catch (e) {
      console.log('Error cargando datos:', e.message);
    } finally {
      setCargando(false);
      setRefreshing(false);
    }
  };

  const handleIniciarTurno = () => {
    Alert.alert('Iniciar Turno', '¿Confirmas que quieres iniciar tu turno ahora?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Iniciar', onPress: async () => {
          setAccionando(true);
          try {
            await turnosAPI.iniciar();
            await cargarDatos();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'No se pudo iniciar el turno');
          } finally {
            setAccionando(false);
          }
        }
      }
    ]);
  };

  const handleTerminarTurno = () => {
    Alert.alert('Terminar Turno', '¿Confirmas que quieres terminar tu turno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Terminar', style: 'destructive', onPress: async () => {
          setAccionando(true);
          try {
            await turnosAPI.terminar();
            setTurnoActivo(null);
            await cargarDatos();
          } catch (e) {
            Alert.alert('Error', e.response?.data?.error || 'No se pudo terminar el turno');
          } finally {
            setAccionando(false);
          }
        }
      }
    ]);
  };

  const tiempoTurno = () => {
    if (!turnoActivo) return '--:--';
    const inicio = new Date(turnoActivo.inicio);
    const ahora = new Date();
    const mins = Math.floor((ahora - inicio) / 60000);
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return `${hrs.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargarDatos(); }} tintColor={colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bienvenido,</Text>
          <Text style={styles.nombre}>{usuario?.nombre?.split(' ')[0]}</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={22} color={colors.textSecond} />
        </TouchableOpacity>
      </View>

      {/* Estado del turno */}
      <View style={[styles.turnoCard, turnoActivo ? styles.turnoActivo : styles.turnoInactivo]}>
        <View style={styles.turnoHeader}>
          <View style={[styles.dot, { backgroundColor: turnoActivo ? colors.primary : colors.textMuted }]} />
          <Text style={styles.turnoLabel}>
            {turnoActivo ? 'TURNO EN CURSO' : 'SIN TURNO ACTIVO'}
          </Text>
        </View>

        {turnoActivo && (
          <View style={styles.turnoTimer}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.timerText}>{tiempoTurno()} hrs</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.turnoBtn, turnoActivo ? styles.btnTerminar : styles.btnIniciar]}
          onPress={turnoActivo ? handleTerminarTurno : handleIniciarTurno}
          disabled={accionando}
          activeOpacity={0.85}
        >
          {accionando ? (
            <ActivityIndicator color={turnoActivo ? colors.danger : colors.bg} size="small" />
          ) : (
            <>
              <Ionicons
                name={turnoActivo ? 'stop-circle-outline' : 'play-circle-outline'}
                size={20}
                color={turnoActivo ? colors.danger : colors.bg}
              />
              <Text style={[styles.turnoBtnText, { color: turnoActivo ? colors.danger : colors.bg }]}>
                {turnoActivo ? 'Terminar Turno' : 'Iniciar Turno'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Acciones rápidas */}
      <Text style={styles.sectionTitle}>Acciones</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionPrimary, !turnoActivo && styles.actionDisabled]}
          onPress={() => navigation.navigate('Scanner')}
          disabled={!turnoActivo}
          activeOpacity={0.85}
        >
          <View style={styles.actionIcon}>
            <Ionicons name="qr-code-outline" size={32} color={turnoActivo ? colors.primary : colors.textMuted} />
          </View>
          <Text style={[styles.actionLabel, !turnoActivo && { color: colors.textMuted }]}>
            Escanear QR
          </Text>
          {!turnoActivo && (
            <Text style={styles.actionHint}>Inicia turno primero</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionDanger]}
          onPress={() => navigation.navigate('SOS')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIcon, { backgroundColor: colors.dangerGlow }]}>
            <Ionicons name="warning-outline" size={32} color={colors.danger} />
          </View>
          <Text style={[styles.actionLabel, { color: colors.danger }]}>Alerta SOS</Text>
        </TouchableOpacity>
      </View>

      {/* Últimos escaneos del día */}
      <Text style={styles.sectionTitle}>Escaneos de hoy ({escaneos.length})</Text>
      {escaneos.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="scan-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Sin escaneos registrados hoy</Text>
        </View>
      ) : (
        escaneos.slice(0, 10).map((e) => (
          <View key={e.id} style={styles.escaneoItem}>
            <View style={[styles.escaneoIndicator, { backgroundColor: e.dentro_de_rango ? colors.primary : colors.warning }]} />
            <View style={styles.escaneoInfo}>
              <Text style={styles.esPunto}>{e.punto_nombre}</Text>
              <Text style={styles.esHora}>
                {format(new Date(e.timestamp), 'HH:mm:ss', { locale: es })}
              </Text>
            </View>
            <Ionicons
              name={e.dentro_de_rango ? 'checkmark-circle' : 'alert-circle'}
              size={20}
              color={e.dentro_de_rango ? colors.primary : colors.warning}
            />
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  greeting: { color: colors.textSecond, fontSize: typography.sm, letterSpacing: 1 },
  nombre: { color: colors.textPrimary, fontSize: typography.xl, fontWeight: typography.bold },
  logoutBtn: { padding: spacing.sm, backgroundColor: colors.bgCard, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },

  turnoCard: { borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1 },
  turnoActivo: { backgroundColor: colors.primaryGlow, borderColor: colors.primary },
  turnoInactivo: { backgroundColor: colors.bgCard, borderColor: colors.border },
  turnoHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  turnoLabel: { color: colors.textSecond, fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 2 },
  turnoTimer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  timerText: { color: colors.primary, fontSize: typography.xxl, fontWeight: typography.bold, fontVariant: ['tabular-nums'] },
  turnoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, borderWidth: 1.5 },
  btnIniciar: { backgroundColor: colors.primary, borderColor: colors.primary },
  btnTerminar: { backgroundColor: 'transparent', borderColor: colors.danger },
  turnoBtnText: { fontWeight: typography.bold, fontSize: typography.base, letterSpacing: 1 },

  sectionTitle: { color: colors.textSecond, fontSize: typography.xs, fontWeight: typography.bold, letterSpacing: 2, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.sm },

  actionsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  actionBtn: { flex: 1, backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
  actionPrimary: { borderColor: colors.border },
  actionDanger: { borderColor: colors.dangerGlow },
  actionDisabled: { opacity: 0.5 },
  actionIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryGlow, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: colors.textPrimary, fontWeight: typography.semibold, fontSize: typography.sm, textAlign: 'center' },
  actionHint: { color: colors.textMuted, fontSize: typography.xs, textAlign: 'center' },

  emptyCard: { backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.xl, alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
  emptyText: { color: colors.textMuted, fontSize: typography.sm },

  escaneoItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgCard, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md, borderWidth: 1, borderColor: colors.border },
  escaneoIndicator: { width: 4, height: 40, borderRadius: 2 },
  escaneoInfo: { flex: 1 },
  esPunto: { color: colors.textPrimary, fontWeight: typography.semibold, fontSize: typography.sm },
  esHora: { color: colors.textMuted, fontSize: typography.xs, marginTop: 2 },
});
