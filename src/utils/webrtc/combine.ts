export function combineAudioStream(streams: MediaStream[]): MediaStream {
    const audioContext = new AudioContext();

    const dest = audioContext.createMediaStreamDestination();
    const streamList = streams.map((stream) =>
        audioContext.createMediaStreamSource(stream)
    );
    streamList.forEach((source) => source.connect(dest));

    return dest.stream;
}
