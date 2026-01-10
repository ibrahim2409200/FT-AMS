import React, {useEffect} from 'react';
import {
  createDrawerNavigator,
  DrawerItem,
  DrawerContentComponentProps,
  DrawerNavigationProp,
} from '@react-navigation/drawer';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import LogoutPopUp from './LogoutPopUp';
import {useSelector} from 'react-redux';
import {RootState} from '../redux/store';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {AttendanceScreen} from '../screens';
import Icon from 'react-native-vector-icons/AntDesign';

const Drawer = createDrawerNavigator();

// ✅ Drawer Param List Type
type DrawerParamList = {
  Dashboard: undefined;
  AttendanceScreen: undefined;
};

const SideMenu: React.FC = () => {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );

  const navigation = useNavigation<NavigationProp<any>>();

  useEffect(() => {
    if (!isAuthenticated) {
      AsyncStorage.removeItem('isAuthenticated');
      navigation.navigate('Login');
    }
  }, [isAuthenticated, navigation]);

  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      // ✅ Use correct navigation type in screenOptions
      screenOptions={({navigation}) => {
        const drawerNavigation =
          navigation as DrawerNavigationProp<DrawerParamList>;

        return {
          drawerStyle: {backgroundColor: '#e6f8ff', width: 250},
          headerStyle: {backgroundColor: '#fff', height: 95},
          headerTintColor: '#fff',
          headerTitle: '',
          headerLeft: () => (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              
                
              <TouchableOpacity style={{flexDirection: 'row'}} onPress={() => drawerNavigation.openDrawer()}>
              <Icon
                  name="menu-fold"
                  size={25}
                  color="#0093dd"
                  style={styles.iconHeader}
                />
              </TouchableOpacity>
              <Image
                source={require('../../assets/images/dscLogo.png')}
                style={styles.logoSmall}
              />
              
            </View>
          ),
          headerRight: () => <LogoutPopUp />,
        };
      }}
      drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          drawerLabel: 'Dashboard',
        }}
      />
      <Drawer.Screen
        name="AttendanceScreen"
        component={AttendanceScreen}
        options={{
          drawerLabel: 'Attendance Logs',
        }}
      />
    </Drawer.Navigator>
  );
};

const CustomDrawerContent = (props: DrawerContentComponentProps) => (
  <View style={styles.drawerContainer}>
    <Image
      source={require('../../assets/images/dscLogo.png')}
      style={styles.logo}
    />
    <Text style={styles.drawerTitle}>My App</Text>

    <DrawerItem
      label="Dashboard"
      onPress={() => props.navigation.navigate('Dashboard')}
      style={styles.menuItem}
    />
    <DrawerItem
      label="Attendance Logs"
      onPress={() => props.navigation.navigate('AttendanceScreen')}
      style={styles.menuItem}
    />
  </View>
);

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#e6f8ff',
  },
  iconHeader: {
    marginLeft: 10,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  logoSmall: {
    marginLeft: 10,
    resizeMode: 'contain',
    width: 150,
    height: 60,
  },
  menuItem:{
    color: '#0093dd',
    borderBottomWidth:1
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0093dd',
    marginBottom: 20,
  },
});

export default SideMenu;
