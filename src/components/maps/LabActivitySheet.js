import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const getSessionName = (session) =>
  session?.namaPraktikum ||
  session?.topikMateri ||
  session?.name ||
  session?.courseName ||
  session?.subject ||
  'Sesi Laboratorium';

const getSessionTime = (session) => {
  if (!session) return '-';
  const start = session.jamMulai || session.startTime || session.start || '';
  const end = session.jamSelesai || session.endTime || session.end || '';
  if (start && end) return `${start} - ${end}`;
  return start || end || 'Waktu belum ditentukan';
};

const getSessionStatus = (session) => {
  if (!session) return 'Tidak tersedia';
  const status = session.statusSesi || session.status || 'Terjadwal';
  if (status === 'open' || status === 'DIBUKA') return 'Sedang Berlangsung';
  if (status === 'closed' || status === 'DITUTUP') return 'Sesi Ditutup';
  if (status === 'SELESAI') return 'Selesai';
  return status.toString().replace(/_/g, ' ');
};

const SessionCard = ({ session, title, icon }) => (
  <View style={styles.sessionCard}>
    <View style={styles.sessionHeader}>
      <Ionicons name={icon} size={19} color="#2F625B" />
      <Text style={styles.sessionTitle}>{title}</Text>
    </View>
    {session ? (
      <>
        <Text style={styles.sessionName}>{getSessionName(session)}</Text>
        <Text style={styles.sessionDetail}><Ionicons name="time-outline" size={14} /> {getSessionTime(session)}</Text>
        <View style={styles.statusBadge}><Text style={styles.statusText}>{getSessionStatus(session)}</Text></View>
      </>
    ) : (
      <Text style={styles.emptyText}>Belum ada jadwal sesi.</Text>
    )}
  </View>
);

// Menampilkan sesi aktif dan jadwal berikutnya dari laboratorium terpilih.
const LabActivitySheet = ({
  lab,
  currentSession,
  nextSession,
  onClose,
}) => {
  if (!lab) return null;

  return (
    <View style={styles.container}>
      <View style={styles.handle} />

      <View style={styles.header}>
        <View style={styles.labInfo}>
          <Text style={styles.labName}>
            {lab.name || lab.labName || 'Laboratorium'}
          </Text>

          <Text style={styles.labLocation}>
            {typeof lab.location === 'string'
              ? lab.location
              : lab.address ||
                lab.ruangLab ||
                lab.building ||
                (Number.isFinite(Number(lab.latitude))
                  ? `Koordinat: ${Number(lab.latitude).toFixed(4)}, ${Number(lab.longitude).toFixed(4)}`
                  : 'Lokasi laboratorium')}
          </Text>
        </View>

        {onClose ? (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color="#263634" />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <SessionCard
          session={currentSession}
          title="Sesi Berlangsung"
          icon="play-circle-outline"
        />

        <SessionCard
          session={nextSession}
          title="Sesi Berikutnya"
          icon="calendar-outline"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 20,
    paddingTop: 10,
    maxHeight: 380,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  labInfo: {
    flex: 1,
  },
  labName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#263634',
  },
  labLocation: {
    fontSize: 12,
    color: '#737373',
    marginTop: 4,
  },
  closeButton: {
    padding: 6,
  },
  sessionCard: {
    backgroundColor: '#F5F3EE',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 10,
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F625B',
  },
  sessionName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#263634',
    marginBottom: 8,
  },
  sessionDetail: {
    fontSize: 12,
    color: '#555555',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCE9C9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 10,
  },
  statusText: {
    fontSize: 11,
    color: '#2F625B',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyText: {
    fontSize: 12,
    color: '#737373',
  },
});

export default LabActivitySheet;
