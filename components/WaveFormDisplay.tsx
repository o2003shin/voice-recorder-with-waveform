import { useEffect, useState } from "react";
import { View } from "react-native";

export default function WaveFormDisplay(props: { latestDecible: React.RefObject<number | null>, recordingInProgress: boolean }) {
    const { latestDecible, recordingInProgress } = props;
    const [waveformHeights, setWaveformHeights] = useState<number[]>([]);
    const maxBars = 15;

    useEffect(() => {
        if (!recordingInProgress) {
            setWaveformHeights([])
            return;
        }
        setWaveformHeights([]);

        let waveformBuffer: number[] = [];
        const interval = setInterval(() => {
            if (latestDecible.current != null) {
                const normalized = Math.max(0, Math.min(1, (latestDecible.current + 60) / 60));
                const variation = 0.2 + Math.random() * 0.5;
                const height = normalized * 60 * variation;

                waveformBuffer.push(height);
                if (waveformBuffer.length > maxBars) waveformBuffer.shift();

                setWaveformHeights([...waveformBuffer]);
            }
        }, 120);

        return () => clearInterval(interval);
    }, [recordingInProgress]);

    return (
        <View style={{
            height: 150,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            width: '85%',
            borderRadius: 10,
            borderWidth: 2,
            borderColor: 'black',
            backgroundColor: '#fff'
            
        }}>
            {waveformHeights.map((height, index) => (
                <View
                    key={index}
                    style={{
                        width: 8,
                        height: height * 3,
                        backgroundColor: '#007AFF',
                        borderRadius: 10
                    }}>
                </View>
            ))}
        </View>
    )
}