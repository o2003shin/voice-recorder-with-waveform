import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioRecorder,
  useAudioRecorderState
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Button, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { createNavigationContainerRef } from '@react-navigation/native';

export default function Index() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [permissions, setPermissions] = useState<boolean>(false);
  const [recordingURI, setRecordingURI] = useState<string | null>(null);
  const player = useAudioPlayer();

  const playRecording = async () => {
    console.log('Playing recording.');
    if (!recordingURI) {
      console.log('Nothing found');
      return;
    }
    try {
      player.replace(recordingURI);
      player.seekTo(0)
      player.play();
    } catch (error) {
      console.error(error);
    }
  }

  const record = async () => {
    console.log('Starting recording.');
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
  }

  const stopRecording = async () => {
    console.log('Stopping recording.')
    await audioRecorder.stop();
    const uri = audioRecorder.uri;
    console.log(`Recording available at ${uri}.`);
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

  return (
    <SafeAreaView style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <View style={style.titleContainer}>
        <MaterialIcons size={30} name='mic' />
        <Text style={{ fontSize: 30, fontWeight: '500' }}>Voice Recorder</Text>
      </View>
      <View style={{ height: 2, width: '95%', backgroundColor: 'grey', opacity: 55}}></View>
      <View style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20 }}>
        <TouchableOpacity onPress={recorderState.isRecording ? stopRecording : record} style={style.button}>
          <MaterialIcons size={30} name='mic' />
          <Text style={{ fontSize: 24}}>{recorderState.isRecording ? 'Stop recording' : 'Start recording'}</Text>
        </TouchableOpacity>
        {recordingURI && !recorderState.isRecording && <Button title="Play Sound" onPress={playRecording} />}
      </View>
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
    width: 350,
    borderColor: 'black',
    borderWidth: 2,
    borderRadius: 10,
  }
})