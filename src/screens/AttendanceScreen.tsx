import React, {useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useAppDispatch} from '../redux/hooks';
import {useSelector} from 'react-redux';
import {fetchAttendanceLogs} from '../redux/slices/attendanceLogsSlice';
import {RootState} from '../redux/store';
import LinearGradient from 'react-native-linear-gradient';

// Allowed status
type AttendanceStatus = string | 'In' | 'Out';

interface AttendanceRecord {
  date: string; // 'DD.MM.YYYY'
  checkInTime: string; // e.g., '9:00 AM'
  checkOutTime: string; // e.g., '6:00 PM'
  status: AttendanceStatus;
}

// Get Monday to Friday of the current week
const getCurrentWeekDates = (): Date[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Move to Monday

  const dates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    dates.push(currentDate);
  }
  return dates;
};

// testing last week

const getWeekDates = (isLastWeek: boolean = false): Date[] => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7)); // Move to Monday

  // If last week is requested, subtract 7 days
  if (isLastWeek) {
    monday.setDate(monday.getDate() - 7);
  }

  const dates: Date[] = [];
  for (let i = 0; i < 5; i++) {
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + i);
    dates.push(currentDate);
  }
  return dates;
};

// Convert '22.07.2025' to '2025-07-22'
const convertToISODate = (dateStr: string): string => {
  const [day, monthName, year] = dateStr.split('/');
  const monthMap:{[key: string] : string} = {
    Jan:"01",
    Feb:"02",
    Mar:"03",
    Apr:'04',
    May:'05',
    Jun:'06',
    Jul:'07',
    Aug:'08',
    Sep:'09',
    Oct:'10',
    Nov:'11',
    Dec:'12'
  }
  const month = monthMap[monthName];
  return `${year}-${month}-${day.padStart(2, '0')}`;
};

// Filter records to this week's Mon–Fri up to yesterday
const filterAttendance = (data: any[]): any[] => {
  if (!Array.isArray(data)) return [];

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const weekDates = getCurrentWeekDates();
  //const weekDates = getWeekDates(true)
  const filteredDates = weekDates.filter(date => date <= yesterday);
  const filteredDatesStr = filteredDates.map(date =>
    date.toISOString().split('T')[0]
  );

  return data.filter(log => {
    const logISODate = convertToISODate(log.date); // convert for comparison
    return filteredDatesStr.includes(logISODate);
  });
};

const AttendanceScreen: React.FC = () => {
  const dispatch = useAppDispatch();

  const {attendanceLogs = [], status, error} = useSelector(
    (state: RootState) => state.attendanceLogs || {},
  );

  const logs = useSelector(
    (state: RootState) => state.attendanceLogs.attendanceLogs || [],
  );

  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const employeeId = user?.nsUserInfo?.employeeId;
    if (employeeId) {
      const today = new Date();
      const fromDate = new Date(today);
      fromDate.setDate(today.getDate() - 7); // Last 7 days

      dispatch(
        fetchAttendanceLogs({
          fromDate: fromDate.toISOString(),
          toDate: today.toISOString(),
          employeeId: employeeId.toString(),
        }),
      );
    }
  }, [user]);

  const filteredData: AttendanceRecord[] = filterAttendance(logs);


  const renderItem = ({item}: {item: AttendanceRecord}) => {
    const [day, month, year] = item.date.split('/');
    console.log(item.date,"itemdate");
    
  const dateObj = new Date(`${year}-${month}-${day}`);
  
  const formattedDate = `${day}-${month}-${year}`;

    return (
      <View style={styles.row}>
        <Text style={styles.cell}>{`${formattedDate}`}</Text>
        <Text style={styles.cell}>{item.checkInTime}</Text>
        <Text style={styles.cell}>{item.checkOutTime}</Text>
        <Text style={styles.cell}>{item.status}</Text>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#8686AC', '#272757']}
      locations={[0, 0.15]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredData}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.date}-${item.checkInTime}-${index}`}
        ListHeaderComponent={
          <>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Attendance Logs</Text>
            </View>
            <View style={styles.headerRow}>
              <Text style={styles.headerCell}>Date</Text>
              <Text style={styles.headerCell}>Check-In</Text>
              <Text style={styles.headerCell}>Check-Out</Text>
              <Text style={styles.headerCell}>Status</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          status === 'loading' ? (
            <ActivityIndicator size="large" color="#0093dd" />
          ) : (
            <Text style={{textAlign: 'center', marginTop: 20, color: 'black'}}>
              {status === 'failed' ? error : 'No records found.'}
            </Text>
          )
        }
      />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: 'transparent',
  },
  titleContainer: {
    backgroundColor: 'transparent',
    padding: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 10,
  },
  headerCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#272757',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    color: '#FFFFFF',
  },
  cell: {
    flex: 1,
    color: '#FFFFFF',
    justifyContent: 'center',
    textAlign: 'center',
  },
});

export default AttendanceScreen;

