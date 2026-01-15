import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { House, ListChecks, CheckSquareOffset } from 'phosphor-react-native';
import { COLORS } from '../theme/colors';

import { BottomTabBarProps, } from '@react-navigation/bottom-tabs';


const icons = {
  PendingActivities: ListChecks,
  Home: House,
  DoActivities: CheckSquareOffset,
};


type IconRouteName = keyof typeof icons;

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.tabBarContainer}>
      {state.routes.map((route, index) => {
        
        const iconName = route.name as IconRouteName;
        const Icon = icons[iconName];

        // Se, por algum motivo, a rota não tiver um ícone, não renderizamos nada para evitar erros.
        if (!Icon) {
          return null;
        }

        const { options } = descriptors[route.key];
        const isFocused = state.index === index;
        const color = isFocused ? COLORS.primaryBlue : COLORS.textLight;

        
        const label = options.tabBarLabel !== undefined
            ? typeof options.tabBarLabel === 'function'
              ? options.tabBarLabel({
                  focused: isFocused,
                  color,
                  position: 'below-icon' , // Adicionado para satisfazer o tipo
                  children: options.title ?? route.name, // Adicionado para satisfazer o tipo
                })
              : options.tabBarLabel
            : options.title ?? route.name;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
          >
            {isFocused && (
              <View style={styles.activeIndicator} />
            )}
            <Icon
              color={color}
              weight={isFocused ? 'fill' : 'regular'}
              size={isFocused ? 30 : 26}
            />
            <Text style={[styles.tabLabel, { color }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 35 : 25,
    left: 85,
    right: 85,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 35,
    height: 70,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: 'rgba(200, 200, 200, 0.5)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryBlue,
  },
});

export default CustomTabBar;

