import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  FlatList,
} from 'react-native';
import { projectsAPI } from '../services/api';

export default function ProjectDetailScreen({ route, navigation }) {
  const { projectId } = route.params;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const data = await projectsAPI.getById(projectId);
      setProject(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load project');
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStackPress = (stack) => {
    navigation.navigate('Chat', {
      projectId: projectId,
      stackId: stack.id,
      stackName: stack.name,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.centerContainer}>
        <Text>Project not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PROJECT</Text>
          <Text style={styles.projectName}>{project.name}</Text>
          {project.client && (
            <Text style={styles.detail}>Client: {project.client}</Text>
          )}
          {project.deadline && (
            <Text style={styles.detail}>
              Deadline: {new Date(project.deadline).toLocaleDateString()}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECTIONS</Text>
          {project.stacks && project.stacks.length > 0 ? (
            <FlatList
              data={project.stacks}
              scrollEnabled={false}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.stackCard}
                  onPress={() => handleStackPress(item)}
                >
                  <Text style={styles.stackName}>{item.name}</Text>
                  {item.description && (
                    <Text style={styles.stackDescription}>{item.description}</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles.emptyText}>No sections available</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
    letterSpacing: 1,
  },
  projectName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12,
  },
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stackCard: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  stackName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  stackDescription: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
