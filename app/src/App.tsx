import './types';

import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  GestureHandlerRootView,
  RectButton,
} from 'react-native-gesture-handler';
import {
  NativeStackNavigationProp,
  createNativeStackNavigator,
} from '@react-navigation/native-stack';
import { NavigationContainer, PathConfigMap } from '@react-navigation/native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXAMPLES } from './examples';
import React from 'react';

type RootStackParamList = { [P in keyof typeof EXAMPLES]: undefined } & {
  Home: undefined;
};

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
}

const EXAMPLES_NAMES = Object.keys(EXAMPLES) as (keyof typeof EXAMPLES)[];

function findExamples(search: string) {
  if (search === '') {
    return EXAMPLES_NAMES;
  }
  return EXAMPLES_NAMES.filter((name) =>
    EXAMPLES[name].title
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase())
  );
}

function HomeScreen({ navigation }: HomeScreenProps) {
  const [search, setSearch] = React.useState('');

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerSearchBarOptions: {
        onChangeText: (event) => {
          setSearch(event.nativeEvent.text);
        },
        onSearchButtonPress: (event) => {
          const results = findExamples(event.nativeEvent.text);
          if (results.length >= 1) {
            navigation.navigate(results[0]);
          }
        },
      },
      headerTransparent: false,
    });
  }, [navigation]);

  return (
    <FlatList
      data={findExamples(search)}
      initialNumToRender={EXAMPLES_NAMES.length}
      renderItem={({ item: name }) => (
        <Item
          icon={EXAMPLES[name].icon}
          title={EXAMPLES[name].title}
          onPress={() => navigation.navigate(name)}
        />
      )}
      renderScrollComponent={(props) => <ScrollView {...props} />}
      ItemSeparatorComponent={ItemSeparator}
      style={styles.list}
    />
  );
}

interface ItemProps {
  icon?: string;
  title: string;
  onPress: () => void;
}

function Item({ icon, title, onPress }: ItemProps) {
  return (
    <RectButton style={styles.button} onPress={onPress}>
      {icon && <Text style={styles.title}>{icon + '  '}</Text>}
      <Text style={styles.title}>{title}</Text>
    </RectButton>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [],
  config: {
    screens: EXAMPLES_NAMES.reduce<PathConfigMap<RootStackParamList>>(
      (acc, name) => {
        acc[name] = name;
        return acc;
      },
      { Home: '' }
    ),
  },
};

// copied from https://reactnavigation.org/docs/state-persistence/
const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';

export default function App() {
  const [isReady, setIsReady] = React.useState(__DEV__ ? false : true);
  const [initialState, setInitialState] = React.useState();

  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== 'web' && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setIsReady(true);
      }
    };

    if (!isReady) {
      restoreState();
    }
  }, [isReady]);

  if (!isReady) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <NavigationContainer
        linking={linking}
        initialState={initialState}
        onStateChange={(state) =>
          AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state))
        }>
        <Stack.Navigator>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerTitle: '🐎 Reanimated examples',
              title: 'Reanimated examples',
            }}
          />
          {EXAMPLES_NAMES.map((name) => (
            <Stack.Screen
              key={name}
              name={name}
              component={EXAMPLES[name].screen}
              options={{
                headerTitle: EXAMPLES[name].title,
                title: EXAMPLES[name].title,
              }}
            />
          ))}
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    backgroundColor: '#EFEFF4',
  },
  separator: {
    height: 1,
    backgroundColor: '#DBDBE0',
  },
  button: {
    flex: 1,
    height: 60,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 16,
    color: 'black',
  },
});
