import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Vibration, Animated
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { escaneosAPI, turnosAPI } from '../services/api';
import { colors, typography, spacing, radius } from '../theme/tokens';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ScannerScreen({ navigation }) {
  const [permisoCamara, solicitarPermisoCamara] = useCameraPermissions();
  const [permisoUbicacion, setPermisoUbicacion] = useState(null);
  const [escaneando, setEscaneando] = useState(false);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [resultado, setResultado] = useState(null); // null | 'exito' | 'error'
  const [mensajeResultado, setMensajeResultado] = useState('');
  const [ultimoEscaneo, setUltimoEscaneo] = useState(null);
  const [cooldown, setCooldown] = useState(false); // evita doble escaneo

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    inicializar();
    animarPulso();
  }, []);

  const animarPulso = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  };

  const inicializar = async () => {
    // Permisos de ubicación
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermisoUbicacion(status === 'granted');

    // Turno activo
    try {
      const res = await turnosAPI.getActivo();
      setTurnoActivo(res.data.turno);
    } catch (e) {
      console.log('Sin turno activo');
    }
  };

  const obtenerUbicacion = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 0,
      });
      return loc.coords;
    } catch (e) {
      throw new Error('No se pudo obtener tu ubicación GPS');
    }
  };

  const handleScan = async ({ data: qrCodigo }) => {
    if (escaneando || cooldown || !qrCodigo) return;

    setEscaneando(true);
    setCooldown(true);

    // Vibración de confirmación
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      // 1. Obtener GPS
      const coords = await obtenerUbicacion();

      // 2. Registrar escaneo en backend
      const response = await escaneosAPI.registrar({
        qr_codigo: qrCodigo,
        latitud: coords.latitude,
        longitud: coords.longitude,
        precision_gps: coords.accuracy,
        turno_id: turnoActivo?.id || null,
      });

      const { punto, validacion } = response.data;

      setUltimoEscaneo({
        punto: punto.nombre,
        hora: format(new Date(), 'HH:mm:ss', { locale: es }),
        dentro_rango: validacion.dentro_de_rango,
        distancia: validacion.distancia_metros,
      });

      if (validacion.dentro_de_rango) {
        setResultado('exito');
        setMensajeResultado(`✓ ${punto.nombre}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setResultado('advertencia');
        setMensajeResultado(`⚠ ${punto.nombre}\nFuera de rango: ${validacion.distancia_metros}m`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

    } catch (error) {
      setResultado('error');
      const msg = error.response?.data?.error || error.message || 'Error al registrar escaneo';
      setMensajeResultado(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Vibration.vibrate([0, 200, 100, 200]);
    } finally {
      setEscaneando(false);

      // Ocultar resultado después de 3 segundos
      setTimeout(() => {
        setResultado(null);
        setMensajeResultado('');
        setCooldown(false);
      }, 3000);
    }
  };

  // ── Permisos ──────────────────────────────────────────────
  if (!permisoCamara) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.permText}>Verificando permisos...</Text>
      </View>
    );
  }

  if (!permisoCamara.granted) {
    return (
      <View style={styles.center}>
        <Ionicons name="camera-off-outline" size={60} color={colors.textMuted} />
        <Text style={styles.permTitle}>Cámara requerida</Text>
        <Text style={styles.permText}>Se necesita acceso a la cámara para escanear los códigos QR.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={solicitarPermisoCamara}>
          <Text style={styles.permBtnText}>Conceder permiso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const colorResultado = resultado === 'exito' ? colors.primary
    : resultado === 'advertencia' ? colors.warning
    : colors.danger;

  return (
    <View style={styles.container}>
      {/* Cámara */}
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={cooldown ? undefined : handleScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        {/* Overlay oscuro con ventana de escaneo */}
        <View style={styles.overlay}>

          {/* Header */}
          <View style={styles.cameraHeader}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.cameraTitle}>Escanear Punto</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Marco QR animado */}
          <View style={styles.scanArea}>
            <Animated.View style={[styles.scanFrame, { transform: [{ scale: pulseAnim }] }]}>
              {/* Esquinas del marco */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />

              {escaneando && (
                <ActivityIndicator color={colors.primary} size="large" />
              )}
            </Animated.View>

            <Text style={styles.scanHint}>
              Apunta al código QR del punto de rondín
            </Text>
          </View>

          {/* Resultado del escaneo */}
          {resultado && (
            <View style={[styles.resultado, { borderColor: colorResultado, backgroundColor: `${colorResultado}20` }]}>
              <Ionicons
                name={resultado === 'exito' ? 'checkmark-circle' : resultado === 'advertencia' ? 'alert-circle' : 'close-circle'}
                size={28}
                color={colorResultado}
              />
              <Text style={[styles.resultadoText, { color: colorResultado }]}>
                {mensajeResultado}
              </Text>
            </View>
          )}

          {/* Último escaneo */}
          {ultimoEscaneo && !resultado && (
            <View style={styles.ultimoEscaneo}>
              <Text style={styles.ultimoLabel}>Último escaneo</Text>
              <Text style={styles.ultimoPunto}>{ultimoEscaneo.punto}</Text>
              <Text style={styles.ultimoHora}>{ultimoEscaneo.hora}</Text>
            </View>
          )}

          {/* Status GPS y turno */}
          <View style={styles.statusBar}>
            <View style={styles.statusItem}>
              <Ionicons
                name="location"
                size={14}
                color={permisoUbicacion ? colors.primary : colors.danger}
              />
              <Text style={styles.statusText}>
                GPS {permisoUbicacion ? 'activo' : 'sin permiso'}
              </Text>
            </View>
            <View style={styles.statusItem}>
              <Ionicons
                name="time-outline"
                size={14}
                color={turnoActivo ? colors.primary : colors.warning}
              />
              <Text style={styles.statusText}>
                {turnoActivo ? 'Turno activo' : 'Sin turno'}
              </Text>
            </View>
          </View>

        </View>
      </CameraView>
    </View>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md },
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'space-between', paddingBottom: 40 },

  cameraHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md, paddingTop: 56 },
  backBtn: { width: 40, height: 40, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cameraTitle: { color: colors.textPrimary, fontSize: typography.md, fontWeight: typography.semibold },

  scanArea: { alignItems: 'center', gap: spacing.lg },
  scanFrame: {
    width: FRAME_SIZE, height: FRAME_SIZE,
    alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: colors.primary,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  scanHint: { color: 'rgba(255,255,255,0.7)', fontSize: typography.sm, textAlign: 'center' },

  resultado: { marginHorizontal: spacing.lg, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  resultadoText: { flex: 1, fontWeight: typography.semibold, fontSize: typography.base },

  ultimoEscaneo: { marginHorizontal: spacing.lg, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  ultimoLabel: { color: colors.textMuted, fontSize: typography.xs, letterSpacing: 1, textTransform: 'uppercase' },
  ultimoPunto: { color: colors.textPrimary, fontWeight: typography.semibold, fontSize: typography.md, marginTop: 2 },
  ultimoHora: { color: colors.primary, fontSize: typography.sm, marginTop: 2 },

  statusBar: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg },
  statusItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  statusText: { color: 'rgba(255,255,255,0.8)', fontSize: typography.xs },

  permTitle: { color: colors.textPrimary, fontSize: typography.lg, fontWeight: typography.bold, textAlign: 'center' },
  permText: { color: colors.textSecond, fontSize: typography.sm, textAlign: 'center' },
  permBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: radius.md },
  permBtnText: { color: colors.bg, fontWeight: typography.bold },
});
