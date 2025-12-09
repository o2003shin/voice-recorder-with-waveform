import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Directory, File, Paths } from 'expo-file-system';

interface Recording {
  uri: string,
  name: string
}

export default function Index() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [permissions, setPermissions] = useState<boolean>(false);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const [audioFiles, setAudioFiles] = useState<Recording[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>('');
  const player = useAudioPlayer();

  useEffect(() => {
    loadRecordings();
  }, []);

  const loadRecordings = () => {
    try {
      const recordingsPath = Paths.document.uri + '/recordings/';
      const files = new Directory(recordingsPath).list();
      const audioData = files.map(file => {
        return {
          uri: file.uri,
          name: file.name
        }
      });
      setAudioFiles(audioData);
    } catch (error) {
      console.log(error);
    } finally {
      console.log('Done.');
    }
  }

  const record = async () => {
    console.log('Starting recording.');
    setIsRecording(true);
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  }

  const stopRecording = async () => {
    console.log('Stopping recording.')
    setIsRecording(false);
    await audioRecorder.stop();
    const uri = audioRecorder.uri;
    if (!uri) return;
    console.log(`Recording available at ${uri}.`);
    const recordingsPath = Paths.document.uri + '/recordings/';
    const recordingsDir = new Directory(recordingsPath);
    if (!recordingsDir.exists) {
      recordingsDir.create();
    }
    const audioFile = new File(uri);
    audioFile.move(recordingsDir);
    setAudioFiles(prev => [...prev, audioFile])
    setRecordingURI(uri);
  }

  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        console.log('Permission to access microphone was denied.');
        setPermissions(false);
        return;
      }

      setPermissions(true);

      setAudioModeAsync({
        playsInSilentMode: false,
        allowsRecording: true,
      });
    })();
  }, []);

  if (!permissions) {
    return <SafeAreaView style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Text>Permission to use microphone not granted yet.</Text>
    </SafeAreaView>
  }

  const setName = () => {
    return;
  }

  const saveEdit = (index: number) => {
    const file = audioFiles[index];
    const dir = Paths.document.uri + '/recordings/';

    // keep extension
    const ext = file.name.split('.').pop();
    const newName = `${editText}.${ext}`;
    const newPath = dir + newName;

    try {
      const f = new File(file.uri);
      f.move(new File(newPath));

      setAudioFiles(prev => {
        const updated = [...prev];
        updated[index] = { uri: newPath, name: newName };
        return updated;
      });
    } catch (error) {
      console.log('Rename failed:', error);
    }

    setEditIndex(null);
    setEditText('');
  }

  return (
    <SafeAreaView style={{ display: 'flex', flex: 1, justifyContent: 'flex-start', alignItems: 'center', gap: 20, backgroundColor: '#E3FFFF' }}>
      <View style={style.titleContainer}>
        <MaterialIcons size={30} name='mic' />
        <Text style={{ fontSize: 30, fontWeight: '500' }}>Voice Recorder</Text>
      </View>
      <View style={{ height: 2, width: '85%', backgroundColor: 'lightgrey', opacity: 55 }}></View>
      <TouchableOpacity onPress={recorderState.isRecording ? stopRecording : record} style={[style.button, { backgroundColor: isRecording ? 'red' : 'white' }]}>
        <MaterialIcons size={30} name='mic' />
        <Text style={{ fontSize: 24 }}>{recorderState.isRecording ? 'Stop recording' : 'Start recording'}</Text>
      </TouchableOpacity>
      <ScrollView
        style={style.entryContainer}
        contentContainerStyle={{ alignItems: 'center', justifyContent: 'flex-start', gap: 7, paddingTop: 15, paddingBottom: 15 }}>
        {audioFiles && (
          <>
            {audioFiles.map((file, index) => {
              const isEditingThis = editIndex === index;
              return (
                <View key={file.uri} style={style.entry}>
                  {!isEditingThis ? (
                    <Text style={{ color: '#004F98', fontSize: 18 }}>{file.name.slice(0, 15)}</Text>
                  ) : (
                    <TextInput
                      style={{ color: '#004F98', fontSize: 18, padding: 0 }}
                      value={editText}
                      onChangeText={setEditText}
                    />
                  )}
                  {!isEditingThis ? (
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => {
                        player.replace(file.uri);
                        player.seekTo(0);
                        player.play();
                      }}>
                        <MaterialIcons size={25} name='play-arrow' />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        // Edit audio file name
                        setEditIndex(index);
                        setEditText(file.name.slice(0, 15));
                      }}>
                        <MaterialIcons size={25} name='edit' />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        // Delete audio file
                        new File(file.uri).delete();
                        console.log('Deleted recording.');
                        setAudioFiles(prev => prev.filter(f => f.uri !== file.uri));
                      }}>
                        <MaterialIcons size={25} name='delete' />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={() => {
                        // confirm changes
                        saveEdit(index);
                      }}>
                        <MaterialIcons size={25} name='check' color={'green'} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => {
                        // deny changes
                        setEditIndex(null);
                        setEditText('');
                      }}>
                        <MaterialIcons size={25} name='clear' color={'red'} />
                      </TouchableOpacity>
                    </View>
                  )}

                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const style = StyleSheet.create({
  titleContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: '10%'
  },
  button: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 80,
    width: '85%',
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 10,
  },
  entry: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 10,
    width: '90%',
    height: 60,
    paddingLeft: 10,
    paddingRight: 10,
    backgroundColor: '#fff'
  },
  entryContainer: {
    display: 'flex',
    maxHeight: 250,
    width: '85%',
    borderColor: 'lightgrey',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 10,
  }
})